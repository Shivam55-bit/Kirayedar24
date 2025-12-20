const express = require("express");
const router = express.Router();
const AboutFooter = require("../models/AboutFooter");
const upload = require("../middleware/upload");

// ============================
// CREATE: Add new AboutFooter content
// ============================
router.post("/", upload.fields([
  { name: "logos", maxCount: 10 },
  { name: "img", maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      mainHeading, 
      description, 
      items, 
      footerHeading, 
      paragraph 
    } = req.body;

    // Parse items if sent as JSON string
    let parsedItems = [];
    if (items) {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    }

    // Assign uploaded logos to items
    if (req.files["logos"]) {
      parsedItems = parsedItems.map((item, index) => ({
        ...item,
        logo: req.files["logos"][index] ? req.files["logos"][index].path : item.logo || ""
      }));
    }

    const aboutFooterData = {
      mainHeading,
      description,
      items: parsedItems,
      footerHeading,
      paragraph
    };

    // Add main image
    if (req.files["img"]) {
      aboutFooterData.img = req.files["img"][0].path;
    }

    const aboutFooter = new AboutFooter(aboutFooterData);
    await aboutFooter.save();

    res.status(201).json({ message: "AboutFooter content created", aboutFooter });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================
// READ: Get all AboutFooter content
// ============================
router.get("/", async (req, res) => {
  try {
    const aboutFooterList = await AboutFooter.find();
    res.json(aboutFooterList);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================
// READ: Get AboutFooter content by ID
// ============================
router.get("/:id", async (req, res) => {
  try {
    const aboutFooter = await AboutFooter.findById(req.params.id);
    if (!aboutFooter) return res.status(404).json({ message: "AboutFooter content not found" });
    res.json(aboutFooter);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================
// UPDATE: Update AboutFooter content by ID
// ============================
// router.put("/:id", upload.fields([
//   { name: "logos", maxCount: 10 },
//   { name: "img", maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { 
//       mainHeading, 
//       description, 
//       items, 
//       footerHeading, 
//       paragraph 
//     } = req.body;

//     const aboutFooter = await AboutFooter.findById(req.params.id);
//     if (!aboutFooter) return res.status(404).json({ message: "AboutFooter content not found" });

//     // Update text fields
//     if (mainHeading) aboutFooter.mainHeading = mainHeading;
//     if (description) aboutFooter.description = description;
//     if (footerHeading) aboutFooter.footerHeading = footerHeading;
//     if (paragraph) aboutFooter.paragraph = paragraph;

//     // Update items
//     if (items) {
//       let parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      
//       // Update logos if new files uploaded
//       if (req.files["logos"]) {
//         parsedItems = parsedItems.map((item, index) => ({
//           ...item,
//           logo: req.files["logos"][index] ? req.files["logos"][index].path : item.logo || ""
//         }));
//       }
      
//       aboutFooter.items = parsedItems;
//     }

//     // Update main image if uploaded
//     if (req.files["img"]) {
//       aboutFooter.img = req.files["img"][0].path;
//     }

//     await aboutFooter.save();
//     res.json({ message: "AboutFooter content updated", aboutFooter });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });
router.put("/:id", upload.fields([
  { name: "itemImages", maxCount: 10 },
  { name: "img", maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      mainHeading, 
      description, 
      items, 
      footerHeading, 
      paragraph 
    } = req.body;

    const aboutFooter = await AboutFooter.findById(req.params.id);
    if (!aboutFooter) return res.status(404).json({ message: "AboutFooter content not found" });

    // Update text fields
    if (mainHeading) aboutFooter.mainHeading = mainHeading;
    if (description) aboutFooter.description = description;
    if (footerHeading) aboutFooter.footerHeading = footerHeading;
    if (paragraph) aboutFooter.paragraph = paragraph;

    // Update items with individual images
    if (items) {
      let parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      
      // Update item images if new files uploaded
      if (req.files["itemImages"]) {
        parsedItems = parsedItems.map((item, index) => ({
          ...item,
          logo: req.files["itemImages"][index] ? req.files["itemImages"][index].path : item.logo || ""
        }));
      }
      
      aboutFooter.items = parsedItems;
    }

    // Update main image if uploaded
    if (req.files["img"]) {
      aboutFooter.img = req.files["img"][0].path;
    }

    await aboutFooter.save();
    res.json({ message: "AboutFooter content updated", aboutFooter });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================
// DELETE: Delete AboutFooter content by ID
// ============================
router.delete("/:id", async (req, res) => {
  try {
    const aboutFooter = await AboutFooter.findByIdAndDelete(req.params.id);
    if (!aboutFooter) return res.status(404).json({ message: "AboutFooter content not found" });
    res.json({ message: "AboutFooter content deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;