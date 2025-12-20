import Reminder from "../models/reminderModel.js";

/**
 * @desc Create a new reminder
 */
export const createReminder = async (req, res) => {
  try {
    const { name, email, phone, location, note, reminderTime } = req.body;

    const reminder = new Reminder({
      name,
      email,
      phone,
      location,
      note,
      reminderTime,
    });

    await reminder.save();
    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: reminder,
    });
  } catch (error) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc Get all reminders
 */
export const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find().sort({ reminderTime: -1 });
    res.status(200).json({ success: true, data: reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};