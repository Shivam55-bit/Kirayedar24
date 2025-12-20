import express from "express";
import { boughtProperty, getBoughtPropertiesByUser, getBoughtProperties} from "../controllers/boughtPropertyController.js";

const router = express.Router();

// Route to buy a property
router.post("/bought", boughtProperty);

// Route to get all bought properties by userId
router.get("/get-bought-properties", getBoughtPropertiesByUser);

// Route to get all bought properties (admin)
router.get("/all-bought-properties", getBoughtProperties);


export default router;
