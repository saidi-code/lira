// tests/integration/cartConcurrency.integration.test.ts
// ==========================================
//   The audit that found this: after the wishlist's check-then-write was fixed,
//   the question was whether anything else had the same shape. Two things did,
//   and this is the more serious of them.
//
//   `addToCart` reads the whole cart document, mutates the array in memory, then
//   saves it back:
//
//       const cart = await Cart.findOne({ user });
//       const existing = cart.items.find(…);
//       existing ? existing.quantity += n : cart.items.push(…)
//       await cart.save();
//
//   That is a read-modify-write on a document, and MongoDB applies no locking to
//   it. Two adds that overlap both read the same starting quantity, both add
//   their own, and the second `save()` overwrites the first's work. The customer
//   adds 2 then 1 of the same item and the cart says 1.
//
//   Worse than the wishlist duplicate in two ways: it is *loss* rather than a
//   visible duplicate, and the client triggers it trivially. `useCart` exposes
//   `loading`, but the add button does not disable itself while a mutation is in
//   flight, so a double-tap on "add to bag" is enough.
//
//   It is also not fixable with the filter-guard trick used for the wishlist. An
//   increment has to be applied by the database, because the value being written
//   is a function of the value already stored. Anything that computes the new
//   quantity in Node and writes it back can lose an update.
//   ==========================================
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import express from "express";
import mongoose from "mongoose";

import Cart from "../../models/Cart.js";
import Product from "../../models/Products.js";
import { addToCart, updateCartItem, deleteCartItem } from "../../controllers/CartController.js";
import { errorHandler, notFoundHandler } from "../../middlewares/errorHandler.js";
import { MongoMemoryServer, LAUNCH_TIMEOUT_MS } from "./mongod.js";

let mongod: MongoMemoryServer;
let base: string;
let userId: string;
let server: ReturnType<typeof import("node:http").createServer>;

const asUser = (id: string) => (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  (req as express.Request & { user?: unknown }).user = {
    _id: new mongoose.Types.ObjectId(id),
    role: "user",
  };
  next();
};

const seedProduct = (stock = 50) =>
  Product.create({
    name: "Test perfume",
    subtitle: "a subtitle",
    description: "a description",
    brand: "lyra",
    category: new mongoose.Types.ObjectId(),
    subCategory: "man",
    sku: `SKU-${new mongoose.Types.ObjectId().toString()}`,
    price: 100,
    stock,
    type: "simple",
    images: ["https://example.test/a.jpg"],
    colors: [],
  });

