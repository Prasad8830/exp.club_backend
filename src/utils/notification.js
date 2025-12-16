import nodemailer from "nodemailer";
import cron from "node-cron";
import { User } from "../models/User.js";
import { Habit } from "../models/Habit.js";
import { CheckIn } from "../models/CheckIn.js";
import { periodStartForFrequency } from "./period.js";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send reminder email to user for uncompleted habits
 */
export async function sendReminderEmail(user, uncompleteHabits) {
  if (uncompleteHabits.length === 0) return;

  const habitList = uncompleteHabits.map((h) => `• ${h.name} (${h.frequency})`).join("\n");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `📧 Habit Reminder - ${uncompleteHabits.length} habit(s) pending`,
    html: `
      <h2>Hey ${user.name}! 👋</h2>
      <p>You have <strong>${uncompleteHabits.length}</strong> habit(s) that haven't been completed today/this week:</p>
      <pre>${habitList}</pre>
      <p>Don't break your streak! Complete them now 💪</p>
      <p><a href="${process.env.CLIENT_ORIGIN}/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a></p>
      <p>Keep up the good work! 🚀</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log(`Reminder email sent to ${user.email}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to send email to ${user.email}:`, err);
  }
}

/**
 * Check for uncompleted habits and send reminders
 * Runs daily at 9 AM and weekly on Sunday at 6 PM
 */
export async function initializeReminderSchedule() {
  // Daily reminder at 9 AM
  cron.schedule("0 9 * * *", async () => {
    // eslint-disable-next-line no-console
    console.log("Running daily habit reminders...");
    await checkAndRemindUsers("daily");
  });

  // Weekly reminder on Sunday at 6 PM
  cron.schedule("0 18 * * 0", async () => {
    // eslint-disable-next-line no-console
    console.log("Running weekly habit reminders...");
    await checkAndRemindUsers("weekly");
  });
}

/**
 * Check all users for incomplete habits and send reminders
 */
async function checkAndRemindUsers(frequency) {
  try {
    const users = await User.find({});

    for (const user of users) {
      const habits = await Habit.find({ userId: user._id, frequency });
      if (habits.length === 0) continue;

      const now = new Date();
      const periodStart = periodStartForFrequency(now, frequency);

      const uncompleteHabits = [];

      for (const habit of habits) {
        const existingCheckIn = await CheckIn.findOne({
          habitId: habit._id,
          userId: user._id,
          periodStart,
        });

        if (!existingCheckIn) {
          uncompleteHabits.push(habit);
        }
      }

      if (uncompleteHabits.length > 0) {
        await sendReminderEmail(user, uncompleteHabits);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error checking and reminding users:", err);
  }
}

/**
 * Send custom notification (can be extended for in-app or push notifications)
 */
export async function sendNotification(userId, title, message) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // For now, just send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: title,
      html: `
        <h2>${title}</h2>
        <p>${message}</p>
        <p><a href="${process.env.CLIENT_ORIGIN}/dashboard" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to send notification:", err);
  }
}
