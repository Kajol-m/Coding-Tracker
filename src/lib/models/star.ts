import mongoose, { Schema } from "mongoose";

const StarSchema = new Schema({
  user_id: { type: String, required: true, index: true },
  date: { type: String, required: true }, // yyyy-MM-dd
  questions: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  inJar: { type: Boolean, default: true },
}, { timestamps: true });

StarSchema.index({ user_id: 1, date: 1 }, { unique: true });

export default mongoose.models.Star || mongoose.model("Star", StarSchema);
