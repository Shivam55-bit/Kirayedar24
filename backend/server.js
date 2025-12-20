import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import router from "./routes/authRoute.js";
import addRouter from "./routes/addRoute.js";
import session from 'express-session';
import getRoute from "./routes/getRoutes.js";
import recentRoute from "./routes/recentRoute.js";
import saveRoute from "./routes/saveRoute.js";
import path from "path";
import editRoutes from "./routes/editProfileRoute.js";
import serviceRoutes from "./routes/serviceRoute.js";
import boughtRoute from "./routes/boughtRoute.js";
import chatRouter from "./routes/chatRoute.js"; // Chat routes
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import sellRoute from './routes/sellRoute.js'
import rentRoute from './routes/rentRoute.js'
import revenueRoute from './routes/revenueRoute.js'
import userRoute from './routes/userRoute.js'
import changePasswordRoute from './routes/changePasswordRoute.js' // Change Password Route
import adminAuthRoute from "./routes/adminAuthRoute.js";

dotenv.config();
const app = express();

// Middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing FormData with nested objects
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_CONN || "mongodb+srv://vikashchaudhary0475:IBZqeOzkxELsnfsl@clusters.fyjelmt.mongodb.net/99acer-db?retryWrites=true&w=majority&appName=99acer-backend")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// API Routes
app.use("/auth", router);
app.use("/property", addRouter);
app.use("/api/properties", getRoute);
app.use("/api/properties", recentRoute);
app.use("/api/properties", saveRoute);
app.use("/api/services", serviceRoutes);
app.use("/api/properties", boughtRoute);
app.use("/api/chat", chatRouter);
app.use("/api/users", editRoutes);
app.use("/api/properties", sellRoute);
app.use("/api/properties", rentRoute);
app.use("/api/properties", revenueRoute);
app.use("/api/users", userRoute); 
app.use("/api", changePasswordRoute); // Change Password Route
app.use("/admin", adminAuthRoute);


// Serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Create HTTP server and integrate Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // replace with frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Socket.io events for real-time chat
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat ${chatId}`);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.chatId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
server.listen(process.env.PORT || 4045, () => console.log(`Server running on port ${process.env.PORT || 4045}`));
