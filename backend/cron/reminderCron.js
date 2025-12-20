import cron from "node-cron";
import Reminder from "../models/reminderModel.js";
import Notification from "../models/notificationModel.js";
import { io } from "../server.js";

cron.schedule("* * * * *", async () => {
  console.log(" Checking reminders...");

  const now = new Date();

  // Find all reminders whose time has come and not triggered yet
  const reminders = await Reminder.find({
    reminderTime: { $lte: now },
    isTriggered: false,
  });

  for (const r of reminders) {
    //  Create notification with all reminder data
    const notification = new Notification({
      title: "Reminder Alert",
      message: "You have a new reminder.", // short message only
      reminderData: {
        name: r.name,
        email: r.email,
        phone: r.phone,
        location: r.location,
        note: r.note,
        reminderTime: r.reminderTime,
      },
    });

    // Save notification to DB
    await notification.save();

    // Send full reminder data in real-time to frontend
    io.emit("newNotification", {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      reminderData: notification.reminderData,
      createdAt: notification.createdAt,
    });

    // Mark reminder as triggered
    r.isTriggered = true;
    await r.save();

    console.log(` Reminder triggered for ${r.name}`);
  }
});