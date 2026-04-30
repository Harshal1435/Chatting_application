import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { decrypt } from "../Utils/encryption.js";

/**
 * Search messages across all conversations
 * Note: Since messages are encrypted, this searches in decrypted form
 * For production, consider implementing client-side search or searchable encryption
 */
export const searchMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query, senderId, startDate, endDate, limit = 50, skip = 0 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Build search filter
    const filter = {
      $or: [{ senderId: userId }, { receiverId: userId }],
    };

    // Filter by sender if specified
    if (senderId) {
      filter.$or = [
        { senderId: userId, receiverId: senderId },
        { senderId: senderId, receiverId: userId },
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get messages
    const messages = await Message.find(filter)
      .populate("senderId receiverId", "fullname avatar email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + parseInt(skip))
      .lean();

    // Decrypt and filter messages
    // WARNING: This is not scalable for large datasets
    // Consider implementing a separate search index or client-side search
    const searchResults = [];
    const searchTerm = query.toLowerCase();

    for (const msg of messages) {
      try {
        // Decrypt message
        const decryptedText = decrypt(msg.message, msg.iv);
        
        // Check if search term matches
        if (decryptedText.toLowerCase().includes(searchTerm)) {
          // Don't send the decrypted text to client for security
          // Client will decrypt it themselves
          searchResults.push({
            _id: msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            message: msg.message, // Keep encrypted
            iv: msg.iv,
            createdAt: msg.createdAt,
            delivered: msg.delivered,
            seen: msg.seen,
            // Add a snippet (encrypted) for preview
            matchFound: true,
          });

          if (searchResults.length >= parseInt(limit)) break;
        }
      } catch (error) {
        // Skip messages that can't be decrypted
        console.error("Error decrypting message:", error);
      }
    }

    // Skip results if needed
    const paginatedResults = searchResults.slice(parseInt(skip));

    res.status(200).json({
      success: true,
      results: paginatedResults,
      total: searchResults.length,
      query,
      hasMore: messages.length > searchResults.length,
    });
  } catch (error) {
    console.error("Error in searchMessages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Search messages within a specific conversation
 */
export const searchInConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { query, limit = 50, skip = 0 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Verify user is part of conversation
    if (!conversation.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get messages from conversation
    const messages = await Message.find({
      _id: { $in: conversation.messages },
    })
      .populate("senderId receiverId", "fullname avatar")
      .sort({ createdAt: -1 })
      .lean();

    // Decrypt and filter
    const searchResults = [];
    const searchTerm = query.toLowerCase();

    for (const msg of messages) {
      try {
        const decryptedText = decrypt(msg.message, msg.iv);
        
        if (decryptedText.toLowerCase().includes(searchTerm)) {
          searchResults.push({
            _id: msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            message: msg.message,
            iv: msg.iv,
            createdAt: msg.createdAt,
            delivered: msg.delivered,
            seen: msg.seen,
            matchFound: true,
          });
        }
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    }

    // Pagination
    const paginatedResults = searchResults.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit)
    );

    res.status(200).json({
      success: true,
      results: paginatedResults,
      total: searchResults.length,
      query,
      conversationId,
    });
  } catch (error) {
    console.error("Error in searchInConversation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Search users/contacts
 */
export const searchUsers = async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Search users by name or email
    const users = await User.find({
      _id: { $ne: userId }, // Exclude current user
      $or: [
        { fullname: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("fullname email avatar isPrivate")
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      results: users,
      total: users.length,
      query,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get search suggestions (recent searches, frequent contacts)
 */
export const getSearchSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's recent conversations
    const conversations = await Conversation.find({
      members: userId,
    })
      .populate("members", "fullname avatar email")
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    // Extract other members (not current user)
    const suggestions = conversations.map((conv) => {
      const otherMember = conv.members.find((m) => m._id.toString() !== userId.toString());
      return {
        userId: otherMember._id,
        fullname: otherMember.fullname,
        avatar: otherMember.avatar,
        email: otherMember.email,
        conversationId: conv._id,
        lastActivity: conv.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("Error in getSearchSuggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Advanced search with filters
 */
export const advancedSearch = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      query,
      senderIds, // Array of sender IDs
      hasMedia,
      isForwarded,
      hasReactions,
      startDate,
      endDate,
      limit = 50,
      skip = 0,
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Build filter
    const filter = {
      $or: [{ senderId: userId }, { receiverId: userId }],
    };

    // Filter by senders
    if (senderIds && Array.isArray(senderIds) && senderIds.length > 0) {
      filter.$or = [
        { senderId: { $in: senderIds }, receiverId: userId },
        { senderId: userId, receiverId: { $in: senderIds } },
      ];
    }

    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get messages
    let messages = await Message.find(filter)
      .populate("senderId receiverId", "fullname avatar")
      .sort({ createdAt: -1 })
      .lean();

    // Apply additional filters if needed
    // Note: For production, these should be database queries, not in-memory filtering

    // Decrypt and search
    const searchResults = [];
    const searchTerm = query.toLowerCase();

    for (const msg of messages) {
      try {
        const decryptedText = decrypt(msg.message, msg.iv);
        
        if (decryptedText.toLowerCase().includes(searchTerm)) {
          searchResults.push({
            _id: msg._id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            message: msg.message,
            iv: msg.iv,
            createdAt: msg.createdAt,
            delivered: msg.delivered,
            seen: msg.seen,
            matchFound: true,
          });

          if (searchResults.length >= parseInt(limit) + parseInt(skip)) break;
        }
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    }

    // Pagination
    const paginatedResults = searchResults.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit)
    );

    res.status(200).json({
      success: true,
      results: paginatedResults,
      total: searchResults.length,
      query,
      filters: { senderIds, hasMedia, isForwarded, hasReactions, startDate, endDate },
    });
  } catch (error) {
    console.error("Error in advancedSearch:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
