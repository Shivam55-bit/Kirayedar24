const fs = require("fs");
const path = require("path");
const { FranDriver, FranVehicle, FranVideo, FranFranchise } = require("../models/franchise");

// ---------------- DRIVER LICENSE / LL / ADMISSION ---------------- //
exports.uploadDL_LL = async (req, res) => {
  try {
    const { driverId, type } = req.body; // type: 'DL' or 'LL'
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const driver = await FranDriver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (type === "DL") driver.DL = file.filename;
    if (type === "LL") driver.LL = file.filename;
    await driver.save();

    res.json({ message: `${type} uploaded successfully`, driver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.registerAdmission = async (req, res) => {
  try {
    const { name, age, hasDL, address, totalFees, duration } = req.body;

    if (!req.file) return res.status(400).json({ message: "Photo is required" });

    const franchise = new FranFranchise({
      name,
      age,
      hasDL,
      address,
      totalFees,
      duration,
      photo: req.file.filename,
    });

    await franchise.save();
    res.json({ message: "Admission registered", franchise });
  } catch (err) {
    console.error("Register admission error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};




// ---------------- VIDEO POSTS ---------------- //
exports.postVideo = async (req, res) => {
  try {
    const { title, heading } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No video uploaded" });

    const video = new FranVideo({
      title,
      heading,
      filename: file.filename,
      uploadedAt: new Date(),
    });

    await video.save();
    res.json({ message: "Video posted", video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- DRIVER OFFLINE DUTY ---------------- //
exports.assignOfflineDuty = async (req, res) => {
  try {
    const { driverId, dutyTime } = req.body;
    const driver = await FranDriver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.offlineDuty = dutyTime;
    await driver.save();
    res.json({ message: "Offline duty assigned", driver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- DRIVER STATUS ---------------- //
exports.updateDriverStatus = async (req, res) => {
  try {
    const { driverId, status } = req.body; // status: active/inactive
    const driver = await FranDriver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.status = status;
    await driver.save();
    res.json({ message: `Driver is now ${status}`, driver });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- WALLET ---------------- //
exports.updateWallet = async (req, res) => {
  try {
    const { driverId, amount } = req.body;
    const driver = await FranDriver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.wallet = (driver.wallet || 0) + amount;
    await driver.save();
    res.json({ message: "Wallet updated", wallet: driver.wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- INSURANCE & POLLUTION ---------------- //
exports.applyRenewal = async (req, res) => {
  try {
    const { vehicleId, type } = req.body; // type: insurance/pollution
    const vehicle = await FranVehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    if (type === "insurance") vehicle.insuranceRenewal = new Date();
    if (type === "pollution") vehicle.pollutionRenewal = new Date();

    await vehicle.save();
    res.json({ message: `${type} renewed`, vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- ADD DRIVER ---------------- //
// ---------------- ADD DRIVER ---------------- //



// Add a new driver
exports.addDriver = async (req, res) => {
  try {
    console.log("=== ADD DRIVER REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    const {
      name,
      age,
      aadhaarNumber,
      drivingLicenceNumber,
      address,
      phoneNumber,
      email,
    } = req.body;

    // Validate required fields
    if (!name || !age || !aadhaarNumber || !drivingLicenceNumber || !address || !phoneNumber) {
      console.log("Missing required fields");
      return res.status(400).json({ 
        message: "Missing required fields",
        received: { name: !!name, age: !!age, aadhaarNumber: !!aadhaarNumber, drivingLicenceNumber: !!drivingLicenceNumber, address: !!address, phoneNumber: !!phoneNumber },
        required: ["name", "age", "aadhaarNumber", "drivingLicenceNumber", "address", "phoneNumber"]
      });
    }

    // Validate age is a valid number
    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      return res.status(400).json({ 
        message: "Invalid age. Must be a number between 18 and 100",
        receivedAge: age
      });
    }

    // Validate Aadhaar number format (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber.toString())) {
      return res.status(400).json({ 
        message: "Invalid Aadhaar number. Must be 12 digits",
        receivedAadhaar: aadhaarNumber
      });
    }

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber.toString())) {
      return res.status(400).json({ 
        message: "Invalid phone number. Must be 10 digits",
        receivedPhone: phoneNumber
      });
    }

    // Validate files
    if (
      !req.files ||
      !req.files.aadhaarImage ||
      !req.files.drivingLicenceImage ||
      !req.files.aadhaarImage[0] ||
      !req.files.drivingLicenceImage[0]
    ) {
      console.log("File validation failed");
      return res.status(400).json({ 
        message: "Both Aadhaar and Driving Licence images are required",
        files: {
          hasFiles: !!req.files,
          hasAadhaarImage: !!(req.files && req.files.aadhaarImage),
          hasDrivingLicenceImage: !!(req.files && req.files.drivingLicenceImage)
        }
      });
    }

    // Check if driver with same Aadhaar or phone already exists
    const existingDriver = await FranDriver.findOne({
      $or: [
        { aadhaarNumber: aadhaarNumber.trim() },
        { phoneNumber: phoneNumber.trim() }
      ]
    });

    if (existingDriver) {
      return res.status(409).json({ 
        message: "Driver already exists with this Aadhaar number or phone number",
        conflict: existingDriver.aadhaarNumber === aadhaarNumber.trim() ? "aadhaarNumber" : "phoneNumber"
      });
    }

    console.log("Creating new driver...");
    const driver = new FranDriver({
      name: name.trim(),
      age: parsedAge,
      aadhaarNumber: aadhaarNumber.trim(),
      aadhaarImage: req.files.aadhaarImage[0].filename,
      drivingLicenceNumber: drivingLicenceNumber.trim(),
      drivingLicenceImage: req.files.drivingLicenceImage[0].filename,
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email ? email.trim() : undefined,
      status: "inactive",
      wallet: 0,
    });

    console.log("Saving driver to database...");
    const savedDriver = await driver.save();
    console.log("Driver saved successfully:", savedDriver._id);

    res.status(201).json({ 
      message: "Driver added successfully", 
      driver: {
        _id: savedDriver._id,
        name: savedDriver.name,
        age: savedDriver.age,
        aadhaarNumber: savedDriver.aadhaarNumber,
        drivingLicenceNumber: savedDriver.drivingLicenceNumber,
        address: savedDriver.address,
        phoneNumber: savedDriver.phoneNumber,
        email: savedDriver.email,
        status: savedDriver.status,
        wallet: savedDriver.wallet,
        createdAt: savedDriver.createdAt
      }
    });
  } catch (err) {
    console.error("=== ADD DRIVER ERROR ===");
    console.error("Error message:", err.message);
    console.error("Error name:", err.name);
    console.error("Full error:", err);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      return res.status(400).json({ 
        message: "Validation error",
        errors: validationErrors
      });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "Duplicate key error",
        field: Object.keys(err.keyPattern || {})[0] || "unknown"
      });
    }

    res.status(500).json({ 
      message: "Internal server error",
      error: err.message,
      type: err.name || "Unknown"
    });
  }
};






// ---------------- ADD VEHICLE ---------------- //
exports.addVehicle = async (req, res) => {
  try {
    const vehicle = new FranVehicle(req.body);
    await vehicle.save();
    res.json({ message: "Vehicle added", vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET / EDIT / DELETE ---------------- //
exports.getAll = async (req, res) => {
  const { type } = req.params; // driver, vehicle, video, franchise
  try {
    let data;
    if (type === "driver") data = await FranDriver.find();
    if (type === "vehicle") data = await FranVehicle.find();
    if (type === "video") data = await FranVideo.find();
    if (type === "franchise") data = await FranFranchise.find();

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteItem = async (req, res) => {
  const { type, id } = req.params;
  try {
    let model;
    if (type === "driver") model = FranDriver;
    if (type === "vehicle") model = FranVehicle;
    if (type === "video") model = FranVideo;
    if (type === "franchise") model = FranFranchise;

    const item = await model.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: `${type} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.editItem = async (req, res) => {
  const { type, id } = req.params;
  try {
    let model;
    if (type === "driver") model = FranDriver;
    if (type === "vehicle") model = FranVehicle;
    if (type === "video") model = FranVideo;
    if (type === "franchise") model = FranFranchise;

    const item = await model.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: `${type} updated`, item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get all vehicles with insurance/pollution info
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await FranVehicle.find();
    res.json({ data: vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
