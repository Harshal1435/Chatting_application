import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import StatusRoute from "./routes/status.route.js";
import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
import { app, server } from "./SocketIO/server.js";
import postRoute from "./routes/userPost.route.js";

dotenv.config();

const allowedOrigins = [
  "http://localhost:5173",
  "https://chatting-application-mu.vercel.app",
  "https://chatting-application-1.netlify.app",
];

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// Single, correctly-configured CORS (no duplicate)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
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

// ── Database ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const URI  = process.env.MONGODB_URI;

mongoose
  .connect(URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/user",    userRoute);
app.use("/api/message", messageRoute);
app.use("/api/status",  StatusRoute);
app.use("/api/post",    postRoute);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
