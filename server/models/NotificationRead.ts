import mongoose from "mongoose";

const notificationReadSchema = new mongoose.Schema(
  {
    notification: { type: mongoose.Schema.Types.ObjectId, ref: "Notification", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

notificationReadSchema.index({ notification: 1, user: 1 }, { unique: true });
notificationReadSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("NotificationRead", notificationReadSchema);
