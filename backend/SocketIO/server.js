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

  // ==================== STATUS HANDLERS ====================



  // User joins their own status room to get viewer updates
  socket.on("join-status-room", () => {
    const userId = socket.userId;
    if (userId) {
      socket.join(`status-${userId}`);
      console.log(`User ${userId} joined room: status-${userId}`);
    }
  });

  // Create a new status (after REST upload) and broadcast to contacts
  socket.on("create-status", async ({ status }, callback) => {
    try {
      const userId = socket.userId;
      if (!userId) throw new Error("Unauthorized");

      const user = await User.findById(userId).populate("contacts");
      if (!user) throw new Error("User not found");

      // Emit to each contact
      user.contacts.forEach(contact => {
        io.to(`status-${contact._id}`).emit("new-status", status);
      });

      callback?.({ success: true });
    } catch (error) {
      console.error("Error in create-status socket:", error);
      callback?.({ success: false, message: error.message });
    }
  });

  // When a user views a status
  socket.on("view-status", async ({ statusId }) => {
    try {
      const userId = socket.userId;
      if (!userId) throw new Error("Unauthorized");

      const status = await Status.findById(statusId);
      if (!status) return;

      const alreadyViewed = status.viewers.some(viewer => viewer.userId.equals(userId));
      if (!alreadyViewed && !status.user.equals(userId)) {
        status.viewers.push({ userId });
        await status.save();

        // Notify the owner
        io.to(`status-${status.user}`).emit("status-viewed", {
          statusId: status._id,
          viewerId: userId,
        });
      }
    } catch (error) {
      console.error("Error in view-status socket:", error);
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






// import { Server } from "socket.io";
// import http from "http";
// import express from "express";
// import Message from "../models/message.model.js";
// import Call from "../models/call.model.js";
// import Status from "../models/status.model.js";
// import Conversation from "../models/conversation.model.js";
// import { v4 as uuidv4 } from 'uuid';
// import { uploadToCloudinary } from "../utils/cloudinary.js";
// import multer from "multer";

// const app = express();
// const server = http.createServer(app);

// // Configure file upload
// const upload = multer({ dest: 'uploads/' });

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173", "https://chatting-application-1.netlify.app"],
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//   connectionStateRecovery: {
//     maxDisconnectionDuration: 120000, // 2 minutes
//     skipMiddlewares: true,
//   }
// });



// // Enhanced data structures
// const users = new Map(); // Map<userId, socketId>
// const activeCalls = new Map(); // Map<callId, callData>
// const userCalls = new Map(); // Map<userId, callId>
// const statusRooms = new Map(); // Map<userId, Set<contactId>>
// export const getReceiverSocketId = (receiverId) => {
//   return users[receiverId];
// };
// io.on("connection", (socket) => {
//   console.log("✅ User connected:", socket.id);

//   // User authentication
//   const userId = socket.handshake.query.userId;
//   if (userId) {
//     users.set(userId, socket.id);
//     socket.userId = userId;
//     broadcastOnlineUsers();
    
//     // Join user's status room
//     socket.join(`status-${userId}`);
//   }

//   // Setup all handlers
//   setupMessageHandlers(socket);
//   setupCallHandlers(socket);
//   setupStatusHandlers(socket);

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     handleDisconnect(socket);
//   });

//   // Handle reconnection
//   socket.on("reconnect", (attempt) => {
//     console.log(`♻️ User reconnected (attempt ${attempt}):`, socket.id);
//     if (userId) {
//       users.set(userId, socket.id);
//       broadcastOnlineUsers();
//       socket.join(`status-${userId}`);
//     }
//   });
// });

// // ==================== MESSAGE HANDLERS ====================
// function setupMessageHandlers(socket) {
//   socket.on("send-message", async ({ messageData }) => {
//     try {
//       const { senderId, receiverId, encryptedMessage, iv } = messageData;
      
//       if (!senderId || !receiverId || !encryptedMessage || !iv) {
//         throw new Error("Missing message data");
//       }

//       const isDelivered = users.has(receiverId);
//       const newMessage = await Message.create({
//         senderId,
//         receiverId,
//         message: encryptedMessage,
//         iv,
//         delivered: isDelivered,
//       });

//       // Deliver to receiver if online
//       const receiverSocketId = users.get(receiverId);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("receive-message", newMessage);
//       }

//       // Confirm delivery to sender
//       const senderSocketId = users.get(senderId);
//       if (senderSocketId) {
//         io.to(senderSocketId).emit("message-sent", newMessage);
//       }
//     } catch (error) {
//       console.error("Message send error:", error);
//     }
//   });

//   socket.on("mark-seen", async ({ messageId, senderId }) => {
//     try {
//       if (!messageId || !senderId) return;
      
//       const updatedMessage = await Message.findByIdAndUpdate(
//         messageId,
//         { seen: true },
//         { new: true }
//       );
      
//       const senderSocketId = users.get(senderId);
//       if (senderSocketId) {
//         io.to(senderSocketId).emit("message-seen", updatedMessage);
//       }
//     } catch (error) {
//       console.error("Mark seen error:", error);
//     }
//   });
// }

// // ==================== CALL HANDLERS ====================
// function setupCallHandlers(socket) {
//   socket.on("call-user", async ({ from, to, offer, callType }) => {
//     try {
//       if (!from || !to || !offer || !['audio', 'video'].includes(callType)) {
//         throw new Error("Invalid call parameters");
//       }

//       if (getUserActiveCall(to)) {
//         throw new Error("Recipient is already in a call");
//       }

//       const callId = uuidv4();
//       const receiverSocketId = users.get(to);

//       if (!receiverSocketId) {
//         throw new Error("Recipient is offline");
//       }

//       const callData = {
//         callId,
//         callerId: from,
//         receiverId: to,
//         callType,
//         status: "ringing",
//         createdAt: new Date(),
//         sockets: {
//           caller: socket.id,
//           receiver: receiverSocketId
//         }
//       };

//       // Store call information
//       activeCalls.set(callId, callData);
//       userCalls.set(from, callId);
//       userCalls.set(to, callId);

//       // Set call timeout
//       callData.timeout = setTimeout(() => {
//         if (activeCalls.get(callId)?.status === "ringing") {
//           endCall(callId, "Call timed out");
//         }
//       }, 30000); // 30 seconds timeout

//       // Create call record in DB
//       await Call.create({
//         callId,
//         caller: from,
//         receiver: to,
//         callType,
//         status: "ringing",
//         startedAt: new Date(),
//       });

//       // Notify caller
//       socket.emit("call-initiated", { callId });

//       // Notify receiver
//       io.to(receiverSocketId).emit("incoming-call", {
//         from,
//         offer,
//         callType,
//         callId
//       });

//     } catch (error) {
//       console.error("Call initiation error:", error.message);
//       socket.emit("call-error", {
//         type: "CALL_INITIATION_FAILED",
//         message: error.message
//       });
//     }
//   });

//   socket.on("answer-call", async ({ callId, answer }) => {
//     try {
//       const call = validateCall(callId, socket.id);
      
//       if (call.status !== "ringing") {
//         throw new Error("Call is not in ringing state");
//       }

//       call.status = "ongoing";
//       clearTimeout(call.timeout);

//       // Update call in DB
//       await Call.findOneAndUpdate(
//         { callId },
//         { status: "ongoing" }
//       );

//       // Notify caller
//       io.to(call.sockets.caller).emit("call-accepted", {
//         callId,
//         answer
//       });

//     } catch (error) {
//       console.error("Call answer error:", error.message);
//       socket.emit("call-error", {
//         type: "CALL_ANSWER_FAILED",
//         message: error.message
//       });
//     }
//   });

//   socket.on("webrtc-ice-candidate", ({ callId, candidate }) => {
//     try {
//       const call = validateCall(callId, socket.id);
//       const targetSocket = socket.id === call.sockets.caller 
//         ? call.sockets.receiver 
//         : call.sockets.caller;
      
//       io.to(targetSocket).emit("webrtc-ice-candidate", {
//         callId,
//         candidate
//       });

//     } catch (error) {
//       console.error("ICE candidate error:", error.message);
//     }
//   });

//   socket.on("reject-call", ({ callId }) => {
//     endCall(callId, "Call rejected by recipient");
//   });

//   socket.on("end-call", ({ callId }) => {
//     endCall(callId, "Call ended by participant");
//   });
// }

// // ==================== STATUS HANDLERS ====================
// function setupStatusHandlers(socket) {
//   socket.on("create-status", upload.single("media"), async ({ caption }, callback) => {
//     try {
//       const userId = socket.userId;
//       if (!userId) throw new Error("Unauthorized");
      
//       if (!socket.file) {
//         throw new Error("Media file is required");
//       }

//       const mediaUrl = await uploadToCloudinary(socket.file.path);
      
//       const status = new Status({
//         userId,
//         media: mediaUrl,
//         caption,
//         expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
//       });
      
//       await status.save();
      
//       // Populate user data before sending
//       const populatedStatus = await Status.populate(status, {
//         path: 'userId',
//         select: 'name avatar'
//       });

//       // Get user's contacts (you'll need to implement this)
//       const user = await User.findById(userId).populate('contacts');
      
//       // Emit to all contacts
//       user.contacts.forEach(contact => {
//         io.to(`status-${contact._id}`).emit('new-status', populatedStatus);
//       });

//       callback({ success: true, status: populatedStatus });
//     } catch (error) {
//       console.error("Status creation error:", error);
//       callback({ success: false, message: error.message });
//     }
//   });

//   socket.on("view-status", async ({ statusId }) => {
//     try {
//       const userId = socket.userId;
//       if (!userId) throw new Error("Unauthorized");
      
//       const status = await Status.findById(statusId);
      
//       if (!status.viewers.some(viewer => viewer.userId.equals(userId))) {
//         status.viewers.push({ userId });
//         await status.save();
        
//         // Notify status owner about the view
//         io.to(`status-${status.userId}`).emit('status-viewed', {
//           statusId: status._id,
//           viewerId: userId
//         });
//       }
//     } catch (error) {
//       console.error("Status view error:", error);
//     }
//   });

//   socket.on("join-status-room", () => {
//     const userId = socket.userId;
//     if (userId) {
//       socket.join(`status-${userId}`);
//     }
//   });
// }

// // ==================== HELPER FUNCTIONS ====================
// function validateCall(callId, socketId) {
//   const call = activeCalls.get(callId);
//   if (!call) {
//     throw new Error("Invalid call ID");
//   }
//   if (socketId !== call.sockets.caller && socketId !== call.sockets.receiver) {
//     throw new Error("Unauthorized call access");
//   }
//   return call;
// }

// function getUserActiveCall(userId) {
//   const callId = userCalls.get(userId);
//   return callId ? activeCalls.get(callId) : null;
// }

// function endCall(callId, reason) {
//   const call = activeCalls.get(callId);
//   if (!call) return;

//   // Clear timeout if exists
//   if (call.timeout) clearTimeout(call.timeout);

//   // Notify both parties if still connected
//   if (users.get(call.callerId) === call.sockets.caller) {
//     io.to(call.sockets.caller).emit("call-ended", { callId, reason });
//   }
//   if (users.get(call.receiverId) === call.sockets.receiver) {
//     io.to(call.sockets.receiver).emit("call-ended", { callId, reason });
//   }

//   // Update call in DB
//   Call.findOneAndUpdate(
//     { callId },
//     { 
//       status: "ended",
//       endedAt: new Date(),
//       duration: Math.floor((new Date() - call.createdAt) / 1000)
//     }
//   );

//   // Clean up
//   activeCalls.delete(callId);
//   userCalls.delete(call.callerId);
//   userCalls.delete(call.receiverId);
// }

// function handleDisconnect(socket) {
//   console.log("❌ User disconnected:", socket.id);
  
//   if (socket.userId) {
//     // End all active calls for this user
//     const callId = userCalls.get(socket.userId);
//     if (callId) {
//       endCall(callId, "User disconnected");
//     }

//     users.delete(socket.userId);
//     broadcastOnlineUsers();
//   }
// }

// function broadcastOnlineUsers() {
//   io.emit("online-users", Array.from(users.keys()));
// }

// export { app, io, server };
