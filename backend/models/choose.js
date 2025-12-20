const express = require("express");
const router = express.Router();
const Choose = require("../../models/Sport/Choose");
const upload = require("../../middleware/upload");

// Create Choose section with image uploads
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const { mainHeading, items } = req.body;
    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    if (req.files && req.files.length > 0) {
      parsedItems.forEach((item, idx) => {
        if (req.files[idx]) {
          item.image = req.files[idx].path;
        }
      });
    }
    const choose = new Choose({ mainHeading, items: parsedItems });
    await choose.save();
    res.status(201).json(choose);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all Choose sections
router.get("/", async (req, res) => {
  try {
    const chooses = await Choose.find();
    res.json(chooses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Choose section by ID
router.get("/:id", async (req, res) => {
  try {
    const choose = await Choose.findById(req.params.id);
    if (!choose) return res.status(404).json({ message: "Choose section not found" });
    res.json(choose);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Choose section by ID with image uploads
// router.put("/:id", upload.array("images", 10), async (req, res) => {
//   try {
//     const { mainHeading, items } = req.body;
//     const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
//     if (req.files && req.files.length > 0) {
//       parsedItems.forEach((item, idx) => {
//         if (req.files[idx]) {
//           item.image = req.files[idx].path;
//         }
//       });
//     }
//     const choose = await Choose.findByIdAndUpdate(
//       req.params.id,
//       { mainHeading, items: parsedItems },
//       { new: true }
//     );
//     if (!choose) return res.status(404).json({ message: "Choose section not found" });
//     res.json(choose);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// Update Choose section by ID with image uploads
// UPDATE Choose section
router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const { mainHeading, items } = req.body;
    let parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    
    const uploadedFiles = req.files || [];
    
    // Add console logs for debugging
    console.log('=== CHOOSE UPDATE BACKEND ===');
    console.log('Received files:', uploadedFiles.map((f, i) => 
      `${i}: ${f.originalname} (${f.mimetype})`
    ).join(', '));
    console.log('Parsed items:', parsedItems.map((item, i) => 
      `${i}: ${item.title} - existing image: ${item.image || 'none'}`
    ).join(', '));
    
    // Process items with images - maintain index alignment
    if (parsedItems && parsedItems.length > 0) {
      parsedItems = parsedItems.map((item, index) => {
        // Check if there's a file at this position
        if (!uploadedFiles[index]) {
          console.log(`Item ${index}: No file - keeping existing image: ${item.image}`);
          return item;
        }
        
        // Check if it's a placeholder (text/plain) or actual image
        if (uploadedFiles[index].mimetype === 'text/plain') {
          console.log(`Item ${index}: Placeholder detected - keeping existing image: ${item.image}`);
          return item; // Keep existing image from JSON
        }
        
        // Actual image file - use it
        if (uploadedFiles[index].mimetype.startsWith('image/')) {
          console.log(`Item ${index}: New image detected - using: ${uploadedFiles[index].path}`);
          return {
            ...item,
            image: uploadedFiles[index].path
          };
        }
        
        // Default: keep existing
        console.log(`Item ${index}: Unknown file type - keeping existing: ${item.image}`);
        return item;
      });
    }
    
    console.log('Final items after processing:', parsedItems.map((item, i) => 
      `${i}: ${item.title} - image: ${item.image}`
    ).join(', '));
    console.log('=== END CHOOSE UPDATE ===');
    
    const choose = await Choose.findByIdAndUpdate(
      req.params.id,
      { mainHeading, items: parsedItems },
      { new: true, runValidators: true }
    );
    
    if (!choose) {
      return res.status(404).json({ message: "Choose section not found" });
    }
    
    res.json(choose);
  } catch (err) {
    console.error('Update choose error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete Choose section by ID
router.delete("/:id", async (req, res) => {
  try {
    const choose = await Choose.findByIdAndDelete(req.params.id);
    if (!choose) return res.status(404).json({ message: "Choose section not found" });
    res.json({ message: "Choose section deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;