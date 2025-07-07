import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import StatusRoute from "./routes/status.route.js";
import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";
import { app, server } from "./SocketIO/server.js";


dotenv.config();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(cors({
  origin: ["http://localhost:5173", "https://chatting-application-1.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;

try {
    mongoose.connect(URI);
    console.log("Connected to MongoDB");
} catch (error) {
    console.log(error);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173'); // Allow requests from your frontend origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Add allowed methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add allowed headers
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials
  if (req.method === 'OPTIONS') {
    res.sendStatus(200); // Handle preflight requests
  } else {
    next();
  }
});


//routes
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);
app.use("/api/status", StatusRoute);
server.listen(PORT, () => {
    console.log(`Server is Running on port ${PORT}`);
});