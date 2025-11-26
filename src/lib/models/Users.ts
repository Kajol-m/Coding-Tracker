import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IUser extends Document {
  user_id: string;
  user_name: string;
  email: string;
  password?: string;
  provider: "local" | "google";
}

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
