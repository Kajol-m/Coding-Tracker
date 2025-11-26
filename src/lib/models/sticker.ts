import mongoose, { Schema } from "mongoose";

const StickerSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  stickerId: { type: Number, required: true },
  name: String,
  image: String,
  earnedDate: { type: Date, default: Date.now },
}, { timestamps: true });

StickerSchema.index({ user_id: 1, stickerId: 1 }, { unique: true });

export default mongoose.models.Sticker || mongoose.model("Sticker", StickerSchema);
