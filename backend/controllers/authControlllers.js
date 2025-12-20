import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

// Temporary store OTPs (in production use Redis or DB)
let emailOtps = {};


// Step 1: Send Email OTP
// export const sendEmailOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000);

//     emailOtps[email] = otp;

//     console.log("Email OTP:", otp);

//     const user = await User.find({ email: email });
//     if (user.length > 0) {
//       res.status(400).json({ message: "email already exist" });
//     } else {
//       res.status(200).json({ message: "otp sent successfully", otp });
//     }
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// // Step 2: Verify Email OTP
// export const verifyEmailOtp = (req, res) => {
//   const { email, otp } = req.body;
//   if (emailOtps[email] && emailOtps[email] == otp) {
//     delete emailOtps[email];
//     res.json({ success: true, message: "Email verified" });
//   } else {
//     res.status(400).json({ success: false, message: "Invalid OTP" });
//   }
// };

export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = 1234; // STATIC OTP

    emailOtps[email] = otp;

    console.log("Email OTP:", otp);

    const user = await User.find({ email: email });
    if (user.length > 0) {
      res.status(400).json({ message: "email already exist" });
    } else {
      res.status(200).json({ message: "otp sent successfully", otp });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyEmailOtp = (req, res) => {
  const { email, otp } = req.body;

  if (emailOtps[email] && emailOtps[email] == otp) {
    delete emailOtps[email];
    res.json({ success: true, message: "Email verified" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};


// Step 3: Send Phone OTP
// export const sendPhoneOtp = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000);

//     phoneOtps[phone] = otp;

//     console.log("Phone OTP:", otp);

//     // await client.messages.create({
//     //   body: `Your OTP is ${otp}`,
//     //   from: "+1XXXXXXXXXX", // Twilio registered number
//     //   to: phone
//     // });

//     res.json({ success: true, message: "Phone OTP sent" });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// // Step 4: Verify Phone OTP
// export const verifyPhoneOtp = (req, res) => {
//   const { phone, otp } = req.body;
//   if (phoneOtps[phone] && phoneOtps[phone] == otp) {
//     delete phoneOtps[phone];
//     res.json({ success: true, message: "Phone verified" });
//   } else {
//     res.status(400).json({ success: false, message: "Invalid OTP" });
//   }
// };




// Temporary OTP store
const phoneOtps = {};

// Step 3: Send Phone OTP
export const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP


    // save OTP
    phoneOtps[phone] = otp;

    console.log("Phone OTP:", otp);

    const access_token = "2653c6471e8bbee9a8c721182ea23b86";

    const message = `Your Kirayedar24 login OTP is ${otp}. It is valid for 5 minutes. If you did not request this OTP, please ignore it. - Team Kirayedar24`;

    const url = `https://apis.wappie.shop/v1/sms/messages?access_token=${access_token}&to=${phone}&country_code=+91&sender=KIRYDR&service=SI&message=${encodeURIComponent(message)}`;

    const response = await axios.get(url);

    console.log("SMS API Response:", response.data);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("SMS Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Step 4: Verify Phone OTP
export const verifyPhoneOtp = (req, res) => {
  const { phone, otp } = req.body;

  if (phoneOtps[phone] && phoneOtps[phone] == otp) {
    delete phoneOtps[phone];

    res.json({ success: true, message: "Phone verified" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};


//  Step 5: Final Signup
// export const signup = async (req, res) => {
//   try {
//     const { fullName, email, phone, state, city, street, pinCode, password } =
//       req.body;

//     const existingUser = await User.findOne({ 
//       $or: [{ email }, { phone }] 
//     });
//     if (existingUser) {
//       const conflictField = existingUser.email === email ? 'email' : 'phone';
//       return res.status(400).json({ 
//         success: false,
//         error: `User with this ${conflictField} already exists` 
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       fullName,
//       email,
//       phone,
//       state,
//       city,
//       street,
//       pinCode,
//       password: hashedPassword,
//       isEmailVerified: true, //  after OTP flow
//       isPhoneVerified: true,
//     });

//     await newUser.save();

//     // const token = jwt.sign({ id: newUser._id }, "secret123", {
//     //   expiresIn: "1d",
//     // });

//     res.json({ success: true, user: newUser });
//   } catch (err) {
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern)[0];
//       const message = field === 'email' 
//         ? 'Email already exists' 
//         : field === 'phone' 
//         ? 'Phone number already exists' 
//         : 'User already exists';
//       res.status(400).json({ success: false, error: message });
//     } else {
//       res.status(500).json({ success: false, error: err.message });
//     }
//   }
// };
// FINAL SIGNUP (Register User)
export const signup = async (req, res) => {
  try {
    const { fullName, email, phone, state, city, street, pinCode, password, role } =
      req.body;

    // Check user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "phone";
      return res.status(400).json({
        success: false,
        error: `User with this ${conflictField} already exists`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      phone,
      state,
      city,
      street,
      pinCode,
      password: hashedPassword,
      role: role || "Tenant", // default role
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    await newUser.save();

    res.json({ success: true, user: newUser });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message =
        field === "email"
          ? "Email already exists"
          : field === "phone"
          ? "Phone number already exists"
          : "User already exists";
      return res.status(400).json({ success: false, error: message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};


// LOGIN CONTROLLER
// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // check if email and password provided
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     // find user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // generate JWT token
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET || "mysecretkey",
//       { expiresIn: "24h" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//       },
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// google auth
const client = new OAuth2Client(process.env.CLIENT_ID);

export const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if not found
      user = new User({
        fullName: name,
        email,
        phone: "",          // Optional, can update later
        password: googleId, // Dummy password (or leave blank if your schema allows)
        isEmailVerified: true,
        isPhoneVerified: false,
      });

      await user.save();
    }

    // Generate JWT token for your app
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "mysecretkey",
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};


// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const editProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { fullName, email, phone, state, city, street, pinCode } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update fields
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.state = state || user.state;
    user.city = city || user.city;
    user.street = street || user.street;
    user.pinCode = pinCode || user.pinCode;

    await user.save();

    res.json({ success: true, message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


