import Property from "../models/addProps.js";
import NodeGeocoder from "node-geocoder";
import User from "../models/user.js";
import axios from "axios"; // We'll use axios to call geocoding API
import { sendPushNotification } from "../utils/sendNotification.js";
import dotenv from "dotenv";
import Counter from "../models/counter.js";

dotenv.config();


// Configure geocoder (OpenStreetMap is free)
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});



// Add new property
// Add new property

//27-11
// export const addProperty = async (req, res) => {
//     try {
        
//         // ⭐ NEW LOGIC START: Determine Entity Type and IDs ⭐
//         let userId = null;
//         let adminId = null;
//         let entity; // Stores the full User or Admin document
        
//         // Determine if it's Admin (check for fields present in the Admin model, like email or fullName)
//         const isPostedByAdmin = !!req.user.email && !!req.user.fullName; 
        
//         if (isPostedByAdmin) {
//             // Case 1: Admin Posted (req.user is the Admin document)
//             entity = req.user;
//             adminId = entity._id; // Use Mongoose's standard _id
//             userId = null; 
//         } else {
//             // Case 2: User/Agent Posted (req.user is likely { id: '...' } or { _id: '...' })
//             const postedUserId = req.user.id || req.user._id; // Get ID from whichever middleware set it
            
//             // Fetch full User document (needed for serialId and myListingsCount logic below)
//             entity = await User.findById(postedUserId); 
//             if (!entity) return res.status(404).json({ message: "User not found" });

//             userId = entity._id; 
//             adminId = null; 
//         }
        
//         // Destructure fields from req.body (original logic)
//         const {
//             propertyLocation,
//             areaDetails,
//             availability,
//             price,
//             description,
//             furnishingStatus,
//             parking,
//             purpose,
//             propertyType,
//             commercialType,
//             residentialType,
//             contactNumber,
//             bedrooms,
//             bathrooms,
//             balconies,
//             floorNumber,
//             totalFloors,
//             facingDirection,
//             noticePeriod,
//             foodIncluded,
//             pgType,
//             sharingType,
//         } = req.body;

//         // ================== CUSTOM ID GENERATION LOGIC (UPDATED) ==================
        
//         let customPropertyId;
        
//         if (isPostedByAdmin) {
//             // ⭐ ADMIN ID LOGIC ⭐
//             const adminPropertiesCount = await Property.countDocuments({ adminId: adminId });
//             const nextAdminListingIndex = adminPropertiesCount + 1;
            
//             // Example: A-AdminIDLast4-ListingIndex (e.g., A-1234-1)
//             const adminPrefix = `A-${adminId.toString().slice(-4)}`; 
//             customPropertyId = `${adminPrefix}-${nextAdminListingIndex}`;
            
//         } else {
//             // ⭐ USER ID LOGIC (Existing logic, now uses 'entity' which is the User document) ⭐
//             let user = entity; 
            
//             // 1. Check and create serialId if missing (User only)
//             if (user.serialId === undefined || user.serialId === null) {
//                 console.log(`Generating serialId for user: ${userId}`);
                
//                 const counter = await Counter.findByIdAndUpdate(
//                     { _id: 'userSerialId' }, 
//                     { $inc: { seq: 1 } }, 
//                     { new: true, upsert: true }
//                 );
//                 const newSerialId = counter.seq;

//                 user = await User.findByIdAndUpdate(
//                     userId, 
//                     { serialId: newSerialId }, 
//                     { new: true }
//                 ); 
                
//                 if (!user) return res.status(500).json({ message: "Error updating user serial ID." });
//             }

//             // 2. Generate Custom Property ID for User
//             const nextListingIndex = user.myListingsCount + 1; 
//             const userPrefix = `S${user.serialId}`; 
//             customPropertyId = `${userPrefix}-${nextListingIndex}`;
//         }
//         // ⭐ NEW LOGIC END ⭐

//         // ================== VALIDATIONS (Original logic remains) ==================
        
