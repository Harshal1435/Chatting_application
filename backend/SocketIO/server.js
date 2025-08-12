// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
// import Message from "../models/message.model.js";
// import Call from "../models/call.model.js";
// import Conversation from "../models/conversation.model.js";
// import Status from "../models/status.model.js";
// import User from "../models/user.model.js";
// import { uploadToCloudinary } from "../utils/cloudinary.js";
// import multer from "multer";
// import { v4 as uuidv4 } from 'uuid';
// const upload = multer({ dest: 'uploads/' });
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173", "https://chatting-application-1.netlify.app"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   },
// });

// const users = {}; // Store online users
// const activeCalls = {}; // Track active calls

// export const getReceiverSocketId = (receiverId) => {
//   return users[receiverId];
// };

// io.on("connection", (socket) => {
//   console.log("✅ User connected:", socket.id);

//   const userId = socket.handshake.query.userId;
//   if (userId) {
//     users[userId] = socket.id;
//     socket.userId = userId;
//     console.log("👤 Online Users:", users);
//     io.emit("getOnlineUsers", Object.keys(users));
//   }

//   // ✅ Handle sending messages
//   socket.on("send-message", async ({ messageData }) => {
//     const { senderId, receiverId, encryptedMessage, iv } = messageData;
//     if (!senderId || !receiverId || !encryptedMessage || !iv) {
//       return console.warn("❌ Missing message data");
//     }

//     const isDelivered = Boolean(users[receiverId]);
//     const newMessage = await Message.create({
//       senderId,
//       receiverId,
//       message: encryptedMessage,
//       iv,
//       delivered: isDelivered,
//     });

//     const receiverSocketId = users[receiverId];
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("receive-message", newMessage);
//     }

//     const senderSocketId = users[senderId];
//     if (senderSocketId) {
//       io.to(senderSocketId).emit("message-sent", newMessage);
//     }
//   });

//     socket.on("follow-request", ({ toUserId, from }) => {
//       const targetSocketId = onlineUsers.get(toUserId);
//       if (targetSocketId) {
//         io.to(targetSocketId).emit("new-follow-request", {
//           from,
//           message: "sent you a follow request",
//           type: "follow-request",
//         });
//       }
//     });


//   // ✅ Handle message seen
//   socket.on("mark-seen", async ({ messageId, senderId }) => {
//     if (!messageId || !senderId) return;
//     const updatedMessage = await Message.findByIdAndUpdate(
//       messageId,
//       { seen: true },
//       { new: true }
//     );
//     const senderSocketId = users[senderId];
//     if (senderSocketId) {
//       io.to(senderSocketId).emit("message-seen", updatedMessage);
//     }
//   });

//   // ==================== STATUS HANDLERS ====================



//   // User joins their own status room to get viewer updates
//   socket.on("join-status-room", () => {
//     const userId = socket.userId;
//     if (userId) {
//       socket.join(`status-${userId}`);
//       console.log(`User ${userId} joined room: status-${userId}`);
//     }
//   });

//   // Create a new status (after REST upload) and broadcast to contacts
//   socket.on("create-status", async ({ status }, callback) => {
//     try {
//       const userId = socket.userId;
//       if (!userId) throw new Error("Unauthorized");

//       const user = await User.findById(userId).populate("contacts");
//       if (!user) throw new Error("User not found");

//       // Emit to each contact
//       user.contacts.forEach(contact => {
//         io.to(`status-${contact._id}`).emit("new-status", status);
//       });

//       callback?.({ success: true });
//     } catch (error) {
//       console.error("Error in create-status socket:", error);
//       callback?.({ success: false, message: error.message });
//     }
//   });

//   // When a user views a status
//   socket.on("view-status", async ({ statusId }) => {
//     try {
//       const userId = socket.userId;
//       if (!userId) throw new Error("Unauthorized");

//       const status = await Status.findById(statusId);
//       if (!status) return;

//       const alreadyViewed = status.viewers.some(viewer => viewer.userId.equals(userId));
//       if (!alreadyViewed && !status.user.equals(userId)) {
//         status.viewers.push({ userId });
//         await status.save();

//         // Notify the owner
//         io.to(`status-${status.user}`).emit("status-viewed", {
//           statusId: status._id,
//           viewerId: userId,
//         });
//       }
//     } catch (error) {
//       console.error("Error in view-status socket:", error);
//     }
//   });



//   // ✅ Enhanced WebRTC Call Handling

//   // 1. Initiate a call
//   socket.on("call-user", async ({ from, to, offer, callType }) => {
//     const receiverSocketId = users[to];
//     if (!receiverSocketId) {
//       socket.emit("call-failed", { message: "Receiver is offline" });
//       return;
//     }

//     const callId = uuidv4();
//     activeCalls[callId] = {
//       senderId: from,
//       receiverId: to,
//       callType,
//       status: "ringing",
//       startTime: new Date(),
//     };

//     await Call.create({
//       callId,
//       caller: from,
//       receiver: to,
//       callType,
//       status: "ringing",
//       startedAt: new Date(),
//     });

//     io.to(receiverSocketId).emit("incoming-call", {
//       from,
//       offer,
//       callType,
//     });

