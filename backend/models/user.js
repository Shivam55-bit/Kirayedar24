// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   phone: { type: String, required: true, unique: true },
//   state: String,
//   city: String,
//   street: String,
//   pinCode: String,
//   password: { type: String, required: true },
//   isEmailVerified: { type: Boolean, default: false },
//   isPhoneVerified: { type: Boolean, default: false },
  
// }, { timestamps: true });

// export default mongoose.model("User", userSchema);

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },

  state: String,
  city: String,
  street: String,
  pinCode: String,

  password: { 
    type: String, 
    required: false // Changed from true to false for OTP-based registration
  },

  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },

  isPhoneVerified: { 
    type: Boolean, 
    default: false 
  },

  // 🟩 Role added
  role: {
    type: String,
    enum: ["Owner", "Tenant"],
    default: "Tenant" // default can be changed as needed
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);
