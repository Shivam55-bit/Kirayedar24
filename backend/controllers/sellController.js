import Property from "../models/addProps.js";

// Get properties added by logged-in user
export const getMySellProperties = async (req, res) => {
  try {
    const userId = req.user.id; // ya req.body.userId

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "Missing userId" 
      });
    }

    // Find properties where userId matches the logged-in user
    const properties = await Property.find({ userId: userId });

    console.log(`✅ [getMySellProperties] Found ${properties.length} properties for user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: "Properties fetched successfully",
      data: properties,
      count: properties.length
    });
  } catch (error) {
    console.error("❌ Get My Properties Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};