//         const isResidentialPlot = propertyType === "Residential" && residentialType === "Plot";
//         const isCommercial = propertyType === "Commercial";
        
//         // --- Property Size Validations ---
//         if (!bedrooms || isNaN(Number(bedrooms)) || Number(bedrooms) < 1) return res.status(400).json({ message: "Invalid or missing bedrooms (min 1)" });
//         if (!bathrooms || isNaN(Number(bathrooms)) || Number(bathrooms) < 1) return res.status(400).json({ message: "Invalid or missing bathrooms (min 1)" });

//         if (!isResidentialPlot) {
//             const validBalconies = [0, 1, 2, 3];
//             if (!isCommercial && (balconies === undefined || !validBalconies.includes(Number(balconies)))) {
//                  return res.status(400).json({ message: "Invalid balconies (must be 0, 1, 2, or 3+)" });
//             }
//             if (!floorNumber || isNaN(Number(floorNumber)) || Number(floorNumber) < 0) return res.status(400).json({ message: "Invalid or missing floorNumber" });
//             if (!totalFloors || isNaN(Number(totalFloors)) || Number(totalFloors) < 1) return res.status(400).json({ message: "Invalid or missing totalFloors" });
//             if (Number(floorNumber) > Number(totalFloors)) return res.status(400).json({ message: "floorNumber cannot be greater than totalFloors" });
//         }

//         const validDirections = ["North", "South", "East", "West"];
//         if (!facingDirection || !validDirections.includes(facingDirection)) return res.status(400).json({ message: "Invalid facingDirection" });

//         // --- Type and Conditional Validations ---
//         if (propertyType === "Commercial") {
//             const validCommercialTypes = ["office", "shop", "warehouse"];
//             if (!commercialType || !validCommercialTypes.includes(commercialType)) return res.status(400).json({ message: "Invalid commercialType" });
//         } else {
//             const validResidentialTypes = ["Apartment", "Villa", "Plot"];
//             if (!residentialType || !validResidentialTypes.includes(residentialType)) return res.status(400).json({ message: "Invalid residentialType" });
//         }
        
//         // --- Purpose Validations ---
//         if (purpose === "Rent/Lease" || purpose === "Paying Guest") {
//             const validNoticePeriods = ["15 Days", "1 Month", "2 Months"];
//             if (!noticePeriod || !validNoticePeriods.includes(noticePeriod)) return res.status(400).json({ message: "Invalid noticePeriod" });
//         }
        
//         if (purpose === "Paying Guest") {
//             const validFoodOptions = ["Yes", "No", "Optional"];
//             if (!foodIncluded || !validFoodOptions.includes(foodIncluded)) return res.status(400).json({ message: "Invalid foodIncluded" });
            
//             const validPgTypes = ["Boys PG", "Girls PG", "Co-living"];
//             if (!pgType || !validPgTypes.includes(pgType)) return res.status(400).json({ message: "Invalid pgType" });

//             const validSharingTypes = ["Single Room", "Double Sharing", "Triple Sharing"];
//             if (!sharingType || !validSharingTypes.includes(sharingType)) return res.status(400).json({ message: "Invalid sharingType" });
//         }

//         if (!contactNumber || typeof contactNumber !== "string" || !/^\+?[1-9]\d{9,14}$/.test(contactNumber))
//             return res.status(400).json({ message: "Invalid contactNumber" });

//         // ================== GEOCODING ==================
//         const geoRes = await geocoder.geocode(propertyLocation);
//         let coordinates = [0, 0];
//         if (geoRes.length > 0) coordinates = [geoRes[0].longitude, geoRes[0].latitude];

//         // ================== FILES ==================
//         const photoPaths = req.files?.map(file => file.path) || [];

//         // ================== PREPARE PROPERTY DATA (Updated fields for Admin tracking) ==================
//         const propertyData = {
//             userId, // Null if Admin posted
//             adminId, // Null if User posted
//             isPostedByAdmin, // New field to track the source
//             customPropertyId, 
//             propertyLocation,
//             geoLocation: { type: "Point", coordinates },
//             areaDetails: Number(areaDetails),
            
