import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { googleSignIn, me } from "../controllers/authController.js";

const router = express.Router();

router.post("/google", googleSignIn);
router.get("/me", requireAuth, me);

export default router;
