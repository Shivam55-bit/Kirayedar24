import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    reminderData: {
      name: String,
      email: String,
      phone: String,
      location: String,
      note: String,
      reminderTime: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);