//             // Added NEW fields
//             bedrooms: Number(bedrooms), 
//             bathrooms: Number(bathrooms), 
//             facingDirection,
            
//             // Conditional fields based on Plot/Commercial
//             ...(!isResidentialPlot ? {
//                 balconies: isCommercial ? undefined : Number(balconies),
//                 floorNumber: Number(floorNumber), 
//                 totalFloors: Number(totalFloors),
//             } : {}),

//             availability,
//             price: Number(price),
//             description,
//             photosAndVideo: photoPaths,
//             furnishingStatus,
//             parking,
//             purpose,
            
//             // Conditional fields based on Purpose
//             ...(purpose === "Rent/Lease" || purpose === "Paying Guest" ? { noticePeriod } : {}),
//             ...(purpose === "Paying Guest" ? { foodIncluded, pgType, sharingType } : {}),

//             propertyType,
//             ...(isCommercial ? { commercialType } : { residentialType }),
//             contactNumber,
//         };

//         // ================== SAVE PROPERTY ==================
//         const property = new Property(propertyData);
//         await property.save();

//         // ⭐ UPDATED: Increment user's myListingsCount ONLY IF a User posted it ⭐
//         if (!isPostedByAdmin) {
//             await User.findByIdAndUpdate(userId, { $inc: { myListingsCount: 1 } });
//         }

//         // ================== SEND NOTIFICATIONS ==================
//         // The exclusion condition needs careful review: 
//         // If Admin posts, userId is null. The query should exclude the poster's ID (_id: { $ne: adminId } or _id: { $ne: userId })
//         const posterId = userId || adminId;
        
//         const users = await User.find({
//             // Exclude the ID of the person/admin who posted the property
//             _id: { $ne: posterId }, 
//             fcmToken: { $exists: true, $ne: null, $ne: "" }, 
//         });

//         const tokens = [...new Set(users.map(u => u.fcmToken).filter(t => typeof t === "string" && t.trim() !== ""))];

//         let sentCount = 0;
//         let failedCount = 0;

//         if (tokens.length > 0) {
//             try {
//                 const response = await sendPushNotification(
//                     tokens,
//                     "🏠 New Property Added!",
//                     "A new property has just been listed.",
//                     { propertyId: property._id.toString() }
//                 );

//                 if (response?.responses) {
//                     response.responses.forEach((resp) => {
//                         if (resp.success) sentCount++;
//                         else failedCount++;
//                     });
//                 }
//             } catch (err) {
//                 console.error("Error sending push notifications:", err);
//                 failedCount = tokens.length;
//             }
//         }

//         // ================== RESPONSE ==================
//         res.status(201).json({
//             message: "Property added successfully & notifications processed!",
//             property,
//             notificationStats: {
//                 totalUsers: tokens.length,
//                 sentCount,
//                 failedCount,
//             },
//         });

//     } catch (error) {
//         console.error("Add Property Error:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

// export const addProperty = async (req, res) => {
//   try {
//     // -------------------- Identify Entity (Admin or User) --------------------
//     let userId = null;
//     let adminId = null;
//     let entity;
//     const isPostedByAdmin = !!req.user?.email && !!req.user?.fullName;

//     if (isPostedByAdmin) {
//       entity = req.user;
//       adminId = entity._id;
//     } else {
//       const postedUserId = req.user.id || req.user._id;
//       entity = await User.findById(postedUserId);

//       if (!entity) return res.status(404).json({ message: "User not found" });

//       userId = entity._id;
//     }

//     // -------------------- Body Data --------------------
//     const {
//       propertyLocation, areaDetails, availability, price, description,
//       furnishingStatus, parking, purpose, propertyType, commercialType,
//       residentialType, contactNumber, bedrooms, bathrooms, balconies,
//       floorNumber, totalFloors, facingDirection, noticePeriod, foodIncluded,
//       pgType, sharingType,
//     } = req.body;