const post = (root: string, productId: string, quantity: number) =>
  fetch(`${root}/cart/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });

const add = (productId: string, quantity: number) => post(base, productId, quantity);

const quantityOf = async (user: string, productId: string): Promise<number | undefined> => {
  const cart = await Cart.findOne({ user }).lean();
  const line = cart?.items?.find(
    (item: { product?: unknown }) => String(item?.product ?? "") === productId
  );
  return line?.quantity;
};
/** A second server on its own port, so a second user can be exercised. */
const withFreshUser = async <T,>(
  run: (freshBase: string, freshUserId: string) => Promise<T>
): Promise<T> => {
  const freshUserId = new mongoose.Types.ObjectId().toString();
  const app = express();
  app.use(express.json());
  app.post("/cart/add", asUser(freshUserId), addToCart);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const s = app.listen(0);
  await new Promise<void>((resolve) => s.once("listening", resolve));
  const addr = s.address();
  const freshBase = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
  try {
    return await run(freshBase, freshUserId);
  } finally {
    s.closeAllConnections();
    await new Promise<void>((resolve) => s.close(() => resolve()));
  }
};

before(async () => {
  mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: LAUNCH_TIMEOUT_MS },
  });
  await mongoose.connect(mongod.getUri());

  const app = express();
  app.use(express.json());
  userId = new mongoose.Types.ObjectId().toString();
  app.post("/cart/add", asUser(userId), addToCart);
  app.put("/cart/item/:productId", asUser(userId), updateCartItem);
  app.delete("/cart/item/:productId", asUser(userId), deleteCartItem);
  app.use(notFoundHandler);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await mongod.stop();
});

describe("adding the same line to the cart at the same time", () => {
  it("adds up every quantity rather than keeping only the last", async () => {
    const product = await seedProduct();
    const id = String(product._id);

    // 2, then two adds of 1 together. A lost update leaves 2 or 3, never 4.
    await add(id, 2);
    await Promise.all([add(id, 1), add(id, 1)]);

    assert.equal(
      await quantityOf(userId, id),
      4,
      "2 + 1 + 1 should be 4; a lost update loses one of them"
    );
  });

  it("does not lose an update when several arrive together on an empty cart", async () => {
    const product = await seedProduct();
    const id = String(product._id);

    // A different user, so the cart genuinely starts absent and every request
    // takes the "no cart yet" branch — each building one from `items: []`.
    await withFreshUser(async (freshBase, freshUserId) => {
      await Promise.all([
        post(freshBase, id, 1),
        post(freshBase, id, 1),
        post(freshBase, id, 1),
      ]);

      assert.equal(
        await Cart.countDocuments({ user: freshUserId }),
        1,
        "one cart, not several racing to create one"
      );
      assert.equal(await quantityOf(freshUserId, id), 3, "three adds of 1 should total 3");
    });
  });
});

// ---------------------------------------------------------------------
// The other half of the same audit. `addToCart` was the only read-modify-write
// I rewrote; `updateCartItem` and `deleteCartItem` still do this:
//
//     const cart = await Cart.findOne({ user });
//     …mutate cart.items in Node…
//     cart.calculateTotal();
//     await cart.save();
//
// An earlier note in this file claimed `save()` writes the whole document and
// therefore loses concurrent line changes. Measuring it said otherwise: Mongoose
// sends only dirty paths, so quantities survived a forced interleaving 40/40.
// The casualty is the *derived* total — `calculateTotal()` sums a Node-side copy
// that may predate another request, and that stale sum is what gets written.
// See the second describe below, which pins it deterministically.
//
// Two concurrent *updates* are not a bug on their own: the client sends an
// absolute quantity (`useCart` passes `quantity = arg2`, and routes anything
// below 1 to `removeFromCart`), so last-write-wins is the correct meaning of
// "set this line to 5". The race is against a *different* request.
// ---------------------------------------------------------------------

const seedPair = async (): Promise<[string, string]> => {
  const a = await seedProduct();
  const b = await seedProduct();
  await add(String(a._id), 1);
  await add(String(b._id), 1);
  return [String(a._id), String(b._id)];
};

const put = (productId: string, quantity: number) =>
  fetch(`${base}/cart/item/${productId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ quantity }),
  });

const del = (productId: string) => fetch(`${base}/cart/item/${productId}`, { method: "DELETE" });

const storedCart = async (user: string) => (await Cart.findOne({ user }).lean()) ?? null;

const storedTotal = async (user: string): Promise<number | undefined> =>
  (await storedCart(user))?.totalAmount;

const storedLines = async (user: string) => (await storedCart(user))?.items ?? [];

/**
 * The invariant under test: the stored total must equal what the stored lines
 * add up to. Computed from the database rather than a hardcoded number, because
 * this file shares one user across every test — the cart accumulates lines, so a
 * literal total would encode the wrong expectation.
 */
const sumOf = (lines: { price?: number; quantity?: number }[]): number =>
  lines.reduce((total, line) => total + (line.price ?? 0) * (line.quantity ?? 0), 0);

describe("updating or deleting one line while another request adds to the cart", () => {
  it("keeps the concurrent add when another line is updated", async () => {
    const [a, b] = await seedPair();

    await Promise.all([put(a, 5), add(b, 3)]);

    assert.equal(await quantityOf(userId, b), 4, "B was 1, +3 should be 4");
    assert.equal(await quantityOf(userId, a), 5, "A should be 5");
  });

  it("keeps the concurrent add when another line is deleted", async () => {
    const [a, b] = await seedPair();

    await Promise.all([del(a), add(b, 3)]);

    assert.equal(await quantityOf(userId, b), 4, "B was 1, +3 should be 4");
    assert.equal(await quantityOf(userId, a), undefined, "A should be gone");
  });

  it("keeps the concurrent add when two other lines are deleted at once", async () => {
    const [a, b] = await seedPair();
    const c = String((await seedProduct())._id);
    await add(c, 1);

    // Deleting two other lines at once is the worst case for a whole-array
    // write: each delete rewrites `items` from its own copy. Neither may cost
    // the add.
    await Promise.all([del(a), del(c), add(b, 3)]);

    assert.equal(await quantityOf(userId, b), 4, "B was 1, +3 should be 4");
    assert.equal(await quantityOf(userId, a), undefined, "A should be gone");
    assert.equal(await quantityOf(userId, c), undefined, "C should be gone");
  });
});

