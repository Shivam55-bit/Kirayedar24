import admin from "firebase-admin";
// import { readFileSync } from "fs";
// import path from "path";

// Temporary disable firebase for testing
// const serviceAccountPath = path.resolve("serviceAccountKey.json");
// const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK (only once)
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
//   console.log(" Firebase Admin initialized successfully!");
// }

console.log("⚠️ Firebase temporarily disabled for testing");

export default admin;