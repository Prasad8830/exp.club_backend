import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Habit = mongoose.model("Habit", habitSchema);
