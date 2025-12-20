import express from "express";
import { saveToken } from "../controllers/fcmController.js";
import admin from "../config/firebase.js";


const router = express.Router();

// 🔹 Route to save FCM token
router.post("/save-token", saveToken);





export default router;