//     // -------------------- Generate Custom Property ID --------------------
//     let customPropertyId;

//     if (isPostedByAdmin) {
//       const count = await Property.countDocuments({ adminId });
//       customPropertyId = `A-${adminId.toString().slice(-4)}-${count + 1}`;
//     } else {

//       if (entity.serialId === null || entity.serialId === undefined) {
//         const counter = await Counter.findByIdAndUpdate(
//           { _id: "userSerialId" },
//           { $inc: { seq: 1 } },
//           { new: true, upsert: true }
//         );

//         await User.findByIdAndUpdate(userId, { serialId: counter.seq });
//         entity.serialId = counter.seq; // update in memory
//       }

//       const listingCount = Number(entity.myListingsCount || 0) + 1;
//       const serial = Number(entity.serialId || 0);

//       customPropertyId = `S${serial}-${listingCount}`;
//     }

//     // -------------------- Geocoding --------------------
//     const geoRes = await geocoder.geocode(propertyLocation);
//     const coordinates = geoRes.length
//       ? [geoRes[0].longitude, geoRes[0].latitude]
//       : [0, 0];

//     // -------------------- File Handling --------------------
//     const photoPaths = (req.files || []).map((file) => file.path);

//     // -------------------- Property Document --------------------
//     const propertyData = {
//       userId, adminId, isPostedByAdmin, customPropertyId,
//       propertyLocation,
//       geoLocation: { type: "Point", coordinates },
//       areaDetails: Number(areaDetails || 0),
//       bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
//       availability, price: Number(price), description,
//       photosAndVideo: photoPaths,
//       furnishingStatus, parking, purpose,
//       facingDirection,
//       ...(propertyType === "Commercial"
//         ? { commercialType }
//         : { residentialType, balconies: Number(balconies), floorNumber: Number(floorNumber), totalFloors: Number(totalFloors) }),
//       ...(purpose === "Rent/Lease" || purpose === "Paying Guest" ? { noticePeriod } : {}),
//       ...(purpose === "Paying Guest" ? { foodIncluded, pgType, sharingType } : {}),
//       propertyType,
//       contactNumber
//     };

//     const property = new Property(propertyData);
//     await property.save();

//     // -------------------- Increase Listing Count If User --------------------
//     if (!isPostedByAdmin) {
//       await User.findByIdAndUpdate(userId, { $inc: { myListingsCount: 1 } });
//     }

//     // -------------------- Response --------------------
//     return res.status(201).json({
//       message: "Property added successfully!",
//       property,
//     });

//   } catch (error) {
//     console.error("Add Property Error:", error);
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