//     socket.emit("call-initiated", { callId });
//   });

//   // 2. Accept call
//   socket.on("answer-call", async ({ to, answer }) => {
//     const callerSocketId = users[to];
//     if (callerSocketId) {
//       io.to(callerSocketId).emit("call-accepted", { answer });
//     }
//   });

//   // 3. Reject call
//   socket.on("reject-call", async ({ to }) => {
//     const callerSocketId = users[to];
//     if (callerSocketId) {
//       io.to(callerSocketId).emit("call-rejected");
//     }
//   });

//   // 4. End call
//   socket.on("end-call", async ({ to }) => {
//     const receiverSocketId = users[to];
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("call-ended");
//     }
//   });

//   // 5. WebRTC Signaling
//   socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
//     const targetSocketId = users[to];
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("webrtc-ice-candidate", { candidate });
//     }
//   });

//   // ✅ Disconnect handler
//   socket.on("disconnect", () => {
//     console.log("❌ User disconnected:", socket.id);
//     if (socket.userId) {
//       delete users[socket.userId];
//       io.emit("getOnlineUsers", Object.keys(users));
//     }
//   });
// });

// export { app, io, server };




import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Call from "../models/call.model.js";
import Conversation from "../models/conversation.model.js";
import Status from "../models/status.model.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';

const upload = multer({ dest: 'uploads/' });
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://chatting-application-1.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const users = {}; // userId: socketId
const activeCalls = {};

export const getReceiverSocketId = (receiverId) => users[receiverId];

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    socket.userId = userId;
    console.log("👤 Online Users:", users);
    io.emit("getOnlineUsers", Object.keys(users));
  }

  // ✅ Send message
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
    if (receiverSocketId) io.to(receiverSocketId).emit("receive-message", newMessage);
    const senderSocketId = users[senderId];
    if (senderSocketId) io.to(senderSocketId).emit("message-sent", newMessage);
  });

  // ✅ Follow request sent
  socket.on("follow-request", async ({ toUserId, from }) => {
    const receiverSocketId = users[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new-follow-request", {
        from,
        message: "sent you a follow request",
        type: "follow-request",
      });
    }
  });

  // ✅ Follow request accepted
  socket.on("follow-accepted", ({ fromUserId, toUserId }) => {
    const fromSocketId = users[fromUserId];
    if (fromSocketId) {
      io.to(fromSocketId).emit("follow-request-accepted", {
        by: toUserId,
        message: "accepted your follow request",
      });
    }
  });

  // ✅ Follow request rejected
  socket.on("follow-rejected", ({ fromUserId, toUserId }) => {
    const fromSocketId = users[fromUserId];
    if (fromSocketId) {
      io.to(fromSocketId).emit("follow-request-rejected", {
        by: toUserId,
        message: "rejected your follow request",
      });
    }
  });

  // ✅ Mark message seen
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

  // ✅ Join status room
  socket.on("join-status-room", () => {
    const userId = socket.userId;
    if (userId) socket.join(`status-${userId}`);
  });

  // ✅ Create new status
  socket.on("create-status", async ({ status }, callback) => {
    try {
      const userId = socket.userId;
      const user = await User.findById(userId).populate("contacts");
      if (!user) throw new Error("User not found");

      user.contacts.forEach(contact => {
        io.to(`status-${contact._id}`).emit("new-status", status);
      });

      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, message: err.message });
    }
  });

  // ✅ View status
  socket.on("view-status", async ({ statusId }) => {
    try {
      const userId = socket.userId;
      const status = await Status.findById(statusId);
      if (!status) return;

      const alreadyViewed = status.viewers.some(viewer => viewer.userId.equals(userId));
      if (!alreadyViewed && !status.user.equals(userId)) {
        status.viewers.push({ userId });
        await status.save();

        io.to(`status-${status.user}`).emit("status-viewed", {
          statusId: status._id,
          viewerId: userId,
        });
      }
    } catch (error) {
      console.error("Error in view-status:", error);
    }
  });

  // ✅ WebRTC Call System

  socket.on("call-user", async ({ from, to, offer, callType }) => {
    const receiverSocketId = users[to];
    if (!receiverSocketId) {
      socket.emit("call-failed", { message: "Receiver is offline" });
      return;
    }

    const callId = uuidv4();
    activeCalls[callId] = { senderId: from, receiverId: to, callType, status: "ringing", startTime: new Date() };

    await Call.create({
      callId,
      caller: from,
      receiver: to,
      callType,
      status: "ringing",
      startedAt: new Date(),
    });

    io.to(receiverSocketId).emit("incoming-call", { from, offer, callType });
    socket.emit("call-initiated", { callId });
  });

  socket.on("answer-call", ({ to, answer }) => {
    const callerSocketId = users[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { answer });
    }
  });

  socket.on("reject-call", ({ to }) => {
    const callerSocketId = users[to];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
    }
  });

  socket.on("end-call", ({ to }) => {
    const receiverSocketId = users[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended");
    }
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-ice-candidate", { candidate });
    }
  });

  // ✅ Disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("getOnlineUsers", Object.keys(users));
    }
  });
});

export { app, io, server };

