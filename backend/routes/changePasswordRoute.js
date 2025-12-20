import express from "express";
import { changePassword } from "../controllers/changePasswordController.js";

const router = express.Router();

// PUT: Change Password (No Auth)
router.put("/change-password", changePassword);

export default router;
