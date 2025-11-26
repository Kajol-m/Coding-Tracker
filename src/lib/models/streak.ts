import mongoose, { Schema } from "mongoose";

const StreakSchema = new Schema({
  user_id: { type: String, required: true, index: true, unique: true },
  maxStreak: { type: Number, default: 0 },
});

export default mongoose.models.Streak || mongoose.model("Streak", StreakSchema);
