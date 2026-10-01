// controllers/webhooks.ts
// ==========================================
// CLERK WEBHOOK — creates and maintains the local `User` cache.
//
// `protect` looks users up by `clerkId`, so a missed or crashed event locks a
// real customer out. Two properties matter more than anything else here:
//
//   * It must never throw on the shape of the data. Clerk allows phone-only
//     accounts and accounts with no name at all; the original handler assumed
//     both existed, so a single such signup threw, returned 400, and made Clerk
//     retry the same event indefinitely.
//   * It must be idempotent. Clerk retries on any non-2xx, and a retry that
//     lands between the handler's read and its write would create a second
//     document — a unique-index violation, and therefore another 400, and
//     therefore another retry. Hence a single upsert.
//
// The mapping lives in `services/clerkUserMapper.ts` and the write behind a
// `UserWriter`, so both are testable without a Clerk secret or a live database.
// ==========================================
import { verifyWebhook } from "@clerk/express/webhooks";
import { Request, Response } from "express";
import User from "../models/User.js";
import {
  applyUserPlan,
  planForClerkEvent,
  type ClerkEventLike,
  type UserWriter,
} from "../services/clerkUserMapper.js";

const clerkWebhook = async (req: Request, res: Response) => {
  try {
    const evt = (await verifyWebhook(req)) as ClerkEventLike;

    await applyUserPlan(planForClerkEvent(evt), {
      upsert: (data) =>
        User.findOneAndUpdate(
          { clerkId: data.clerkId },
          { $set: data },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            // `findOneAndUpdate` does not validate by default. Clerk's
            // `publicMetadata.role` is hand-edited in a dashboard, so a typo
            // ("manage", "adminn") would otherwise be stored happily — and
            // `authorize` checks against `USER_ROLES`, so that user would then
            // be refused by every staff route with no explanation anywhere.
            runValidators: true,
          }
        ),
      remove: (clerkId) => User.deleteOne({ clerkId }),
    } satisfies UserWriter);

    return res.json({ success: true, message: "Webhook received" });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send("Error verifying webhook");
  }
};

export default clerkWebhook;