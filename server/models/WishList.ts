import mongoose from "mongoose";

const WishListSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            addedAt: { type: Date, default: Date.now },
        },
    ],
});
const WishList = mongoose.model("WishList", WishListSchema);

export default WishList;