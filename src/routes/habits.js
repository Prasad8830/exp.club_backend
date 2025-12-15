import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { listHabits, createHabit, updateHabit, deleteHabit, checkInHabit, undoCheckIn } from "../controllers/habitController.js";

const router = express.Router();

router.get("/", requireAuth, listHabits);
router.post("/", requireAuth, createHabit);
router.put("/:id", requireAuth, updateHabit);
router.delete("/:id", requireAuth, deleteHabit);
router.post("/:id/checkin", requireAuth, checkInHabit);
router.delete("/:id/checkin", requireAuth, undoCheckIn);

export default router;
