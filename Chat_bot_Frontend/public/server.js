import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"
import userRoutes from "./routes/userRoutes.js"
import gameRoutes from "./routes/gameRoutes.js"
import path from "path"
import { fileURLToPath } from "url"
import { initializeSocketIO } from "./socket/socketManager.js"
import adminRoutes from "./routes/adminRoutes.js"
// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const PORT = process.env.PORT || 5000

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use("/api/auth", userRoutes)
app.use("/api/games", gameRoutes)
app.use("/api/admin", adminRoutes)
// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  // Any route that is not an API route will be redirected to index.html
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"))
  })
}

app.get("/", (req, res) => {
  res.send("server is running")
})

// Initialize Socket.IO
initializeSocketIO(io)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/databas")
  .then(() => {
    console.log("MongoDB connected successfully")
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err)
  // Close server & exit process
  process.exit(1)
})

