import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Call from "../models/call.model.js";
import Conversation from "../models/conversation.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chatting-application-1.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = {}; // Store online users

export const getReceiverSocketId = (receiverId) => {
  return users[receiverId];
};

// ✅ Main Socket.IO logic
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    socket.userId = userId;
    console.log("👤 Online Users:", users);
    io.emit("getOnlineUsers", Object.keys(users));
  }

  // ✅ Handle sending messages
  socket.on("send-message", async ({ messageData }) => {
    const { senderId, receiverId, encryptedMessage, iv } = messageData;
    if (!senderId || !receiverId || !encryptedMessage || !iv) {
      return console.warn("❌ Missing message data");
    }

    const isDelivered = Boolean(users[receiverId]);
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: encryptedMessage,
      iv,
      delivered: isDelivered,
    });

    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-message", newMessage);
    }

    const senderSocketId = users[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-sent", newMessage);
    }
  });

  // ✅ Handle message seen
  socket.on("mark-seen", async ({ messageId, senderId }) => {
    if (!messageId || !senderId) return;
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { seen: true },
      { new: true }
    );
    const senderSocketId = users[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-seen", updatedMessage);
    }
  });

  // ✅ WebRTC Call Handling

  // 1. Start a call (send offer)
  socket.on("call-user", async ({ from, to, offer, callType }) => {
    const targetSocketId = users[to];
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("incoming-call", {
      from,
      offer,
      callType,
    });

    // Optional: create call log in DB
    await Call.create({
      caller: from,
      receiver: to,
      callType,
      status: "ringing",
      startedAt: new Date(),
    });
  });

  // 2. Accept a call (send answer)
  socket.on("answer-call", async ({ to, answer }) => {
    const targetSocketId = users[to];
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call-accepted", { answer });

    // Update call log status
    await Call.findOneAndUpdate(
      { caller: to, receiver: socket.userId, status: "ringing" },
      { status: "accepted", acceptedAt: new Date() }
    );
  });

  // 3. Reject call
  socket.on("reject-call", async ({ to }) => {
    const targetSocketId = users[to];
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call-rejected");

    // Update call log
    await Call.findOneAndUpdate(
      { caller: to, receiver: socket.userId, status: "ringing" },
      { status: "rejected", endedAt: new Date() }
    );
  });

  // 4. End call (by either user)
  socket.on("end-call", async ({ to }) => {
    const targetSocketId = users[to];
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call-ended");

    await Call.findOneAndUpdate(
      {
        $or: [
          { caller: socket.userId, receiver: to },
          { caller: to, receiver: socket.userId },
        ],
        status: { $in: ["accepted", "ringing"] },
      },
      { status: "ended", endedAt: new Date() }
    );
  });

  // ✅ Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("getOnlineUsers", Object.keys(users));
    }
  });
});

export { app, io, server };
