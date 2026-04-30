import OfflineQueue from "../models/offlineQueue.model.js";
import Message from "../models/message.model.js";
import { io, getReceiverSocketId } from "../SocketIO/server.js";

/**
 * Add message to offline queue
 */
export const addToOfflineQueue = async (userId, messageId, senderId, priority = "normal") => {
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await OfflineQueue.create({
      userId,
      messageId,
      senderId,
      priority,
      status: "pending",
      messageType: "text",
    });

    console.log(`✅ Added message ${messageId} to offline queue for user ${userId}`);
  } catch (error) {
    console.error("Error adding to offline queue:", error);
    throw error;
  }
};

/**
 * Process offline queue when user comes online
 */
export const processOfflineQueue = async (userId) => {
  try {
    const pendingMessages = await OfflineQueue.getPendingForUser(userId);

    if (pendingMessages.length === 0) {
      console.log(`No pending messages for user ${userId}`);
      return;
    }

    console.log(`📬 Processing ${pendingMessages.length} offline messages for user ${userId}`);

    const receiverSocketId = getReceiverSocketId(userId);
    if (!receiverSocketId) {
      console.log(`User ${userId} is not connected, skipping queue processing`);
      return;
    }

    // Process messages in batches
    const batchSize = 10;
    for (let i = 0; i < pendingMessages.length; i += batchSize) {
      const batch = pendingMessages.slice(i, i + batchSize);

      for (const queueItem of batch) {
        try {
          // Mark as processing
          queueItem.status = "processing";
          queueItem.processedAt = new Date();
          await queueItem.save();

          // Get the actual message
          const message = await Message.findById(queueItem.messageId)
            .populate("senderId", "fullname avatar");

          if (message) {
            // Update message delivery status
            message.delivered = true;
            await message.save();

            // Emit to user
            io.to(receiverSocketId).emit("offlineMessage", message);

            // Mark as delivered
            await queueItem.markDelivered();

            console.log(`✅ Delivered offline message ${queueItem.messageId} to user ${userId}`);
          } else {
            // Message not found, mark as failed
            await queueItem.markFailed("Message not found");
          }
        } catch (error) {
          console.error(`Error processing queue item ${queueItem._id}:`, error);
          await queueItem.markFailed(error.message);
        }
      }

      // Small delay between batches to avoid overwhelming the client
      if (i + batchSize < pendingMessages.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ Finished processing offline queue for user ${userId}`);
  } catch (error) {
    console.error("Error processing offline queue:", error);
    throw error;
  }
};

/**
 * Get offline queue status for user
 */
export const getOfflineQueueStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await OfflineQueue.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      pending: 0,
      processing: 0,
      delivered: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      statusMap[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: statusMap,
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error("Error getting offline queue status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Retry failed messages
 */
export const retryFailedMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const failedMessages = await OfflineQueue.find({
      userId,
      status: "failed",
      retryCount: { $lt: 3 },
    });

    if (failedMessages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No failed messages to retry",
        retriedCount: 0,
      });
    }

    // Reset status to pending for retry
    await OfflineQueue.updateMany(
      {
        userId,
        status: "failed",
        retryCount: { $lt: 3 },
      },
      {
        $set: {
          status: "pending",
          nextRetryAt: new Date(),
        },
      }
    );

    // Process the queue
    await processOfflineQueue(userId);

    res.status(200).json({
      success: true,
      message: "Retrying failed messages",
      retriedCount: failedMessages.length,
    });
  } catch (error) {
    console.error("Error retrying failed messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Clear delivered messages from queue
 */
export const clearDeliveredMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await OfflineQueue.deleteMany({
      userId,
      status: "delivered",
    });

    res.status(200).json({
      success: true,
      message: "Cleared delivered messages",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing delivered messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get pending messages count
 */
export const getPendingCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await OfflineQueue.countDocuments({
      userId,
      status: "pending",
    });

    res.status(200).json({
      success: true,
      pendingCount: count,
    });
  } catch (error) {
    console.error("Error getting pending count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Cleanup old queue items (cron job)
 */
export const cleanupOfflineQueue = async () => {
  try {
    const result = await OfflineQueue.cleanup();
    console.log(`🧹 Cleaned up ${result.deletedCount} old offline queue items`);
    return result;
  } catch (error) {
    console.error("Error cleaning up offline queue:", error);
    throw error;
  }
};
