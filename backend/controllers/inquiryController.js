import Inquiry from "../models/inquirySchema.js";
import Property from "../models/addProps.js";
import ManualInquiry from "../models/manualInquirySchema.js";
import User from "../models/user.js";
import { sendPushNotification } from "../utils/sendNotification.js";

// ===========================
//  Add New Inquiry (Prevent Duplicates)
// ===========================
export const addInquiry = async (req, res) => {
  try {
    const buyerId = req.user.id; // Logged-in user
    const { propertyId, fullName, email, contactNumber } = req.body;

    //  Validation
    if (!propertyId || !fullName || !email || !contactNumber) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    //  Find property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    //  Prevent owner from sending inquiry to own property
    if (property.userId.toString() === buyerId) {
      return res
        .status(400)
        .json({ message: "You cannot inquire about your own property" });
    }

    //  Check if inquiry already exists
    const existingInquiry = await Inquiry.findOne({ buyerId, propertyId });
    if (existingInquiry) {
      return res.status(400).json({
        message: "You have already submitted an inquiry for this property.",
        alreadyInquired: true,
      });
    }

    //  Create new inquiry
    const inquiry = new Inquiry({
      propertyId,
      buyerId,
      ownerId: property.userId, // property owner
      fullName,
      email,
      contactNumber,
    });

    await inquiry.save();

    //  Send Push Notification to Property Owner
    let fcmTokenFound = false;
    let notificationStatus = "not_sent";

    const owner = await User.findById(property.userId);

    if (owner) {
      if (owner.fcmToken) {
        fcmTokenFound = true;

        // Determine which type field to show
        const propertyTypeDetail =
          property.propertyType === "Residential"
            ? property.residentialType
            : property.commercialType;

        const title = "New Property Inquiry 🏠";
        const body = `You received a new inquiry for your property in ${property.propertyLocation}.
Property Type: ${property.propertyType} (${propertyTypeDetail})
From: ${fullName}
Email: ${email}
Contact: ${contactNumber}`;

        const data = {
          type: "property_inquiry",
          propertyLocation: property.propertyLocation,
          propertyType: property.propertyType,
          propertyTypeDetail,
          fullName,
          email,
          contactNumber,
        };

        try {
          await sendPushNotification(owner.fcmToken, title, body, data);
          notificationStatus = "sent";
          console.log(
            ` Notification sent to owner (${owner._id}) for property at ${property.propertyLocation}`
          );
        } catch (err) {
          console.error(" Notification Send Error:", err);
          notificationStatus = "failed";
        }
      } else {
        console.warn(
          ` No FCM token found for owner (${owner._id}) - cannot send notification`
        );
      }
    }

    //  Final Response
    res.status(201).json({
      message: "Inquiry submitted successfully",
      inquiry,
      fcmTokenFound,
      notificationStatus,
    });
  } catch (error) {
    console.error("Add Inquiry Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===========================
//  Delete Inquiry
// ===========================
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user?.id;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Only buyer who created it can delete it
    if (inquiry.buyerId.toString() !== buyerId) {
      return res.status(403).json({ message: "Unauthorized to delete this inquiry" });
    }

    await Inquiry.findByIdAndDelete(id);
    res.status(200).json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Delete Inquiry Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===========================
//  Get Enquiries with Filters
// ===========================
export const getEnquiries = async (req, res) => {
  try {
    const { buyerId, ownerId, propertyId, status } = req.query;

    const filter = {};
    if (buyerId) filter.buyerId = buyerId;
    if (ownerId) filter.ownerId = ownerId;
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;

    const enquiries = await Inquiry.find(filter)
      .populate("buyerId", "fullName email phone avatar city state")
      .populate("ownerId", "fullName email phone avatar city state")
      .populate("propertyId");

    res.status(200).json({
      message: "Enquiries fetched successfully",
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({
      message: "Server error while fetching enquiries",
      error: error.message,
    });
  }
};

// ===========================
//  Create Manual Inquiry (Admin)
// ===========================
export const createManualInquiry = async (req, res) => {
  try {
    const {
      s_No,
      clientName,
      contactNumber,
      ClientCode,
      ProjectCode,
      productType,
      location,
      date,
      caseStatus,
      source,
      majorComments,
      address,
      weekOrActionTaken,
      actionPlan,
      referenceBy,
    } = req.body;

    if (
      !s_No ||
      !clientName ||
      !contactNumber ||
      !ClientCode ||
      !ProjectCode ||
      !productType ||
      !location ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const newInquiry = new ManualInquiry({
      s_No,
      clientName,
      contactNumber,
      ClientCode,
      ProjectCode,
      productType,
      location,
      date,
      caseStatus,
      source,
      majorComments,
      address,
      weekOrActionTaken,
      actionPlan,
      referenceBy,
    });

    await newInquiry.save();

    res.status(201).json({
      success: true,
      message: "Manual inquiry created successfully",
      data: newInquiry,
    });
  } catch (error) {
    console.error("Error creating manual inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual inquiry",
      error: error.message,
    });
  }
};

// ===========================
//  Get All Manual Inquiries
// ===========================
export const getAllManualInquiries = async (req, res) => {
  try {
    const inquiries = await ManualInquiry.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch manual inquiries",
      error: error.message,
    });
  }
};

// ===========================
//  Get Manual Inquiry by ID
// ===========================
export const getManualInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await ManualInquiry.findById(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Manual inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch manual inquiry",
      error: error.message,
    });
  }
};

// ===========================
//  Update Manual Inquiry
// ===========================
export const updateManualInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedInquiry = await ManualInquiry.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedInquiry) {
      return res.status(404).json({
        success: false,
        message: "Manual inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Manual inquiry updated successfully",
      data: updatedInquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update manual inquiry",
      error: error.message,
    });
  }
};

// ===========================
//  Delete Manual Inquiry
// ===========================
export const deleteManualInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInquiry = await ManualInquiry.findByIdAndDelete(id);

    if (!deletedInquiry) {
      return res.status(404).json({
        success: false,
        message: "Manual inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Manual inquiry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete manual inquiry",
      error: error.message,
    });
  }
};
