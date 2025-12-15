import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    provider: { type: String, enum: ["google"], default: "google" },
    googleId: { type: String, index: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
