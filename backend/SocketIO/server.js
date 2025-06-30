import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js"; // make sure the path is correct

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = {}; // Store online users

// Helper to get receiver's socket id
export const getReceiverSocketId = (receiverId) => {
  return users[receiverId];
};

// Handle socket events
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    console.log("👤 Online Users:", users);
  }

  io.emit("getOnlineUsers", Object.keys(users));

  // ✅ Handle message delivery acknowledgment
socket.on("send-message", async ({ messageData }) => {
  const { senderId, receiverId, encryptedMessage, iv } = messageData;

  const isDelivered = Boolean(users[receiverId]);

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message: encryptedMessage,
    iv,
    delivered: isDelivered,
  });

  // Send to receiver
  const receiverSocketId = users[receiverId];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receive-message", newMessage);
  }

  // Optionally send back to sender (e.g., for optimistic UI)
  const senderSocketId = users[senderId];
  if (senderSocketId) {
    io.to(senderSocketId).emit("message-sent", newMessage);
  }
});


  // ✅ Handle "seen" status
socket.on("mark-seen", async ({ messageId, senderId }) => {
  try {
    if (!messageId || !senderId) {
      console.warn("❌ mark-seen event missing messageId or senderId");
      return;
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { seen: true },
      { new: true }
    );

    if (!updatedMessage) {
      console.warn(`❌ Message with ID ${messageId} not found`);
      return;
    }

    const senderSocketId = users[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-seen", updatedMessage);
    }
  } catch (error) {
    console.error("❌ Error handling mark-seen event:", error);
  }
});


  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    delete users[userId];
    io.emit("getOnlineUsers", Object.keys(users));
  });
});

export { app, io, server };
