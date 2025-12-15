import { z } from "zod";
import { Habit } from "../models/Habit.js";
import { CheckIn } from "../models/CheckIn.js";
import { computeStreak, periodStartForFrequency } from "../utils/period.js";

const habitSchema = z.object({
  name: z.string().min(1).max(80),
  frequency: z.enum(["daily", "weekly"]),
  category: z.string().min(1).max(50).optional().or(z.literal("")),
});

function calculateCompletionRate(habit, checkIns) {
  const now = new Date();
  const created = new Date(habit.createdAt);
  const dayMs = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.max(1, Math.floor((now - created) / dayMs) + 1);
  const elapsedWeeks = Math.max(1, Math.floor(elapsedDays / 7));
  const numerator = checkIns.length;
  const denominator = habit.frequency === "weekly" ? elapsedWeeks : elapsedDays;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

export async function listHabits(req, res) {
  const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
  const ids = habits.map((h) => h._id);
  const checkIns = await CheckIn.find({ habitId: { $in: ids } });
  const grouped = checkIns.reduce((acc, ci) => {
    const key = ci.habitId.toString();
    acc[key] = acc[key] || [];
    acc[key].push(ci);
    return acc;
  }, {});
  const withStats = habits.map((habit) => {
    const streak = computeStreak(grouped[habit.id] || [], habit.frequency);
    const completionRate = calculateCompletionRate(habit, grouped[habit.id] || []);
    return { ...habit.toObject(), streak, completionRate };
  });
  return res.json({ habits: withStats });
}

export async function createHabit(req, res) {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid habit" });
  try {
    const habit = await Habit.create({ ...parsed.data, userId: req.user.id });
    return res.status(201).json({ habit });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Habit name already exists" });
    }
    // eslint-disable-next-line no-console
    console.error("create habit error", err);
    return res.status(500).json({ error: "Failed to create habit" });
  }
}

export async function updateHabit(req, res) {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid habit" });
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      parsed.data,
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: "Habit not found" });
    return res.json({ habit });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Habit name already exists" });
    }
    // eslint-disable-next-line no-console
    console.error("update habit error", err);
    return res.status(500).json({ error: "Failed to update habit" });
  }
}

export async function deleteHabit(req, res) {
  await Habit.deleteOne({ _id: req.params.id, userId: req.user.id });
  await CheckIn.deleteMany({ habitId: req.params.id, userId: req.user.id });
  return res.status(204).end();
}

export async function checkInHabit(req, res) {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
  if (!habit) return res.status(404).json({ error: "Habit not found" });
  const periodStart = periodStartForFrequency(new Date(), habit.frequency);
  try {
    const checkIn = await CheckIn.create({
      userId: req.user.id,
      habitId: habit.id,
      frequency: habit.frequency,
      periodStart,
    });
    return res.status(201).json({ checkIn });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Already checked in for this period" });
    }
    // eslint-disable-next-line no-console
    console.error("checkin error", err);
    return res.status(500).json({ error: "Failed to check in" });
  }
}

export async function undoCheckIn(req, res) {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
  if (!habit) return res.status(404).json({ error: "Habit not found" });
  const periodStart = periodStartForFrequency(new Date(), habit.frequency);
  await CheckIn.deleteOne({ habitId: habit.id, userId: req.user.id, periodStart });
  return res.status(204).end();
}