export const addProperty = async (req, res) => {
  try {
    // -------------------- Identify Entity (Admin or User) --------------------
    let userId = null;
    let adminId = null;
    let entity;
    const isPostedByAdmin = !!req.user?.email && !!req.user?.fullName;

    if (isPostedByAdmin) {
      entity = req.user;
      adminId = entity._id;
    } else {
      const postedUserId = req.user.id || req.user._id;
      entity = await User.findById(postedUserId);

      if (!entity) {
        return res.status(404).json({ message: "User not found" });
      }

      userId = entity._id;
    }

    // -------------------- Body Data (UPDATED) --------------------
    console.log('🔍 Raw req.body:', req.body);
    
    // Handle address data (multiple approaches for compatibility)
    let state, city, locality, pincode;
    
    if (req.body.address && typeof req.body.address === 'string') {
      // Case 1: Address sent as JSON string (current approach)
      try {
        const addressObj = JSON.parse(req.body.address);
        state = addressObj.state;
        city = addressObj.city;
        locality = addressObj.locality;
        pincode = addressObj.pincode;
        console.log('📦 Using address from JSON string:', addressObj);
      } catch (error) {
        console.error('❌ Failed to parse address JSON:', error);
        // Fallback to individual fields
        state = req.body.state;
        city = req.body.city;
        locality = req.body.locality;
        pincode = req.body.pincode;
      }
    } else if (req.body.address && typeof req.body.address === 'object') {
      // Case 2: Address sent as nested object (bracket notation worked)
      state = req.body.address.state;
      city = req.body.address.city;
      locality = req.body.address.locality;
      pincode = req.body.address.pincode;
      console.log('📦 Using nested address object:', req.body.address);
    } else {
      // Case 3: Address sent as individual fields (fallback)
      state = req.body.state;
      city = req.body.city;
      locality = req.body.locality;
      pincode = req.body.pincode;
      console.log('📋 Using individual address fields');
    }
    
    console.log('🏠 Final Address Fields:', { state, city, locality, pincode });
    
    // Validate address fields
    if (!state || !city || !locality || !pincode) {
      console.error('❌ Address validation failed:', { state, city, locality, pincode });
      return res.status(400).json({
        success: false,
        message: "Address validation failed",
        error: "All address fields (state, city, locality, pincode) are required",
        receivedFields: { state, city, locality, pincode },
        debugInfo: {
          rawBodyAddress: req.body.address,
          bodyKeys: Object.keys(req.body)
        }
      });
    }

    const {
      // 🔹 OTHER FIELDS (AS-IS)
      areaDetails,
      availability,
      price,
      description,
      furnishingStatus,
      parking,
      purpose,
      propertyType,
      commercialType,
      residentialType,
      contactNumber,
      bedrooms,
      bathrooms,
      balconies,
      floorNumber,
      totalFloors,
      facingDirection,
      noticePeriod,
      foodIncluded,
      pgType,
      sharingType,
    } = req.body;

    // -------------------- Build Property Location --------------------
    const propertyLocation = `${locality}, ${city}, ${state} - ${pincode}`;

    // -------------------- Generate Custom Property ID --------------------
    let customPropertyId;

    if (isPostedByAdmin) {
      const count = await Property.countDocuments({ adminId });
      customPropertyId = `A-${adminId.toString().slice(-4)}-${count + 1}`;
    } else {
      if (entity.serialId === null || entity.serialId === undefined) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: "userSerialId" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

        await User.findByIdAndUpdate(userId, { serialId: counter.seq });
        entity.serialId = counter.seq;
      }

      const listingCount = Number(entity.myListingsCount || 0) + 1;
      const serial = Number(entity.serialId || 0);

      customPropertyId = `S${serial}-${listingCount}`;
    }

    // -------------------- Geocoding --------------------
    const geoRes = await geocoder.geocode(propertyLocation);
    const coordinates = geoRes.length
      ? [geoRes[0].longitude, geoRes[0].latitude]
      : [0, 0];

    // -------------------- File Handling --------------------
    const photoPaths = (req.files || []).map((file) => file.path);

    // -------------------- Property Document --------------------
    const propertyData = {
      userId,
      adminId,
      isPostedByAdmin,
      customPropertyId,

      // 🔹 LOCATION DATA
      propertyLocation,
      address: {
        state,
        city,
        locality,
        pincode,
      },
      geoLocation: { type: "Point", coordinates },

      // 🔹 OTHER DATA
      areaDetails: Number(areaDetails || 0),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      availability,
      price: Number(price),
      description,
      photosAndVideo: photoPaths,
      furnishingStatus,
      parking,
      purpose,
      facingDirection,

      ...(propertyType === "Commercial"
        ? { commercialType }
        : {
            residentialType,
            balconies: Number(balconies),
            floorNumber: Number(floorNumber),
            totalFloors: Number(totalFloors),
          }),

      ...(purpose === "Rent/Lease" || purpose === "Paying Guest"
        ? { noticePeriod }
        : {}),

      ...(purpose === "Paying Guest"
        ? { foodIncluded, pgType, sharingType }
        : {}),

      propertyType,
      contactNumber,
    };

    const property = new Property(propertyData);
    await property.save();

    // -------------------- Increase Listing Count If User --------------------
    if (!isPostedByAdmin) {
      await User.findByIdAndUpdate(userId, {
        $inc: { myListingsCount: 1 },
      });
    }

    // -------------------- Response --------------------
    return res.status(201).json({
      message: "Property added successfully!",
      property,
    });

  } catch (error) {
    console.error("Add Property Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// controllers/propertyController.js
//  Track property visits

export const visitProperty = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    //  Check if user has already visited this property
    const alreadyVisited = property.visitedBy.some(
      (visit) => visit.userId.toString() === userId
    );

    //  Only push + increment enquiriesCount if first time visit
    if (userId && !alreadyVisited) {
      property.visitedBy.push({ userId });
      await User.findByIdAndUpdate(userId, { $inc: { enquiriesCount: 1 } });
    }

    //  Always increment property visitCount
    property.visitCount += 1;

    await property.save();

    res.status(200).json({
      message: "Property visit recorded successfully",
      visitCount: property.visitCount,
    });
  } catch (error) {
    console.error("Error recording property visit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//  Get nearby properties
// export const getNearbyProperties = async (req, res) => {
//   try {
//     const { lng, lat } = req.query;

//     if (!lng || !lat) {
//       return res.status(400).json({ message: "lng and lat are required" });
//     }

//     const distance =  20000;

//     const properties = await Property.find({
//       geoLocation: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [parseFloat(lng), parseFloat(lat)],
//           },
//           $maxDistance: distance, // meters
//         },
//       },
//     });

//     res.status(200).json(properties);
//   } catch (error) {
//     console.error("Nearby Properties Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const getNearbyProperties = async (req, res) => {
//   try {
//     const userId = req.user?.id; // From auth middleware
//     const { lat, lng, distance } = req.query; // distance now comes from frontend

//     //  Validate user
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized: userId missing" });
//     }

//     //  Validate coordinates
//     if (!lat || !lng) {
//       return res.status(400).json({
//         success: false,
//         message: "Latitude and Longitude are required",
//       });
//     }

//     const latitude = parseFloat(lat);
//     const longitude = parseFloat(lng);

//     //  Dynamic distance (convert km to meters if provided)
//     // Example: if frontend sends distance=10 => means 10 km => 10000 meters
//     const distanceInMeters = distance ? parseFloat(distance) * 1000 : 20000; // Default 20km

//     //  Find properties near user's live location
//     const nearbyProperties = await Property.find({
//       geoLocation: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [longitude, latitude],
//           },
//           $maxDistance: distanceInMeters,
//         },
//       },
//       userId: { $ne: userId }, // Exclude current user's own listings
//     });

//     //  Response
//     return res.status(200).json({
//       success: true,
//       count: nearbyProperties.length,
//       distanceUsed: distanceInMeters / 1000 + " km",
//       message: "Nearby properties fetched successfully",
//       data: nearbyProperties,
//     });
//   } catch (error) {
//     console.error("Nearby Properties Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching nearby properties",
//       error: error.message,
//     });
//   }
// };



export const getNearbyProperties = async (req, res) => {
  try {
    const userId = req.user?.id; // From auth middleware
    const { lat, lng, distance, location } = req.query;

    //  Validate user
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: userId missing" });
    }

    //  Step 1: Initialize latitude & longitude
    let latitude, longitude, placeName;

    //  CASE 1: Frontend directly provides coordinates
    if (lat && lng) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lng);

      // Reverse geocode to get readable place name
      const reverseRes = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: {
          q: `${latitude},${longitude}`,
          key: process.env.OPENCAGE_KEY,
          limit: 1,
        },
      });

      placeName = reverseRes.data.results[0]?.formatted || "Unknown location";
    }

    // ✅ CASE 2: Frontend sends location name (manual search)
    else if (location) {
      const geoRes = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: {
          q: location,
          key: process.env.OPENCAGE_KEY,
          limit: 1,
          countrycode: "in",
        },
      });

      if (geoRes.data.results && geoRes.data.results.length > 0) {
        latitude = geoRes.data.results[0].geometry.lat;
        longitude = geoRes.data.results[0].geometry.lng;
        placeName = geoRes.data.results[0].formatted;
      } else {
        return res.status(404).json({ success: false, message: "Location not found" });
      }
    }

    // ✅ CASE 3: Use logged-in user's saved address + pinCode
    else {
      const user = await User.findById(userId).select("street city state pinCode");

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // 📍 Full address for geocoding (best accuracy)
      const fullAddress = `${user.street || ""}, ${user.city || ""}, ${user.state || ""}, ${user.pinCode || ""}`.trim();

      console.log("📍 Full user address for geocoding:", fullAddress);

      const geoRes = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
        params: {
          q: fullAddress,
          key: process.env.OPENCAGE_KEY,
          limit: 1,
          countrycode: "in",
        },
      });

      if (geoRes.data.results && geoRes.data.results.length > 0) {
        latitude = geoRes.data.results[0].geometry.lat;
        longitude = geoRes.data.results[0].geometry.lng;
        placeName = geoRes.data.results[0].formatted;
      } else {
        console.warn("⚠️ Could not geocode user's address, using default Delhi coordinates");
        latitude = 28.6139;
        longitude = 77.2090;
        placeName = "Default Location (Delhi)";
      }
    }

    // 🧮 Step 2: Convert km to meters (default 20 km)
    const distanceInMeters = distance ? parseFloat(distance) * 1000 : 20000;
    

    // 🏘️ Step 3: Find nearby properties (exclude self)
    const nearbyProperties = await Property.find({
      geoLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: distanceInMeters,
        },
      },
      userId: { $ne: userId },
    });

    const user = await User.findById(userId).select("street city state pinCode");
    const fullAddress = `${user.street || ""}, ${user.city || ""}, ${user.state || ""}, ${user.pinCode || ""}`.trim();


    // 🧾 Step 4: Return response
    return res.status(200).json({
      success: true,
      count: nearbyProperties.length,
      distanceUsed: distanceInMeters / 1000 + " km",
      usedLocation: {
        latitude,
        longitude,

      },
      userAddressUsed: fullAddress || "derived from user profile",
      message: "Nearby properties fetched successfully",
      data: nearbyProperties,
    });
  } catch (error) {
    console.error("❌ Nearby Properties Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching nearby properties",
      error: error.message,
    });
  }
};


