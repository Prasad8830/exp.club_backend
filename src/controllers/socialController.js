import { z } from "zod";
import { Follow } from "../models/Follow.js";
import { CheckIn } from "../models/CheckIn.js";
import { User } from "../models/User.js";
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
