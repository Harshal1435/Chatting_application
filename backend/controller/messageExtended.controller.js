import Message from "../models/message.model.js";
import MessageExtended from "../models/messageExtended.model.js";
import { io, getReceiverSocketId } from "../SocketIO/server.js";

/**
 * Reply to a message
 */
export const replyToMessage = async (req, res) => {
  try {
    const { replyToId, encryptedMessage, iv } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Get the original message being replied to
    const originalMessage = await Message.findById(replyToId).populate("senderId", "fullname");
    if (!originalMessage) {
      return res.status(404).json({ error: "Original message not found" });
    }

    // Create the new message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: encryptedMessage,
      iv,
      delivered: Boolean(getReceiverSocketId(receiverId)),
    });

    // Create extended metadata with reply info
    await MessageExtended.create({
      messageId: newMessage._id,
      replyTo: replyToId,
      replyToText: originalMessage.message.substring(0, 100), // Cache first 100 chars
      replyToSender: originalMessage.senderId._id,
    });

    // Populate the reply data for response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId receiverId", "fullname avatar");

    const extendedData = await MessageExtended.findOne({ messageId: newMessage._id })
      .populate("replyToSender", "fullname avatar");

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...populatedMessage.toObject(),
        extended: extendedData,
      });
    }

    res.status(201).json({
      message: populatedMessage,
      extended: extendedData,
    });
  } catch (error) {
    console.error("Error in replyToMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Forward message to multiple users
 */
export const forwardMessage = async (req, res) => {
  try {
    const { messageId, receiverIds } = req.body; // receiverIds is an array
    const senderId = req.user._id;

    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ error: "Receiver IDs must be a non-empty array" });
    }

    // Get original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Original message not found" });
    }

    const forwardedMessages = [];

    // Create forwarded message for each receiver
    for (const receiverId of receiverIds) {
      const newMessage = await Message.create({
        senderId,
        receiverId,
        message: originalMessage.message,
        iv: originalMessage.iv,
        delivered: Boolean(getReceiverSocketId(receiverId)),
      });

      // Create extended metadata
      const extended = await MessageExtended.create({
        messageId: newMessage._id,
        isForwarded: true,
        originalMessageId: messageId,
        forwardedBy: senderId,
      });

      // Update forward count on original
      await MessageExtended.findOneAndUpdate(
        { messageId },
        { $inc: { forwardCount: 1 } },
        { upsert: true }
      );

      // Emit to receiver
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", {
          ...newMessage.toObject(),
          extended,
        });
      }

      forwardedMessages.push({ message: newMessage, extended });
    }

    res.status(201).json({
      success: true,
      forwardedCount: forwardedMessages.length,
      messages: forwardedMessages,
    });
  } catch (error) {
    console.error("Error in forwardMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Add reaction to a message
 */
export const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get or create extended data
    let extended = await MessageExtended.findOne({ messageId });
    if (!extended) {
      extended = await MessageExtended.create({ messageId, reactions: [] });
    }

    // Check if user already reacted with this emoji
    const existingReaction = extended.reactions.find(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ error: "Already reacted with this emoji" });
    }

    // Add reaction
    extended.reactions.push({ userId, emoji, createdAt: new Date() });
    await extended.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    const reactionData = { messageId, userId, emoji, reactions: extended.reactions };

    if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", reactionData);
    if (senderSocketId) io.to(senderSocketId).emit("messageReaction", reactionData);

    res.status(200).json({ success: true, reactions: extended.reactions });
  } catch (error) {
    console.error("Error in addReaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Remove reaction from a message
 */
export const removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user._id;

    const extended = await MessageExtended.findOne({ messageId });
    if (!extended) {
      return res.status(404).json({ error: "Message extended data not found" });
    }

    // Remove reaction
    extended.reactions = extended.reactions.filter(
      (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
    await extended.save();

    const message = await Message.findById(messageId);

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    const reactionData = { messageId, userId, emoji, reactions: extended.reactions };

    if (receiverSocketId) io.to(receiverSocketId).emit("messageReactionRemoved", reactionData);
    if (senderSocketId) io.to(senderSocketId).emit("messageReactionRemoved", reactionData);

    res.status(200).json({ success: true, reactions: extended.reactions });
  } catch (error) {
    console.error("Error in removeReaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Create disappearing message
 */
export const createDisappearingMessage = async (req, res) => {
  try {
    const { encryptedMessage, iv, disappearAfter } = req.body; // disappearAfter in milliseconds
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Create message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: encryptedMessage,
      iv,
      delivered: Boolean(getReceiverSocketId(receiverId)),
    });

    // Create extended data with expiry
    const expiresAt = new Date(Date.now() + disappearAfter);
    await MessageExtended.create({
      messageId: newMessage._id,
      isDisappearing: true,
      disappearAfter,
      expiresAt,
    });

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        isDisappearing: true,
        expiresAt,
      });
    }

    res.status(201).json({
      message: newMessage,
      isDisappearing: true,
      expiresAt,
    });
  } catch (error) {
    console.error("Error in createDisappearingMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Edit message
 */
export const editMessage = async (req, res) => {
  try {
    const { messageId, newEncryptedMessage, newIv } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Verify user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to edit this message" });
    }

    // Get or create extended data
    let extended = await MessageExtended.findOne({ messageId });
    if (!extended) {
      extended = await MessageExtended.create({ messageId });
    }

    // Save edit history
    extended.editHistory.push({
      previousText: message.message,
      previousIv: message.iv,
      editedAt: new Date(),
    });
    extended.isEdited = true;
    await extended.save();

    // Update message
    message.message = newEncryptedMessage;
    message.iv = newIv;
    await message.save();

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        messageId,
        newMessage: message.message,
        newIv: message.iv,
        isEdited: true,
      });
    }

    res.status(200).json({
      success: true,
      message,
      isEdited: true,
    });
  } catch (error) {
    console.error("Error in editMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get message extended data
 */
export const getMessageExtended = async (req, res) => {
  try {
    const { messageId } = req.params;

    const extended = await MessageExtended.findOne({ messageId })
      .populate("replyToSender", "fullname avatar")
      .populate("reactions.userId", "fullname avatar")
      .populate("forwardedBy", "fullname avatar");

    if (!extended) {
      return res.status(404).json({ error: "Extended data not found" });
    }

    res.status(200).json(extended);
  } catch (error) {
    console.error("Error in getMessageExtended:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Pin/Unpin message
 */
export const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.body;

    let extended = await MessageExtended.findOne({ messageId });
    if (!extended) {
      extended = await MessageExtended.create({ messageId, isPinned: true });
    } else {
      extended.isPinned = !extended.isPinned;
      await extended.save();
    }

    res.status(200).json({ success: true, isPinned: extended.isPinned });
  } catch (error) {
    console.error("Error in togglePinMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
