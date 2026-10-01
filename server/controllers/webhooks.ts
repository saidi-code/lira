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
//     therefore another retry. Hence the single upsert rather than
//     find-then-create.
//
// The mapping itself lives in services/clerkUserMapper.ts so it can be tested
// without a Clerk secret or a database.
// ==========================================
import { verifyWebhook } from "@clerk/express/webhooks";
import { Request, Response } from "express";
import User from "../models/User.js";
import { planForClerkEvent, type ClerkEventLike } from "../services/clerkUserMapper.js";

const clerkWebhook = async (req: Request, res: Response) => {
  try {
    const evt = (await verifyWebhook(req)) as ClerkEventLike;
    const plan = planForClerkEvent(evt);

    switch (plan.kind) {
      case "upsert": {
        const { role, ...profile } = plan.data;

        // A role synced from Clerk is authoritative and must overwrite a stale
        // local value — but an *absent* role must NOT reset someone who was
        // promoted directly in the database.
        const set: Record<string, unknown> = { ...profile };
        if (role) set.role = role;

        // One upsert rather than find-then-create: a Clerk retry landing between
        // a read and a write would otherwise create a second document, trip the
        // unique index, 400, and be retried again.
        await User.findOneAndUpdate(
          { clerkId: plan.data.clerkId },
          { $set: set },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        break;
      }

      case "delete": {
        // The Clerk account is gone, so the local cache is meaningless. Orders
        // and addresses keep referencing the user, so the document is removed
        // rather than marked — a soft delete would leave `protect` matching a
        // user who can no longer sign in.
        await User.deleteOne({ clerkId: plan.clerkId });
        break;
      }

      case "ignore":
        // Not an error: Clerk sends many event types we have no use for, and
        // answering 200 is what stops them being retried forever.
        break;
    }

    return res.json({ success: true, message: "Webhook received" });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send("Error verifying webhook");
  }
};

export default clerkWebhook;