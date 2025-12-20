const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CardLandingPage = require("../models/CardLandingPage");
const upload = require("../middleware/upload");

// ========================
// CREATE Landing Page
// ========================
router.post(
  "/",
  upload.fields([
    { name: "backgroundImages", maxCount: 10 },
    { name: "iconImages", maxCount: 10 },
    { name: "cardImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const {
        itenaryTourId,
        cardId,
        mainHeading,
        subHeading,
        description,
        icons,
        highlights,
        tourInclusions,
        tourExclusions,
        tourCost,
        paymentTerms,
        cancellationPolicy,
        termsAndConditions,
        cards,
      } = req.body;

      // ✅ Required checks
      if (!itenaryTourId || !cardId) {
        return res
          .status(400)
          .json({ message: "itenaryTourId and cardId are required" });
      }

      if (
        !req.files?.backgroundImages ||
        req.files.backgroundImages.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "At least one background image is required" });
      }

      // ✅ Process icons
      let iconsData = [];
      if (icons) {
        iconsData = JSON.parse(icons);
        if (req.files?.iconImages) {
          iconsData = iconsData.map((icon, index) => ({
            ...icon,
            icon: req.files.iconImages[index]
              ? req.files.iconImages[index].path
              : icon.icon,
          }));
        }
      }

      // ✅ Process highlights
      let highlightsData = [];
      if (highlights) {
        const parsedHighlights = JSON.parse(highlights);
        highlightsData = parsedHighlights.map((item) => ({
          type: item.type || item, // safe fallback if only string is passed
        }));
      }

      // ✅ Process cards
      let cardsData = [];
      if (cards) {
        cardsData = JSON.parse(cards);
        if (req.files?.cardImages) {
          cardsData = cardsData.map((card, index) => ({
            ...card,
            image: req.files.cardImages[index]
              ? req.files.cardImages[index].path
              : card.image,
          }));
        }

        cardsData = cardsData.map((card) => {
          const perPerson = Number(card.perPerson || 0);
          const totalPrice = Number(card.totalPrice || 0);
          return {
            title: card.title,
            subtitle: card.subtitle || "",
            description: card.description || "",
            highlights: card.highlights || [],
            cost: {
              perPerson,
              totalPrice,
              currency: "INR",
            },
            image: card.image || "",
          };
        });
      }

      // ✅ Create new landing page document
      const landingPage = new CardLandingPage({
        itenaryTourId: new mongoose.Types.ObjectId(itenaryTourId),
        cardId: new mongoose.Types.ObjectId(cardId),
        backgroundImages: req.files.backgroundImages.map((f) => f.path),
        mainHeading,
        subHeading,
        description,
        icons: iconsData,
        highlights: highlightsData,
        tourInclusions,
        tourExclusions,
        tourCost,
        paymentTerms,
        cancellationPolicy,
        termsAndConditions,
        cards: cardsData,
      });

      await landingPage.save();
      res.status(201).json({ message: "Landing page created", landingPage });
    } catch (err) {
      console.error("Error in POST /:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// ========================
// UPDATE Landing Page by _id
// ========================
router.put(
  "/:id",
  upload.fields([
    { name: "backgroundImages", maxCount: 10 },
    { name: "iconImages", maxCount: 10 },
    { name: "cardImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const page = await CardLandingPage.findById(req.params.id);
      if (!page)
        return res.status(404).json({ message: "Landing page not found" });

      const {
        mainHeading,
        subHeading,
        description,
        icons,
        highlights,
        tourInclusions,
        tourExclusions,
        tourCost,
        paymentTerms,
        cancellationPolicy,
        termsAndConditions,
        cards,
      } = req.body;

      if (mainHeading) page.mainHeading = mainHeading;
      if (subHeading) page.subHeading = subHeading;
      if (description) page.description = description;
      if (tourInclusions) page.tourInclusions = tourInclusions;
      if (tourExclusions) page.tourExclusions = tourExclusions;
      if (tourCost) page.tourCost = tourCost;
      if (paymentTerms) page.paymentTerms = paymentTerms;
      if (cancellationPolicy) page.cancellationPolicy = cancellationPolicy;
      if (termsAndConditions) page.termsAndConditions = termsAndConditions;

      // ✅ Update highlights
      if (highlights) {
        const parsedHighlights = JSON.parse(highlights);
        page.highlights = parsedHighlights.map((item) => ({
          type: item.type || item,
        }));
      }

      // ✅ Update icons
      if (icons) {
        let iconsData = JSON.parse(icons);
        if (req.files?.iconImages) {
          iconsData = iconsData.map((icon, index) => ({
            ...icon,
            icon: req.files.iconImages[index]
              ? req.files.iconImages[index].path
              : icon.icon,
          }));
        }
        page.icons = iconsData;
      }

      // ✅ Update cards
      if (cards) {
        let cardsData = JSON.parse(cards);
        if (req.files?.cardImages) {
          cardsData = cardsData.map((card, index) => ({
            ...card,
            image: req.files.cardImages[index]
              ? req.files.cardImages[index].path
              : card.image,
          }));
        }

        cardsData = cardsData.map((card) => {
          const perPerson = Number(card.perPerson || 0);
          const totalPrice = Number(card.totalPrice || 0);
          return {
            title: card.title,
            subtitle: card.subtitle || "",
            description: card.description || "",
            highlights: card.highlights || [],
            cost: {
              perPerson,
              totalPrice,
              currency: "INR",
            },
            image: card.image || "",
          };
        });
        page.cards = cardsData;
      }

      if (req.files?.backgroundImages?.length > 0) {
        page.backgroundImages = req.files.backgroundImages.map((f) => f.path);
      }

      await page.save();
      res.status(200).json({ message: "Landing page updated", page });
    } catch (err) {
      console.error("Error in PUT /:id:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);





// ✅ UPDATE by tourId + cardId
router.put(
  "/tour/:itenaryTourId/card/:cardId",
  upload.fields([
    { name: "backgroundImages", maxCount: 10 },
    { name: "iconImages", maxCount: 10 },
    { name: "cardImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { itenaryTourId, cardId } = req.params;

      const page = await CardLandingPage.findOne({
        itenaryTourId: new mongoose.Types.ObjectId(itenaryTourId),
        cardId: new mongoose.Types.ObjectId(cardId),
      });

      if (!page)
        return res
          .status(404)
          .json({ message: "Landing page not found for this card" });

      const {
        mainHeading,
        subHeading,
        description,
        icons,
        highlights,
        tourInclusions,
        tourExclusions,
        tourCost,
        paymentTerms,
        cancellationPolicy,
        termsAndConditions,
        cards,
      } = req.body;

      // ✅ Apply the same update logic as your existing PUT /:id route
      if (mainHeading) page.mainHeading = mainHeading;
      if (subHeading) page.subHeading = subHeading;
      if (description) page.description = description;
      if (tourInclusions) page.tourInclusions = tourInclusions;
      if (tourExclusions) page.tourExclusions = tourExclusions;
      if (tourCost) page.tourCost = tourCost;
      if (paymentTerms) page.paymentTerms = paymentTerms;
      if (cancellationPolicy) page.cancellationPolicy = cancellationPolicy;
      if (termsAndConditions) page.termsAndConditions = termsAndConditions;

      if (highlights) {
        const parsedHighlights = JSON.parse(highlights);
        page.highlights = parsedHighlights.map((item) => ({
          type: item.type || item,
        }));
      }

      if (icons) {
        let iconsData = JSON.parse(icons);
        if (req.files?.iconImages) {
          iconsData = iconsData.map((icon, index) => ({
            ...icon,
            icon: req.files.iconImages[index]
              ? req.files.iconImages[index].path
              : icon.icon,
          }));
        }
        page.icons = iconsData;
      }

      if (cards) {
        let cardsData = JSON.parse(cards);
        if (req.files?.cardImages) {
          cardsData = cardsData.map((card, index) => ({
            ...card,
            image: req.files.cardImages[index]
              ? req.files.cardImages[index].path
              : card.image,
          }));
        }

        cardsData = cardsData.map((card) => {
          const perPerson = Number(card.perPerson || 0);
          const totalPrice = Number(card.totalPrice || 0);
          return {
            title: card.title,
            subtitle: card.subtitle || "",
            description: card.description || "",
            highlights: card.highlights || [],
            cost: {
              perPerson,
              totalPrice,
              currency: "INR",
            },
            image: card.image || "",
          };
        });
        page.cards = cardsData;
      }

      if (req.files?.backgroundImages?.length > 0) {
        page.backgroundImages = req.files.backgroundImages.map((f) => f.path);
      }

      await page.save();
      res.status(200).json({ message: "Landing page updated", page });
    } catch (err) {
      console.error("Error in PUT /tour/:itenaryTourId/card/:cardId:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// ========================
// GET & DELETE Routes
// ========================

// ✅ Get all
router.get("/", async (req, res) => {
  try {
    const pages = await CardLandingPage.find();
    res.status(200).json(pages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get by ID
router.get("/:id", async (req, res) => {
  try {
    const page = await CardLandingPage.findById(req.params.id);
    if (!page)
      return res.status(404).json({ message: "Landing page not found" });
    res.status(200).json(page);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//✅ Get by tourId + cardId

router.get("/tour/:itenaryTourId/card/:cardId", async (req, res) => {
  try {
    const { itenaryTourId, cardId } = req.params;

    const page = await CardLandingPage.findOne({
      itenaryTourId: new mongoose.Types.ObjectId(itenaryTourId),
      cardId: new mongoose.Types.ObjectId(cardId),
    });

    if (!page)
      return res
        .status(404)
        .json({ message: "Landing page not found for this card" });

    res.status(200).json(page);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET by tourId + cardId (auto-create if not found)
// router.get("/tour/:itenaryTourId/card/:cardId", async (req, res) => {
//   try {
//     const { itenaryTourId, cardId } = req.params;

//     // Try to find existing landing page
//     let page = await CardLandingPage.findOne({
//       itenaryTourId: new mongoose.Types.ObjectId(itenaryTourId),
//       cardId: new mongoose.Types.ObjectId(cardId),
//     });

//     // If not found, create new landing page with default values
//     if (!page) {
//       page = new CardLandingPage({
//         itenaryTourId: new mongoose.Types.ObjectId(itenaryTourId),
//         cardId: new mongoose.Types.ObjectId(cardId),
//         mainHeading: "Default Heading",
//         subHeading: "",
//         description: "",
//         backgroundImages: [], // ya koi default image path: ["uploads/default-bg.jpg"]
//         icons: [],
//         highlights: [],
//         tourInformation: "",
//         tourCost: "",
//         paymentTerms: "",
//         cancellationPolicy: "",
//         termsAndConditions: "",
//         cards: [],
//       });

//       await page.save();
//       return res.status(201).json({
//         message: "Landing page not found. A new landing page has been created.",
//         page,
//       });
//     }

//     // If found, just return it
//     res.status(200).json(page);
//   } catch (err) {
//     console.error("❌ Error fetching landing page:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// ✅ Delete by _id
router.delete("/:id", async (req, res) => {
  try {
    const page = await CardLandingPage.findByIdAndDelete(req.params.id);
    if (!page)
      return res.status(404).json({ message: "Landing page not found" });
    res.status(200).json({ message: "Landing page deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Delete by tourId + cardId
router.delete("/tour/:itenaryTourId/card/:cardId", async (req, res) => {
  try {
    const { itenaryTourId, cardId } = req.params;

    const page = await CardLandingPage.findOneAndDelete({
      itenaryTourId: new mongoose.Types.ObjectId(itenaryTourId),
      cardId: new mongoose.Types.ObjectId(cardId),
    });

    if (!page)
      return res
        .status(404)
        .json({ message: "Landing page not found for this card" });

    res.status(200).json({ message: "Landing page deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
