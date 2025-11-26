import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  languages: { type: [String], default: [] },
});

const DailyEntrySchema = new Schema({
  user_id: { type: String, required: true, index: true },
  date: { type: String, required: true }, // yyyy-MM-dd
  status: { type: String, enum: ["done","planned","not-done"], default: "planned" },
  questions: { type: [QuestionSchema], default: [] },
  languages: { type: [String], default: [] }, // flattened for quick queries
}, { timestamps: true });

DailyEntrySchema.index({ user_id: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyEntry || mongoose.model("DailyEntry", DailyEntrySchema);
