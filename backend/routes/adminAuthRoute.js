import express from "express";
import { registerAdmin, loginAdmin, adminChangePassword, sendTwoFAOtp, verifyTwoFAOtp, disableTwoFA ,enableTwoFA, getActiveSessions, logoutSession,adminForgetPassword, adminVerifyOtp, adminResetPassword} from "../controllers/adminAuthController.js";
import { verifyAdminToken } from "../middlewares/adminAuthMiddleware.js";
import { verifyToken } from '../middlewares/authMiddleware.js';
const router = express.Router();

// Signup
router.post("/signup", registerAdmin);

// Login
router.post("/login", loginAdmin);
router.put("/admin-change-password", verifyToken, adminChangePassword);
router.post("/send-otp", sendTwoFAOtp);
router.post("/verify-otp", verifyTwoFAOtp);
router.put("/enableTwoFA", verifyToken, enableTwoFA);
router.put("/disableTwoFA", verifyToken, disableTwoFA);
router.post("/forgot-password", adminForgetPassword);
router.post("/verify-otp", adminVerifyOtp);
router.post("/reset-password", adminResetPassword);
// Example protected route
// router.get("/me", verifyToken, (req, res) => {
//   res.status(200).json({ admin: req.user });
// });

export default router;
