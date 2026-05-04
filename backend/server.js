import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

import StatusRoute from "./routes/status.route.js";
import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
import postRoute from "./routes/userPost.route.js";

import messageExtendedRoute from "./routes/messageExtended.route.js";
import chatSearchRoute from "./routes/chatSearch.route.js";
import offlineQueueRoute from "./routes/offlineQueue.route.js";
import pushNotificationRoute from "./routes/pushNotification.route.js";
import chatBackupRoute from "./routes/chatBackup.route.js";

import { app, server } from "./SocketIO/server.js";
import { startCronJobs } from "./Utils/cronJobs.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;

const allowedOrigins = [
  "http://localhost:5173",
  "https://chatting-application-mu.vercel.app",
  "https://chatting-application-1.netlify.app",
  "http://localhost:5000",
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Database
mongoose
  .connect(URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// API routes
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);
app.use("/api/status", StatusRoute);
app.use("/api/post", postRoute);

app.use("/api/message-extended", messageExtendedRoute);
app.use("/api/search", chatSearchRoute);
app.use("/api/offline-queue", offlineQueueRoute);
app.use("/api/notifications", pushNotificationRoute);
app.use("/api/backup", chatBackupRoute);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Frontend build path
const frontendPath = path.join(__dirname, "../Chat_bot_Frontend");
const frontendDistPath = path.join(frontendPath, "dist");

if (!fs.existsSync(path.join(frontendDistPath, "index.html"))) {
  console.log("⚠️ frontend/dist/index.html not found. Building frontend...");

  try {
    execSync("npm install", {
      cwd: frontendPath,
      stdio: "inherit",
    });

    execSync("npm run build", {
      cwd: frontendPath,
      stdio: "inherit",
    });

    console.log("✅ Frontend build created successfully");
  } catch (error) {
    console.error("❌ Frontend build failed:", error.message);
  }
}

// Serve frontend static files
app.use(express.static(frontendDistPath));

// Express 5 safe fallback
app.use((req, res) => {
  const indexPath = path.join(frontendDistPath, "index.html");

  // API fallback
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "Endpoint not found",
    });
  }

  // React frontend fallback
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).json({
    success: false,
    message: "Frontend build not found",
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startCronJobs();
});