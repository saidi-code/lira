import { useCallback, useEffect, useRef, useState } from "react";
import {
  SignIn,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";
// CartLine / ShopProduct / PlaceOrderResult / PrinterStatus come from the
// ambient bridge.d.ts (global scope).

const POS_PICKUP_ADDRESS = {
  type: "POS",
  street: "In-store pickup (desktop-cashier)",
  city: "POS",
  state: "POS",
  zipCode: "0000",
  phoneNumber: "00000000",
};

function cartLines(items: CartLine[]): CartLine[] {
  return Array.isArray(items) ? items : [];
}

function lineName(line: CartLine): string {
  if (typeof line.product === "object" && line.product?.name) return line.product.name;
  return line.name ?? "Item";
}

function linePrice(line: CartLine): number {
  if (typeof line.product === "object" && typeof line.product?.price === "number") {
    return line.product.price;
  }
  return typeof line.price === "number" ? line.price : 0;
}

function lineProductId(line: CartLine): string {
  if (typeof line.product === "object" && line.product?._id) return line.product._id;
  if (typeof line.product === "string") return line.product;
  return line.productId;
}

function orderLines(items: CartLine[]): { product: string; quantity: number }[] {
  return cartLines(items).map((l) => ({ product: lineProductId(l), quantity: l.quantity }));
}

function receiptFor(
  items: CartLine[],
  orderRef: string,
  cashier: string,
): string[] {
  const lines = [
    "======== LIRA (POS) ========",
    `Order: ${orderRef}`,
    `Cashier: ${cashier}`,
    `Date: ${new Date().toLocaleString()}`,
    "----------------------------",
  ];
  for (const l of cartLines(items)) {
    const total = (linePrice(l) * l.quantity).toFixed(2);
    lines.push(`${l.quantity} x ${lineName(l)} ... ${total}`);
  }
  const grand = cartLines(items)
    .reduce((sum, l) => sum + linePrice(l) * l.quantity, 0)
    .toFixed(2);
  lines.push("----------------------------", `TOTAL: ${grand} TND`, "Payment: cash", "Thank you!");
  return lines;
}

/**
 * POS shell (spec §8): signed-in cashier, printer status, scanner-ready main
 * area.
 */
function PosShell() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [printer, setPrinter] = useState<PrinterStatus | null>(null);
  const [apiOk, setApiOk] = useState(true);

  // ---- test-mode POS state (no scanner/printer hardware) ----
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShopProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartBusy, setCartBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<string[] | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Spec §8 auth: hand the Clerk session JWT to the preload so every backend
  // call (`/cart`, `/orders`, …) goes out with `Authorization: Bearer …`.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!cancelled && typeof window.api !== "undefined") {
          window.api.setToken(token);
        }
      } catch {
        /* offline / signed out mid-flight — backend will 401 and UI can retry */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const refreshCart = useCallback(async () => {
    if (typeof window.api === "undefined") return;
    try {
      const res = await window.api.getCart();
      setCart(cartLines(res.data?.items ?? []));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not load cart");
    }
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (typeof window.api === "undefined") return;
    setSearching(true);
    setNotice(null);
    try {
      const res = q.trim()
        ? await window.api.searchProducts(q.trim(), 20)
        : await window.api.listProducts(20);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Initial catalogue + cart on mount.
  useEffect(() => {
    if (typeof window.api === "undefined") return;
    void runSearch("");
    void refreshCart();
  }, [runSearch, refreshCart]);

  useEffect(() => {
    if (typeof window.api === "undefined") {
      setApiOk(false);
      return;
    }
    let cancelled = false;
    window.api
      .getPrinterStatus()
      .then((status) => {
        if (!cancelled) setPrinter(status);
      })
      .catch(() => {
        if (!cancelled) setPrinter(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = useCallback(async (productId: string) => {
    if (typeof window.api === "undefined") return;
    setCartBusy(true);
    setNotice(null);
    try {
      const res = await window.api.addToCart(productId, 1);
      setCart(cartLines(res.data?.items ?? []));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Add to cart failed");
    } finally {
      setCartBusy(false);
    }
  }, []);

  const handleRemove = useCallback(async (productId: string) => {
    if (typeof window.api === "undefined") return;
    setCartBusy(true);
    try {
      const res = await window.api.removeCartItem(productId);
      setCart(cartLines(res.data?.items ?? []));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setCartBusy(false);
    }
  }, []);

  const handleCheckout = useCallback(async () => {
    if (typeof window.api === "undefined" || cart.length === 0) return;
    setCheckingOut(true);
    setNotice(null);
    setLastOrder(null);
    try {
      const key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? (crypto as { randomUUID(): string }).randomUUID()
          : `pos-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      const res = await window.api.placeOrder(
        {
          items: orderLines(cart),
          shippingAddress: POS_PICKUP_ADDRESS,
          paymentMethod: "cash",
          notes: "POS cash sale (desktop-cashier test mode)",
        },
        key,
      );
      if (!res.success || !res.data) throw new Error(res.message || "Order failed");
      const ref = res.data.orderNumber ?? res.data._id;
      setLastOrder(ref);
      const cashier =
        user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "Cashier";
      setLastReceipt(receiptFor(cart, ref, cashier));
      setCart([]);
      await refreshCart();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }, [cart, refreshCart, user]);

  const handlePrint = useCallback(async () => {
    if (typeof window.api === "undefined" || !lastReceipt) return;
    try {
      const res = await window.api.printReceipt(lastReceipt);
      setNotice(
        res.cancelled
          ? "Print cancelled — receipt kept on screen."
          : res.path
            ? `Receipt saved to ${res.path}`
            : "Receipt sent to printer.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Print failed");
    }
  }, [lastReceipt]);

  const total = cart.reduce((sum, l) => sum + linePrice(l) * l.quantity, 0);

  const printerBadge = !apiOk ? (
    <span className="err">✗ preload bridge missing</span>
  ) : printer ? (
    <span className={printer.status === "ready" ? "ok" : "err"}>
      {printer.status === "ready" ? "✓" : "✗"} {printer.model} • {printer.driver}
    </span>
  ) : (
    <span className="err">✗ printer status unavailable</span>
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">🇱🇷 Lira Cashier</div>
        <div className="user">{isLoaded ? user?.fullName ?? user?.username ?? "Cashier" : "…"}</div>
        <div className="printer">{printerBadge}</div>
        {/* Account menu → includes sign-out (spec §8 flow starts at login). */}
        <div className="account">
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <div className="test-banner" role="status">
        TEST MODE — no scanner / printer needed. Search below, add to cart,
        checkout, then “Save receipt” writes a .txt file.
      </div>
      {notice && (
        <p className="notice err" role="alert">
          {notice}
        </p>
      )}
      <main className="pos-main">
        <section className="pos-col" aria-label="Catalogue search">
          <h2>1 · Find products</h2>
          <div className="scanner-slot">
            <input
              type="text"
              placeholder="Type name / SKU, Enter to search…"
              autoFocus
              value={query}
              disabled={typeof window.api === "undefined"}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch(query);
              }}
            />
            <button
              type="button"
              className="btn"
              disabled={searching || typeof window.api === "undefined"}
              onClick={() => void runSearch(query)}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          <ul className="product-list">
            {results.map((p) => (
              <li key={p._id} className="product-row">
                <div className="product-info">
                  <strong>{p.name}</strong>
                  <div className="muted small">
                    {p.price.toFixed(2)} TND
                    {typeof p.stock === "number" ? ` · stock ${p.stock}` : ""}
                    {p.sku ? ` · ${p.sku}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={cartBusy}
                  onClick={() => void handleAdd(p._id)}
                >
                  Add
                </button>
              </li>
            ))}
            {!searching && results.length === 0 && (
              <li className="muted">No products — try another search.</li>
            )}
          </ul>
        </section>
        <section className="pos-col" aria-label="Cart and checkout">
          <h2>2 · Cart &amp; checkout</h2>
          {cart.length === 0 ? (
            <p className="muted">Cart is empty.</p>
          ) : (
            <>
              <ul className="cart-list">
                {cart.map((l) => (
                  <li key={lineProductId(l)} className="cart-row">
                    <span>
                      {l.quantity} × {lineName(l)} — {(linePrice(l) * l.quantity).toFixed(2)} TND
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={cartBusy}
                      onClick={() => void handleRemove(lineProductId(l))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <p className="total">TOTAL: {total.toFixed(2)} TND · cash</p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={checkingOut || cartBusy}
                onClick={() => void handleCheckout()}
              >
                {checkingOut ? "Placing order…" : "Checkout (cash)"}
              </button>
            </>
          )}
          {lastOrder && (
            <div className="receipt-box">
              <h3>✓ Order {lastOrder} placed</h3>
              {lastReceipt && <pre className="receipt">{lastReceipt.join("\n")}</pre>}
              <button type="button" className="btn" onClick={() => void handlePrint()}>
                Save receipt (.txt)
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/**
 * Auth window (spec §8 flow step 1): cashier signs in through Clerk before
 * touching the POS. `routing="hash"` keeps it router-less (Electron SPA).
 */
function AuthWindow() {
  return (
    <div className="app auth-window">
      <header className="app-header">
        <div className="brand">🇱🇷 Lira Cashier</div>
        <div className="user">Sign in required — role: cashier</div>
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorPrimary: "#D4AF37",
                colorBackground: "#1C1917",
                colorText: "#FAF7F2",
                colorInputBackground: "#292524",
                colorInputText: "#FAF7F2",
              },
            }}
          />
        </div>
        <p className="auth-hint">
          Backend validates <code>role === "cashier"</code>.
        </p>
      </main>
    </div>
  );
}

function BootScreen({ message }: { message: string }) {
  return (
    <div className="app boot-screen">
      <div className="brand">🇱🇷 Lira Cashier</div>
      <p>{message}</p>
    </div>
  );
}

function AuthUnavailable() {
  return (
    <div className="app boot-screen">
      <div className="brand">🇱🇷 Lira Cashier</div>
      <p className="err">✗ Auth unavailable — missing VITE_CLERK_PUBLISHABLE_KEY</p>
      <p className="auth-hint">
        Set it in <code>apps/desktop-cashier/.env</code> (copy from <code>server/.env</code>) and
        restart <code>npm run dev</code>.
      </p>
    </div>
  );
}

function WrongRole({ signOut }: { signOut: () => Promise<void> }) {
  return (
    <div className="app auth-window">
      <header className="app-header">
        <div className="brand">🇱🇷 Lira Cashier</div>
        <div className="user">Cashier account required</div>
      </header>
      <main className="auth-main">
        <p className="auth-hint">
          This account belongs to another Lira app. Sign out and open the app
          assigned to your role.
        </p>
        <button type="button" className="btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </main>
    </div>
  );
}

/** Auth and role gate: only cashier accounts mount the POS or its API effects. */
function ClerkGate() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  if (!isLoaded || !isUserLoaded) return <BootScreen message="Loading auth…" />;
  if (!isSignedIn) return <AuthWindow />;
  if (user?.publicMetadata?.role !== "cashier") {
    return <WrongRole signOut={signOut} />;
  }
  return <PosShell />;
}

export default function App({ clerk }: { clerk: boolean }) {
  return clerk ? <ClerkGate /> : <AuthUnavailable />;
}

