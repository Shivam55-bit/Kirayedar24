import express from "express";
import {getAllProperties, getAllOtherProperties, getPropertiesByCategory, getPropertiesByMainCategory,getSubCategoryCounts } from "../controllers/getControllers.js";
import { verifyToken } from '../middlewares/authMiddleware.js';
// import { getAllRentProperties } from "../controllers/buyControllers.js";
// import { getSubCategoryCounts } from "../controllers/statsController.js";
const router = express.Router();

// Get all properties - Now PUBLIC (no auth required)
router.get("/all", getAllProperties);

// Public route for all properties (alias for frontend)
router.get("/all/public", getAllProperties);

// get all properties added by other users - NOW PUBLIC TOO
router.get("/allOther", getAllOtherProperties);

// Protected version for admin dashboard
router.get("/allOther/protected", verifyToken, getAllOtherProperties);

//sub-category-based properties
router.get("/category/:category", getPropertiesByCategory);

//main category-based properties[Residential , Commercial]
router.get("/main-category/:mainCategory", getPropertiesByMainCategory);

// Get counts of properties in each sub-category
router.get("/sub-category-counts", getSubCategoryCounts);



export default router;
