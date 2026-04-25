import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Call from "../models/call.model.js";
import Status from "../models/status.model.js";
import User from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chatting-application-mu.vercel.app",
      "https://chatting-application-1.netlify.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// ─── State ────────────────────────────────────────────────────────────────────
const users = {};        // userId → socketId  (1-1 calls / DMs)
const activeCalls = {};  // callId → call meta  (1-1 calls)
const groupCalls = {};   // roomId → { participants: Set<userId>, callType }

export const getReceiverSocketId = (receiverId) => users[receiverId];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const broadcastOnlineUsers = () => io.emit("getOnlineUsers", Object.keys(users));

// ─── Connection ───────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    socket.userId = userId;
    broadcastOnlineUsers();
  }

  // ── Messaging ──────────────────────────────────────────────────────────────

  socket.on("send-message", async ({ messageData }) => {
    const { senderId, receiverId, encryptedMessage, iv } = messageData;
    if (!senderId || !receiverId || !encryptedMessage || !iv) return;

    const isDelivered = Boolean(users[receiverId]);
    const newMessage = await Message.create({
      senderId, receiverId, message: encryptedMessage, iv, delivered: isDelivered,
    });

    if (users[receiverId]) io.to(users[receiverId]).emit("receive-message", newMessage);
    if (users[senderId])   io.to(users[senderId]).emit("message-sent", newMessage);
  });

  socket.on("mark-seen", async ({ messageId, senderId }) => {
    if (!messageId || !senderId) return;
    const updated = await Message.findByIdAndUpdate(messageId, { seen: true }, { new: true });
    if (users[senderId]) io.to(users[senderId]).emit("message-seen", updated);
  });

  // ── Typing ─────────────────────────────────────────────────────────────────

  socket.on("typing", ({ to }) => {
    if (users[to]) io.to(users[to]).emit("user-typing", { from: socket.userId });
  });

  socket.on("stop-typing", ({ to }) => {
    if (users[to]) io.to(users[to]).emit("user-stop-typing", { from: socket.userId });
  });

  // ── Follow ─────────────────────────────────────────────────────────────────

  socket.on("follow-request", ({ toUserId, from }) => {
    if (users[toUserId]) io.to(users[toUserId]).emit("new-follow-request", { from, type: "follow-request" });
  });

  socket.on("follow-accepted", ({ fromUserId, toUserId }) => {
    if (users[fromUserId]) io.to(users[fromUserId]).emit("follow-request-accepted", { by: toUserId });
  });

  socket.on("follow-rejected", ({ fromUserId, toUserId }) => {
    if (users[fromUserId]) io.to(users[fromUserId]).emit("follow-request-rejected", { by: toUserId });
  });

  // ── Status ─────────────────────────────────────────────────────────────────

  socket.on("join-status-room", () => {
    if (socket.userId) socket.join(`status-${socket.userId}`);
  });

  socket.on("create-status", async ({ status }, callback) => {
    try {
      const user = await User.findById(socket.userId).populate("contacts");
      if (!user) throw new Error("User not found");
      user.contacts.forEach((c) => io.to(`status-${c._id}`).emit("new-status", status));
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, message: err.message });
    }
  });

  socket.on("view-status", async ({ statusId }) => {
    try {
      const status = await Status.findById(statusId);
      if (!status) return;
      const already = status.viewers.some((v) => v.userId.equals(socket.userId));
      if (!already && !status.user.equals(socket.userId)) {
        status.viewers.push({ userId: socket.userId });
        await status.save();
        io.to(`status-${status.user}`).emit("status-viewed", { statusId: status._id, viewerId: socket.userId });
      }
    } catch (err) { /* ignore */ }
  });

  // ── 1-1 WebRTC Calls ───────────────────────────────────────────────────────

  socket.on("call-user", async ({ from, to, offer, callType, callId }) => {
    const receiverSocketId = users[to];
    if (!receiverSocketId) {
      socket.emit("call-failed", { message: "User is offline" });
      return;
    }

    const id = callId || uuidv4();
    activeCalls[id] = { caller: from, receiver: to, callType, status: "ringing", startedAt: new Date() };

    try {
      await Call.create({ callId: id, caller: from, receiver: to, callType, status: "ringing", startedAt: new Date() });
    } catch (_) { /* ignore duplicate */ }

    io.to(receiverSocketId).emit("incoming-call", { callId: id, from, offer, callType });
    socket.emit("call-initiated", { callId: id });
  });

  socket.on("answer-call", async ({ callId, to, answer }) => {
    const callerSocketId = users[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { callId, answer });
    }
    if (activeCalls[callId]) {
      activeCalls[callId].status = "connected";
      await Call.findOneAndUpdate({ callId }, { status: "connected", startedAt: new Date() }).catch(() => {});
    }
  });

  socket.on("reject-call", async ({ callId, to }) => {
    if (users[to]) io.to(users[to]).emit("call-rejected", { callId });
    if (activeCalls[callId]) {
      await Call.findOneAndUpdate({ callId }, { status: "rejected", endedAt: new Date() }).catch(() => {});
      delete activeCalls[callId];
    }
  });

  socket.on("end-call", async ({ callId, to }) => {
    if (users[to]) io.to(users[to]).emit("call-ended", { callId });
    if (activeCalls[callId]) {
      await Call.findOneAndUpdate({ callId }, { status: "ended", endedAt: new Date() }).catch(() => {});
      delete activeCalls[callId];
    }
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    if (users[to] && candidate) io.to(users[to]).emit("webrtc-ice-candidate", { candidate });
  });

  // ── Group Calls (mesh WebRTC) ──────────────────────────────────────────────
  // Each participant creates a peer connection to every other participant.
  // Signalling: join-group-call → group-call-user-joined (to existing members)
  //             group-offer / group-answer / group-ice-candidate (routed by userId)

  socket.on("join-group-call", ({ roomId, callType }) => {
    const uid = socket.userId;
    if (!uid) return;

    if (!groupCalls[roomId]) {
      groupCalls[roomId] = { participants: new Set(), callType };
    }

    const room = groupCalls[roomId];
    const existingParticipants = [...room.participants];

    // Tell the new joiner who is already in the room
    socket.emit("group-call-existing-participants", {
      roomId,
      participants: existingParticipants,
      callType: room.callType,
    });

    // Tell everyone already in the room that a new user joined
    existingParticipants.forEach((peerId) => {
      if (users[peerId]) {
        io.to(users[peerId]).emit("group-call-user-joined", { roomId, userId: uid, callType: room.callType });
      }
    });

    room.participants.add(uid);
    socket.join(`group-call-${roomId}`);
  });

  socket.on("group-offer", ({ roomId, to, offer, from }) => {
    if (users[to]) io.to(users[to]).emit("group-offer", { roomId, from, offer });
  });

  socket.on("group-answer", ({ roomId, to, answer, from }) => {
    if (users[to]) io.to(users[to]).emit("group-answer", { roomId, from, answer });
  });

  socket.on("group-ice-candidate", ({ roomId, to, candidate, from }) => {
    if (users[to] && candidate) io.to(users[to]).emit("group-ice-candidate", { roomId, from, candidate });
  });

  socket.on("leave-group-call", ({ roomId }) => {
    const uid = socket.userId;
    if (!uid || !groupCalls[roomId]) return;

    groupCalls[roomId].participants.delete(uid);
    socket.leave(`group-call-${roomId}`);

    // Notify remaining participants
    io.to(`group-call-${roomId}`).emit("group-call-user-left", { roomId, userId: uid });

    if (groupCalls[roomId].participants.size === 0) {
      delete groupCalls[roomId];
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────

  socket.on("disconnect", async () => {
    const uid = socket.userId;
    if (!uid) return;

    // Clean up 1-1 calls
    for (const callId in activeCalls) {
      const call = activeCalls[callId];
      if (call.caller === uid || call.receiver === uid) {
        const otherId = call.caller === uid ? call.receiver : call.caller;
        if (users[otherId]) io.to(users[otherId]).emit("call-ended", { callId });
        await Call.findOneAndUpdate({ callId }, { status: "missed", endedAt: new Date() }).catch(() => {});
        delete activeCalls[callId];
      }
    }

    // Clean up group calls
    for (const roomId in groupCalls) {
      if (groupCalls[roomId].participants.has(uid)) {
        groupCalls[roomId].participants.delete(uid);
        io.to(`group-call-${roomId}`).emit("group-call-user-left", { roomId, userId: uid });
        if (groupCalls[roomId].participants.size === 0) delete groupCalls[roomId];
      }
    }

    delete users[uid];
    broadcastOnlineUsers();
  });
});

export { app, io, server };
