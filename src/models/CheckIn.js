import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    frequency: { type: String, enum: ["daily", "weekly"], required: true },
    periodStart: { type: Date, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

checkInSchema.index({ habitId: 1, periodStart: 1 }, { unique: true });

export const CheckIn = mongoose.model("CheckIn", checkInSchema);
