import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { searchUsers, followUser, unfollowUser, listFollowing, feed, leaderboard } from "../controllers/socialController.js";

const router = express.Router();

router.get("/users/search", requireAuth, searchUsers);
router.post("/users/:id/follow", requireAuth, followUser);
router.delete("/users/:id/follow", requireAuth, unfollowUser);
router.get("/users/following", requireAuth, listFollowing);
router.get("/feed", requireAuth, feed);
router.get("/leaderboard", requireAuth, leaderboard);

export default router;
