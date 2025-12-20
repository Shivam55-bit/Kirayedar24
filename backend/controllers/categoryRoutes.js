// import express from "express";
// import {
//   addCategory,
//   getCategories,
//   addSubcategory,
//   getSubcategories,
//   addSubSubcategory,
//   getSubSubcategories
// } from "../controllers/categoryController.js";
// import { protect } from "../middleware/authMiddleware.js";
// import { uploadSubSub } from "../middleware/upload.js";

// const router = express.Router();

// // Category
// router.post("/", protect, addCategory); // Admin
// router.get("/", getCategories);

// // Subcategory
// router.post("/:id/subcategories", protect, addSubcategory); // Admin
// router.get("/:id/subcategories", getSubcategories);

// // Sub-subcategory
// // router.post("/subcategories/:id/sub-subcategories", protect, upload.single("image"), addSubSubcategory);
// router.post("/subcategories/:id/sub-subcategories", protect, uploadSubSub.single("image"), addSubSubcategory);
// // Get Sub-subcategories
// router.get("/subcategories/:id/sub-subcategories", getSubSubcategories);

// export default router;


import express from "express";
import {
  addCategory,
  getCategories,
  addSubcategory,
  getSubcategories,
  addSubSubcategory,
  getSubSubcategories,
  uploadCategoryVideo,
  getProductsByCategory,
  deleteSubSubcategory,
  getCategoryVideo
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSubSub, uploadCategoryVideoMulter } from "../middleware/upload.js";

const router = express.Router();

// ✅ Category
router.post("/", protect, addCategory); // Admin
router.get("/", getCategories);
router.get("/:id/video", getCategoryVideo);
// ✅ Upload category video
router.post("/:id/video", protect, uploadCategoryVideoMulter.single("video"), uploadCategoryVideo);

// ✅ Get all products by category
router.get("/:id/products", getProductsByCategory);

// ✅ Subcategory
router.post("/:id/subcategories", protect, addSubcategory); // Admin
router.get("/:id/subcategories", getSubcategories);

// ✅ Sub-subcategory
router.post(
  "/subcategories/:id/sub-subcategories",
  protect,
  uploadSubSub.single("image"),
  addSubSubcategory
);
router.get("/subcategories/:id/sub-subcategories", getSubSubcategories);
// ✅ Delete sub-subcategory
router.delete("/sub-subcategories/:id", protect, deleteSubSubcategory);



export default router;
