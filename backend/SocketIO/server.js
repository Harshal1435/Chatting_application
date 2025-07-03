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

  // ... [keep your existing message handling code] ...

  // ✅ Enhanced WebRTC Call Handling

  // 1. Initiate a call
  socket.on("initiate-call", async ({ callerId, receiverId, callType }) => {
    const receiverSocketId = users[receiverId];
    if (!receiverSocketId) {
      socket.emit("call-failed", { message: "Receiver is offline" });
      return;
    }

    const callId = uuidv4();
    activeCalls[callId] = {
      callerId,
      receiverId,
      callType,
      status: "ringing",
      startTime: new Date()
    };

    // Create call log in DB
    await Call.create({
      callId,
      caller: callerId,
      receiver: receiverId,
      callType,
      status: "ringing",
      startedAt: new Date(),
    });

    // Notify receiver
    io.to(receiverSocketId).emit("incoming-call", {
      callId,
      callerId,
      callType
    });

    // Confirm to caller
    socket.emit("call-initiated", { callId });
  });

  // 2. Accept call
  socket.on("accept-call", async ({ callId }) => {
    const call = activeCalls[callId];
    if (!call) return;

    const callerSocketId = users[call.callerId];
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

    const callerSocketId = users[call.callerId];
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

    const otherUserId = socket.userId === call.callerId ? call.receiverId : call.callerId;
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

  // ... [keep your existing disconnect handler] ...
});

export { app, io, server };