// DELETE property by ID
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    //  Decrement user's myListingsCount
    await User.findByIdAndUpdate(property.userId, { $inc: { myListingsCount: -1 } });

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete Property Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE property by ID
// UPDATE property by ID (only specific fields)


// export const updateProperty = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const allowedFields = [
//       "propertyLocation",
//       "description",
//       "price",
//       "areaDetails",
//       "purpose",
//     ];

//     const updatedData = {};
//     for (const key of allowedFields) {
//       if (req.body[key] !== undefined) {
//         updatedData[key] = req.body[key];
//       }
//     }

//     //  Fix image path for multer uploads
//     if (req.files && req.files.length > 0) {
//       const photoPaths = req.files.map((file) => {
//         // sirf filename add karo
//       return `uploads/${file.filename}`;
//       });
//       updatedData.photosAndVideo = photoPaths;
//     }

//     //  Update geoLocation if location changed
//     if (updatedData.propertyLocation) {
//       const geoRes = await geocoder.geocode(updatedData.propertyLocation);
//       if (geoRes.length > 0) {
//         updatedData.geoLocation = {
//           type: "Point",
//           coordinates: [geoRes[0].longitude, geoRes[0].latitude],
//         };
//       }
//     }

//     //  Update in DB
//     const property = await Property.findByIdAndUpdate(id, updatedData, {
//       new: true,
//       runValidators: true,
//     });

