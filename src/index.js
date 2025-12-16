import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import socialRoutes from "./routes/social.js";
import { initializeReminderSchedule } from "./utils/notification.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
    credentials: true,
  })
);
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api", socialRoutes);

const start = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    
    // Initialize email reminder schedule
    initializeReminderSchedule();
    // eslint-disable-next-line no-console
    console.log("Email reminder schedule initialized");
    
    app.listen(port, () => console.log(`Server listening on ${port}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
