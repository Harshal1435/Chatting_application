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

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
  const allowedOrigins = [
        "http://localhost:5173",
        "https://chatting-application-mu.vercel.app",
        "https://chatting-application-1.netlify.app",
      ];
app.use(
  cors({
    origin: (origin, callback) => {
    

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI;

try {
    mongoose.connect(URI);
    console.log("Connected to MongoDB");
} catch (error) {
    console.log(error);
}



app.use("/", (req, res) => {
    res.send("API is running...");
});

//routes
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);
app.use("/api/status", StatusRoute);
app.use("/api/post", postRoute)
server.listen(PORT, () => {
    console.log(`Server is Running on port ${PORT}`);
});