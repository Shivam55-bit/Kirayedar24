import express from "express";
import { getRecentProperties, getRecentAllProperties } from "../controllers/recentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes (no authentication required) - Original URLs working again
router.get("/recent", getRecentProperties);
router.get("/recent/all", getRecentAllProperties);

// Public routes (alternative endpoints)
router.get("/recent/public", getRecentProperties);
router.get("/recent/all/public", getRecentAllProperties);

// Protected routes (authentication required) - for admin/dashboard
router.get("/recent/protected", verifyToken, getRecentProperties);
router.get("/recent/all/protected", verifyToken, getRecentAllProperties);

export default router;