import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Call from "../models/call.model.js";
import Conversation from "../models/conversation.model.js";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://chatting-application-1.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = {}; // Store online users
const activeCalls = {}; // Track active calls

export const getReceiverSocketId = (receiverId) => {
  return users[receiverId];
};

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

  // ✅ Enhanced WebRTC Call Handling

  // 1. Initiate a call
  socket.on("call-user", async ({ from, to, offer, callType }) => {
    const receiverSocketId = users[to];
    if (!receiverSocketId) {
      socket.emit("call-failed", { message: "Receiver is offline" });
      return;
    }

    const callId = uuidv4();
    activeCalls[callId] = {
      senderId: from,
      receiverId: to,
      callType,
      status: "ringing",
      startTime: new Date(),
    };

    await Call.create({
      callId,
      caller: from,
      receiver: to,
      callType,
      status: "ringing",
      startedAt: new Date(),
    });

    io.to(receiverSocketId).emit("incoming-call", {
      from,
      offer,
      callType,
    });

    socket.emit("call-initiated", { callId });
  });

  // 2. Accept call
  socket.on("answer-call", async ({ to, answer }) => {
    const callerSocketId = users[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { answer });
    }
  });

  // 3. Reject call
  socket.on("reject-call", async ({ to }) => {
    const callerSocketId = users[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
    }
  });

  // 4. End call
  socket.on("end-call", async ({ to }) => {
    const receiverSocketId = users[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended");
    }
  });

  // 5. WebRTC Signaling
  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-ice-candidate", { candidate });
    }
  });

  // ✅ Disconnect handler
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("getOnlineUsers", Object.keys(users));
    }
  });
});

export { app, io, server };
