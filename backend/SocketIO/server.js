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
 // Track active calls with more structure
const CALL_TIMEOUT = 30000; // 30 seconds call timeout

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

  // 1. Initiate a call with better validation
  socket.on("call-user", async ({ from, to, offer, callType }) => {
    try {
      // Validate input
      if (!from || !to || !offer || !['audio', 'video'].includes(callType)) {
        throw new Error('Invalid call parameters');
      }

      // Check if receiver is already in a call
      if (Object.values(activeCalls).some(call => 
        (call.receiverId === to || call.senderId === to) && 
        ['ringing', 'ongoing'].includes(call.status)
      ) {
        throw new Error('Receiver is already in a call');
      }

      const receiverSocketId = users[to];
      if (!receiverSocketId) {
        throw new Error('Receiver is offline');
      }

      const callId = uuidv4();
      const callData = {
        callId,
        senderId: from,
        receiverId: to,
        callType,
        status: "ringing",
        startTime: new Date(),
        socketIds: {
          caller: socket.id,
          receiver: receiverSocketId
        }
      };

      activeCalls[callId] = callData;

      // Set call timeout
      const timeoutId = setTimeout(() => {
        if (activeCalls[callId]?.status === 'ringing') {
          endCall(callId, 'Call timed out');
        }
      }, CALL_TIMEOUT);

      activeCalls[callId].timeoutId = timeoutId;

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
        callId
      });

      socket.emit("call-initiated", { callId });
    } catch (error) {
      console.error('Call initiation error:', error.message);
      socket.emit("call-failed", { message: error.message });
    }
  });

  // Helper function to end calls
  const endCall = async (callId, reason = 'Call ended') => {
    const call = activeCalls[callId];
    if (!call) return;

    // Clear timeout if exists
    if (call.timeoutId) {
      clearTimeout(call.timeoutId);
    }

    // Notify both parties
    if (call.socketIds.caller && users[call.senderId] === call.socketIds.caller) {
      io.to(call.socketIds.caller).emit("call-ended", { callId, reason });
    }
    if (call.socketIds.receiver && users[call.receiverId] === call.socketIds.receiver) {
      io.to(call.socketIds.receiver).emit("call-ended", { callId, reason });
    }

    // Update call status
    await Call.findOneAndUpdate(
      { callId },
      { 
        status: "ended",
        endedAt: new Date(),
        duration: Math.floor((new Date() - call.startTime) / 1000)
      }
    );

    delete activeCalls[callId];
  };

  // 2. Accept call with validation
  socket.on("answer-call", async ({ to, answer, callId }) => {
    try {
      const call = activeCalls[callId];
      if (!call || call.status !== 'ringing') {
        throw new Error('Invalid call state');
      }

      call.status = 'ongoing';
      if (call.timeoutId) {
        clearTimeout(call.timeoutId);
      }

      await Call.findOneAndUpdate(
        { callId },
        { status: "ongoing" }
      );

      const callerSocketId = users[to];
      if (callerSocketId) {
        io.to(callerSocketId).emit("call-accepted", { answer, callId });
      }
    } catch (error) {
      console.error('Call accept error:', error.message);
      socket.emit("call-error", { message: error.message });
    }
  });

  // 3. Reject call with cleanup
  socket.on("reject-call", async ({ to, callId }) => {
    try {
      await endCall(callId, 'Call rejected');
    } catch (error) {
      console.error('Call rejection error:', error);
    }
  });

  // 4. End call handler
  socket.on("end-call", async ({ callId }) => {
    try {
      await endCall(callId, 'Call ended by user');
    } catch (error) {
      console.error('Call end error:', error);
    }
  });

  // 5. WebRTC Signaling with validation
  socket.on("webrtc-ice-candidate", ({ to, candidate, callId }) => {
    try {
      const call = activeCalls[callId];
      if (!call || !['ringing', 'ongoing'].includes(call.status)) {
        throw new Error('Invalid call state for ICE candidate');
      }

      const targetSocketId = users[to];
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-ice-candidate", { 
          candidate,
          callId 
        });
      }
    } catch (error) {
      console.error('ICE candidate error:', error.message);
    }
  });

  // Handle disconnection cleanup
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    
    // End all active calls for this user
    Object.entries(activeCalls).forEach(([callId, call]) => {
      if (call.socketIds.caller === socket.id || 
          call.socketIds.receiver === socket.id) {
        endCall(callId, 'User disconnected');
      }
    });

    if (socket.userId) {
      delete users[socket.userId];
      io.emit("getOnlineUsers", Object.keys(users));
    }
  });
});

export { app, io, server };