//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     res.status(200).json({
//       message: "Property updated successfully",
//       property,
//     });
//   } catch (error) {
//     console.error("Update Property Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        // CustomPropertyId SHOULD NOT be in this list
        const allowedFields = [
            "propertyLocation",
            "description",
            "price",
            "areaDetails",
            "purpose",
            "bedrooms", // NEW
            "bathrooms", // NEW
            "balconies", // NEW
            "floorNumber", // NEW
            "totalFloors", // NEW
            "facingDirection", // NEW
            "availability",
            "furnishingStatus",
            "parking",
            "noticePeriod", // NEW
            "foodIncluded", // NEW
            "pgType", // NEW
            "sharingType", // NEW
            "propertyType",
            "commercialType",
            "residentialType",
            "contactNumber",
        ];

        const updatedData = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                // Type casting for numeric fields
                if (["price", "areaDetails", "bedrooms", "bathrooms", "balconies", "floorNumber", "totalFloors"].includes(key)) {
                    updatedData[key] = Number(req.body[key]);
                } else {
                    updatedData[key] = req.body[key];
                }
            }
        }

        // Fix image path for multer uploads
        if (req.files && req.files.length > 0) {
            const photoPaths = req.files.map((file) => {
                return `uploads/${file.filename}`;
            });
            updatedData.photosAndVideo = photoPaths;
        }

        // Update geoLocation if location changed
        if (updatedData.propertyLocation) {
            const geoRes = await geocoder.geocode(updatedData.propertyLocation);
            if (geoRes.length > 0) {
                updatedData.geoLocation = {
                    type: "Point",
                    coordinates: [geoRes[0].longitude, geoRes[0].latitude],
                };
            }
        }

        // Update in DB
        const property = await Property.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true,
        });

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.status(200).json({
            message: "Property updated successfully",
            property,
        });
    } catch (error) {
        console.error("Update Property Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const markPropertyAsSold = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the property by ID
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Toggle the sold status
    property.isSold = !property.isSold;
    await property.save();

    return res.status(200).json({
      success: true,
      message: property.isSold
        ? "Property marked as sold successfully"
        : "Property marked as unsold successfully",
      isSold: property.isSold,
      property,
    });
  } catch (error) {
    console.error("Error toggling sold status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
//  Get all sold properties
export const getSoldProperties = async (req, res) => {
  try {
    // Fetch only properties where isSold = true
    const soldProperties = await Property.find({ isSold: true }).populate("userId", "fullName email");

    if (soldProperties.length === 0) {
      return res.status(404).json({ success: false, message: "No sold properties found" });
    }

    return res.status(200).json({
      success: true,
      count: soldProperties.length,
      soldProperties,
    });
  } catch (error) {
    console.error("Error fetching sold properties:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


//  Delete a sold property by ID
export const deleteSoldProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (!property.isSold) {
      return res.status(400).json({ success: false, message: "This property is not marked as sold" });
    }

    await Property.findByIdAndDelete(id);

    // Decrement user's myListingsCount
    await User.findByIdAndUpdate(property.userId, { $inc: { myListingsCount: -1 } });

    return res.status(200).json({
      success: true,
      message: "Sold property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sold property:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//  Get sold properties by logged-in user
export const getMySoldProperties = async (req, res) => {
  try {
    const userId = req.user.id; //  userId from verifyToken middleware

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing user ID" });
    }

    //  Fetch sold properties belonging to this user
    const soldProperties = await Property.find({ userId, isSold: true })
      .sort({ createdAt: -1 }) // latest first
      .populate("userId", "fullName email");

    if (soldProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sold properties found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      count: soldProperties.length,
      soldProperties,
    });
  } catch (error) {
    console.error("Error fetching user's sold properties:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    // Optional filters
    const { purpose, propertyType, isSold, minPrice, maxPrice } = req.query;

    let filter = {};

    if (purpose) filter.purpose = purpose;
    if (propertyType) filter.propertyType = propertyType;
    if (isSold !== undefined) filter.isSold = isSold === "true";
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const properties = await Property.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: properties.length,
      message: "All properties fetched successfully",
      data: properties,
    });

  } catch (error) {
    console.error("Get All Properties Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
