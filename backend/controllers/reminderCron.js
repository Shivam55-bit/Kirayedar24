import cron from "node-cron";
import Reminder from "../models/reminderModel.js";
import Notification from "../models/notificationModel.js";
import { io } from "../server.js";

cron.schedule("* * * * *", async () => {
  console.log("Checking reminders...");

  const now = new Date();
  const reminders = await Reminder.find({
    reminderTime: { $lte: now },
    isTriggered: false,
  });

  for (const r of reminders) {
    // ✅ Use backticks for template literal
    const message = `Reminder for ${r.name} (${r.phone}) — ${r.note}`;

    const notification = new Notification({
      title: "Reminder Alert",
      message,
    });
    await notification.save();

    // ✅ Send to frontend in real-time
    io.emit("newNotification", notification);

    r.isTriggered = true;
    await r.save();

    console.log(`Reminder triggered for ${r.name}`);
  }
});
