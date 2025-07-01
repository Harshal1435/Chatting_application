import { getReceiverSocketId, io } from "../SocketIO/server.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
// export const sendMessage = async (req, res) => {
//   try {
//     const { message } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let conversation = await Conversation.findOne({
//       members: { $all: [senderId, receiverId] },
//     });

//     if (!conversation) {
//       conversation = await Conversation.create({
//         members: [senderId, receiverId],
//       });
//     }

//     const delivered = !!getReceiverSocketId(receiverId);

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       message,
//       delivered,
//     });

//     if (newMessage) {
//       conversation.messages.push(newMessage._id);
//     }

//     await Promise.all([conversation.save(), newMessage.save()]);

//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const sendMessage = async (req, res) => {
  try {
    const { encryptedMessage, iv } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const delivered = !!getReceiverSocketId(receiverId);

    const newMessage = new Message({
      senderId,
      receiverId,
      message: encryptedMessage,
      iv,
      delivered,
    });

    conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const getMessage = async (req, res) => {
  try {
    const { id: chatUser } = req.params; // chatting with this user
    const senderId = req.user._id;       // current logged-in user

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, chatUser] },
    }).populate("messages");

    if (!conversation) {
      return res.status(201).json([]);
    }

    // ✅ Mark unseen messages as seen
    await Message.updateMany(
      { senderId: chatUser, receiverId: senderId, seen: false },
      { $set: { seen: true } }
    );

    // Optionally emit socket to sender that messages were seen
    const senderSocketId = getReceiverSocketId(chatUser);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        senderId,
        receiverId: chatUser,
      });
    }

    // ✅ Return all messages
    const updatedConversation = await Conversation.findById(conversation._id).populate("messages");
    const messages = updatedConversation.messages;

    res.status(201).json(messages);
  } catch (error) {
    console.log("Error in getMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

