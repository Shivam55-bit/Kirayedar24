import express from "express";
import { createReminder, getReminders } from "../controllers/reminderController.js";

const router = express.Router();

router.post("/create", createReminder);
router.get("/list", getReminders);

export default router;