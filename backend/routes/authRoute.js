// // import express from "express";
// // import { sendPhoneOtp, verifyPhoneOtp, signup , loginUser, googleLogin } from "../controllers/authControlllers.js";

// // const router = express.Router();

// // router.post("/send-phone-otp", sendPhoneOtp);
// // router.post("/verify-phone-otp", verifyPhoneOtp);
// // router.post("/signup", signup);
// // router.post("/login", loginUser);
// // router.post("/google-login", googleLogin );

// // export default router;

// import express from "express";
// import {
//   sendPhoneOtp,
//   verifyPhoneOtp,
// //   completeRegistration, // ✅ new controller
//   googleLogin,          // optional — keep if you support Google login
//   getAllUsers,
//   getUserById
// } from "../controllers/authControlllers.js";

// const router = express.Router();

// // OTP-based flow
// router.post("/send-phone-otp", sendPhoneOtp);
// router.post("/verify-phone-otp", verifyPhoneOtp);
// // router.post("/complete-registration", completeRegistration);

// // Optional: if you still support Google auth
// router.post("/google-login", googleLogin);

// router.get("/users", getAllUsers);
// router.get("/users/:id", getUserById);
// export default router;


import express from "express";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  googleAuth,
  getAllUsers,
  getUserById,
  loginUser,
  editProfile,
  signup,
  checkUserByPhone
} from "../controllers/authControlllers.js";

const router = express.Router();

router.post("/send-phone-otp", sendPhoneOtp);
router.post("/verify-phone-otp", verifyPhoneOtp);
router.post("/login", loginUser);
router.post("/google-login", googleAuth);
// Register
router.post("/signup", signup);
router.post("/check-user", checkUserByPhone);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/edit-profile/:id", editProfile);

export default router;