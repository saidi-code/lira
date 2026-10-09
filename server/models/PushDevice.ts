import mongoose from "mongoose";

const pushDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["ios", "android"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model("PushDevice", pushDeviceSchema);
