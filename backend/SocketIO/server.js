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
  socket.on("initiate-call", async ({ senderId, receiverId, callType }) => {
    const receiverSocketId = users[receiverId];
    if (!receiverSocketId) {
      socket.emit("call-failed", { message: "Receiver is offline" });
      return;
    }

    const callId = uuidv4();
    activeCalls[callId] = {
      senderId,
      receiverId,
      callType,
      status: "ringing",
      startTime: new Date()
    };

    // Create call log in DB
    await Call.create({
      callId,
      caller: senderId,
      receiver: receiverId,
      callType,
      status: "ringing",
      startedAt: new Date(),
    });

    // Notify receiver
    io.to(receiverSocketId).emit("incoming-call", {
      callId,
      senderId,
      callType
    });

    // Confirm to caller
    socket.emit("call-initiated", { callId });
  });

  // 2. Accept call
  socket.on("accept-call", async ({ callId }) => {
    const call = activeCalls[callId];
    if (!call) return;

    const callerSocketId = users[call.senderId];
    if (!callerSocketId) return;

    // Update call status
    call.status = "ongoing";
    await Call.findOneAndUpdate(
      { callId },
      { status: "accepted", acceptedAt: new Date() }
    );

    // Notify caller
    io.to(callerSocketId).emit("call-accepted", { callId });
  });

  // 3. Reject call
  socket.on("reject-call", async ({ callId }) => {
    const call = activeCalls[callId];
    if (!call) return;

    const callerSocketId = users[call.senderId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected", { callId });
    }

    // Update call log
    await Call.findOneAndUpdate(
      { callId },
      { status: "rejected", endedAt: new Date() }
    );

    delete activeCalls[callId];
  });

  // 4. End call
  socket.on("end-call", async ({ callId }) => {
    const call = activeCalls[callId];
    if (!call) return;

    const otherUserId = socket.userId === call.senderId ? call.receiverId : call.senderId;
    const otherUserSocketId = users[otherUserId];

    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("call-ended", { callId });
    }

    // Update call log
    await Call.findOneAndUpdate(
      { callId },
      { status: "ended", endedAt: new Date(), duration: new Date() - call.startTime }
    );

    delete activeCalls[callId];
  });

  // 5. WebRTC Signaling
  socket.on("webrtc-signal", ({ callId, signal, targetUserId }) => {
    const targetSocketId = users[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-signal", { callId, signal });
    }
  });

  // 6. ICE Candidates exchange
  socket.on("ice-candidate", ({ callId, candidate, targetUserId }) => {
    const targetSocketId = users[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { callId, candidate });
    }
  });

  // ✅ Disconnect handler
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("getOnlineUsers", Object.keys(users));
    }

    // Clean up active calls for this user
    Object.keys(activeCalls).forEach(callId => {
      const call = activeCalls[callId];
      if (call.senderId === socket.userId || call.receiverId === socket.userId) {
        delete activeCalls[callId];
        Call.findOneAndUpdate({ callId }, { status: "ended", endedAt: new Date() });
      }
    });
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



