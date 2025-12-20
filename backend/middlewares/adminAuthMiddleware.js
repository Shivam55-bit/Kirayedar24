// import jwt from "jsonwebtoken";
// import Admin from "../models/adminAuthSchema.js";

// export const verifyAdminToken = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

//     if (!token) return res.status(401).json({ message: "No token, authorization denied" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const admin = await Admin.findById(decoded.id);
//     if (!admin) return res.status(401).json({ message: "Invalid token" });

//     req.user = admin;
//     next();
//   } catch (error) {
//     console.error("Token Verification Error:", error);
//     res.status(401).json({ message: "Token is not valid", error: error.message });
//   }
// };

import jwt from "jsonwebtoken";
import Admin from "../models/adminAuthSchema.js";

export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Invalid token" });

    req.user = admin;
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    res.status(401).json({ message: "Token is not valid", error: error.message });
  }
};