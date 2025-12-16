import { z } from "zod";
import { Follow } from "../models/Follow.js";
import { CheckIn } from "../models/CheckIn.js";
import { User } from "../models/User.js";
import { Habit } from "../models/Habit.js";
import { computeStreak } from "../utils/period.js";

export async function searchUsers(req, res) {
  const query = (req.query.q || "").toString().trim();
  if (!query) return res.json({ users: [] });
  const users = await User.find({
    _id: { $ne: req.user.id },
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  })
    .select("name email avatarUrl")
    .limit(10);
  return res.json({ users });
}

export async function followUser(req, res) {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot follow yourself" });
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });
    const follow = await Follow.findOneAndUpdate(
      { followerId: req.user.id, followeeId: req.params.id },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json({ follow });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("follow error", err);
    return res.status(500).json({ error: "Failed to follow" });
  }
}

export async function unfollowUser(req, res) {
  await Follow.deleteOne({ followerId: req.user.id, followeeId: req.params.id });
  return res.status(204).end();
}

export async function listFollowing(req, res) {
  const follows = await Follow.find({ followerId: req.user.id }).populate("followeeId", "name email avatarUrl");
  const following = follows.map((f) => ({ id: f.followeeId.id, ...f.followeeId.toObject() }));
  return res.json({ following });
}

export async function feed(req, res) {
  const follows = await Follow.find({ followerId: req.user.id });
  const followeeIds = follows.map((f) => f.followeeId);
  if (!followeeIds.length) return res.json({ feed: [] });
  const recentCheckIns = await CheckIn.find({ userId: { $in: followeeIds } })
    .sort({ completedAt: -1 })
    .limit(50)
    .populate("habitId")
    .populate("userId", "name email avatarUrl");
  const habitIds = [...new Set(recentCheckIns.map((c) => c.habitId?._id?.toString()).filter(Boolean))];
  const habitCheckIns = await CheckIn.find({ habitId: { $in: habitIds } });
  const streaks = habitIds.reduce((acc, hid) => {
    const habitCi = habitCheckIns.filter((c) => c.habitId.toString() === hid);
    const habit = recentCheckIns.find((c) => c.habitId && c.habitId.id === hid)?.habitId;
    if (habit) acc[hid] = computeStreak(habitCi, habit.frequency);
    return acc;
  }, {});
  const feed = recentCheckIns.map((ci) => ({
    id: ci.id,
    completedAt: ci.completedAt,
    user: ci.userId,
    habit: ci.habitId,
    streak: streaks[ci.habitId?.id] || 0,
  }));
  return res.json({ feed });
}

export async function leaderboard(req, res) {
  try {
    // Get all users
    const users = await User.find({}).select("name email avatarUrl");
    
    // Get all habits and check-ins
    const habits = await Habit.find({});
    const checkIns = await CheckIn.find({});
    
    // Calculate stats for each user
    const userStats = users.map((user) => {
      const userHabits = habits.filter((h) => h.userId.toString() === user._id.toString());
      const userCheckIns = checkIns.filter((c) => c.userId.toString() === user._id.toString());
      
      // Calculate max streak across all habits
      let maxStreak = 0;
      userHabits.forEach((habit) => {
        const habitCheckIns = userCheckIns.filter((c) => c.habitId.toString() === habit._id.toString());
        const streak = computeStreak(habitCheckIns, habit.frequency);
        if (streak > maxStreak) maxStreak = streak;
      });
      
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        totalHabits: userHabits.length,
        totalCheckIns: userCheckIns.length,
        maxStreak: maxStreak,
      };
    });
    
    // Sort by max streak (descending), then by total check-ins
    const ranked = userStats
      .filter((u) => u.totalHabits > 0)
      .sort((a, b) => {
        if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
        return b.totalCheckIns - a.totalCheckIns;
      });
    
    return res.json({ leaderboard: ranked });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("leaderboard error", err);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
}
