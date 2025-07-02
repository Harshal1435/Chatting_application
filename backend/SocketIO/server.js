// ✅ Updated socket.js with room-based signaling and controls
import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Call from "../models/call.model.js";

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
const activeCalls = new Map(); // Track active calls

export const getReceiverSocketId = (receiverId) => users[receiverId];

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    socket.userId = userId;
    io.emit("getOnlineUsers", Object.keys(users));
  }

  // ✅ Handle Messages
  socket.on("send-message", async ({ messageData }) => {
    const { senderId, receiverId, encryptedMessage, iv } = messageData;
    if (!senderId || !receiverId || !encryptedMessage || !iv) return;

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

  // ✅ New: WebRTC Room-based Call Signaling
  socket.on("startCall", ({ roomId, targetChatId, targetId, user, offer, peerId, myMicStatus, myCamStatus }) => {
    if (activeCalls.has(targetId)) {
      socket.emit("userBusy", { targetId, message: "User is already on another call" });
      return;
    }
    activeCalls.set(user._id, roomId);
    activeCalls.set(targetId, roomId);

    socket.join(roomId);
    const targetSocketId = users[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incomingCall", {
        roomId,
        caller: user,
        peerId,
        targetChatId,
        offer,
        targetId,
        callerCamStatus: myCamStatus,
        callerMicStatus: myMicStatus,
      });
    } else {
      socket.emit("notavailable", { message: "User is not online" });
    }
  });

  socket.on("acceptCall", ({ roomId, user, accepterPeerId, callerPeerId }) => {
    socket.join(roomId);
    io.to(roomId).emit("callActive", { accepterPeerId, callerPeerId, roomId, user });
  });

  socket.on("declineCall", ({ roomId, user, targetId }) => {
    activeCalls.delete(user._id);
    io.to(roomId).emit("callDeclined", { targetId, message: "Call was declined" });
  });

  socket.on("endCall", ({ roomId }) => {
    io.to(roomId).emit("callTerminated", { roomId });
    activeCalls.delete(roomId);
  });

  socket.on("toggleAudio", ({ roomId, micStatus }) => {
    io.to(roomId).emit("toggleAudio", { roomId, micStatus });
  });

  socket.on("toggleVideo", ({ roomId, camStatus }) => {
    io.to(roomId).emit("toggleVideo", { roomId, camStatus });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("getOnlineUsers", Object.keys(users));
    }
  });
});

export { app, io, server };