// ---------------------------------------------------------------------
// Deterministic version of the same race.
//
// The three tests above pass on the *broken* code — `Promise.all` does not
// reliably land inside the read-to-save window, and a test that only passes
// sometimes is not a regression test. So the interleaving is forced here at the
// exact point it can occur: `post('findOne')` runs once the handler has read
// the cart and before it writes back, so the add lands in the window.
//
// What is being measured is the *derived* total, not the lines. Mongoose sends
// only dirty paths, so quantities survived the forced interleaving 40/40 while
// `totalAmount` was wrong 40/40: `calculateTotal()` summed a Node-side array
// that did not know about the add, and `save()` wrote that sum back over one the
// concurrent request had already recalculated.
//
// The seam is `post('findOne')` rather than `pre('save')` because running a
// write inside `save()` trips Mongoose optimistic concurrency: the handler's
// save then fails with VersionError, which is a different (and, for this
// question, irrelevant) behaviour.
// ---------------------------------------------------------------------
describe("the derived cart total under a forced interleaving", () => {
  let armed = false;
  let seamProductId = "";

  const realFindOne = Cart.findOne.bind(Cart);

  const concurrentAdd = async () => {
    await Cart.updateOne(
      { user: userId, "items.product": seamProductId } as any,
      { $inc: { "items.$.quantity": 3 } }
    );
    await Cart.updateOne(
      { user: userId } as any,
      [
        {
          $set: {
            totalAmount: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$items", []] },
                  as: "line",
                  in: { $multiply: ["$$line.price", { $ifNull: ["$$line.quantity", 0] }] },
                },
              },
            },
          },
        },
      ],
      { updatePipeline: true } as any
    );
  };

  // Every handler under test starts `const cart = await Cart.findOne({ user })`.
  // Patching that one call to run the add just before it resolves reproduces the
  // interleaving exactly: read -> concurrent add -> save.
  //
  // A schema hook cannot do this. `Cart.schema.post("findOne", …)` registered
  // after `mongoose.model()` never fires — verified: Mongoose bakes query
  // middleware into the model when it is compiled, so a hook added later from a
  // test file is silently ignored. A silent no-op seam is worse than none,
  // because the test still runs and reports something.
  const installSeam = () => {
    (Cart as any).findOne = (...args: any[]) => {
      const q: any = (realFindOne as any)(...args);
      const realThen = q.then.bind(q);
      q.then = (onFul: any, onRej: any) =>
        realThen(
          async (doc: any) => {
            if (armed) {
              armed = false; // fire exactly once, so it cannot loop
              await concurrentAdd();
            }
            return typeof onFul === "function" ? onFul(doc) : doc;
          },
          onRej
        );
      return q;
    };
  };
  const restoreSeam = () => {
    (Cart as any).findOne = realFindOne;
  };

  it("leaves totalAmount agreeing with the lines after updateCartItem", async () => {
    const [a, b] = await seedPair();
    seamProductId = b;

    installSeam();
    try {
      armed = true;
      const res = await fetch(`${base}/cart/item/${a}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity: 5 }),
      });
      assert.equal(res.status, 200, "the update itself should succeed");
    } finally {
      armed = false;
      restoreSeam();
    }

    assert.equal(await quantityOf(userId, b), 4, "the concurrent add must survive");
    assert.equal(
      await storedTotal(userId),
      sumOf(await storedLines(userId)),
      "totalAmount must be derived from the stored lines, not from a stale in-memory copy"
    );
  });

  it("leaves totalAmount agreeing with the lines after deleteCartItem", async () => {
    const [a, b] = await seedPair();
    seamProductId = b;

    installSeam();
    try {
      armed = true;
      const res = await fetch(`${base}/cart/item/${a}`, { method: "DELETE" });
      assert.equal(res.status, 200, "the delete itself should succeed");
    } finally {
      armed = false;
      restoreSeam();
    }

    assert.equal(await quantityOf(userId, b), 4, "the concurrent add must survive");
    assert.equal(
      await storedTotal(userId),
      sumOf(await storedLines(userId)),
      "totalAmount must be derived from the stored lines, not from a stale in-memory copy"
    );
  });
});