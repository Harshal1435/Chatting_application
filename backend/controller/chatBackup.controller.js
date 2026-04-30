import ChatBackup from "../models/chatBackup.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { decrypt } from "../Utils/encryption.js";
import fs from "fs/promises";
import path from "path";

/**
 * Create a new backup
 */
export const createBackup = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      backupType = "full",
      conversationIds = [],
      startDate,
      endDate,
      includeMedia = true,
      format = "json",
    } = req.body;

    // Create backup record
    const backup = await ChatBackup.create({
      userId,
      backupType,
      scope: {
        conversationIds,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        includeMedia,
      },
      storage: {
        format,
      },
      status: "pending",
    });

    // Start backup process asynchronously
    processBackup(backup._id).catch((error) => {
      console.error("Error processing backup:", error);
    });

    res.status(201).json({
      success: true,
      message: "Backup started",
      backupId: backup._id,
      status: "pending",
    });
  } catch (error) {
    console.error("Error in createBackup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Process backup (async)
 */
async function processBackup(backupId) {
  try {
    const backup = await ChatBackup.findById(backupId);
    if (!backup) throw new Error("Backup not found");

    backup.status = "processing";
    backup.startedAt = new Date();
    await backup.save();

    // Build query based on backup type
    let conversations;
    if (backup.backupType === "full") {
      conversations = await Conversation.find({
        members: backup.userId,
      }).populate("messages");
    } else if (backup.backupType === "conversation") {
      conversations = await Conversation.find({
        _id: { $in: backup.scope.conversationIds },
        members: backup.userId,
      }).populate("messages");
    } else if (backup.backupType === "dateRange") {
      conversations = await Conversation.find({
        members: backup.userId,
      }).populate({
        path: "messages",
        match: {
          createdAt: {
            $gte: backup.scope.startDate,
            $lte: backup.scope.endDate,
          },
        },
      });
    }

    // Collect all messages
    const allMessages = [];
    let totalMessages = 0;

    for (const conv of conversations) {
      const messages = await Message.find({
        _id: { $in: conv.messages },
      })
        .populate("senderId receiverId", "fullname email avatar")
        .lean();

      totalMessages += messages.length;

      // Decrypt messages
      for (const msg of messages) {
        try {
          const decryptedText = decrypt(msg.message, msg.iv);
          allMessages.push({
            id: msg._id,
            sender: {
              id: msg.senderId._id,
              name: msg.senderId.fullname,
              email: msg.senderId.email,
            },
            receiver: {
              id: msg.receiverId._id,
              name: msg.receiverId.fullname,
              email: msg.receiverId.email,
            },
            message: decryptedText,
            timestamp: msg.createdAt,
            delivered: msg.delivered,
            seen: msg.seen,
          });

          // Update progress
          if (allMessages.length % 100 === 0) {
            await backup.updateProgress(allMessages.length, totalMessages);
          }
        } catch (error) {
          console.error("Error decrypting message:", error);
        }
      }
    }

    // Generate backup file
    const backupData = {
      userId: backup.userId,
      backupDate: new Date().toISOString(),
      backupType: backup.backupType,
      messageCount: allMessages.length,
      conversationCount: conversations.length,
      messages: allMessages,
    };

    // Save to file
    const backupDir = path.join(process.cwd(), "backups");
    await fs.mkdir(backupDir, { recursive: true });

    const fileName = `backup_${backup.userId}_${Date.now()}.${backup.storage.format}`;
    const filePath = path.join(backupDir, fileName);

    if (backup.storage.format === "json") {
      await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));
    } else if (backup.storage.format === "csv") {
      // Convert to CSV
      const csv = convertToCSV(allMessages);
      await fs.writeFile(filePath, csv);
    }

    // Get file size
    const stats = await fs.stat(filePath);

    // Mark as completed
    await backup.markCompleted({
      location: filePath,
      size: stats.size,
      fileName,
    });

    backup.messageCount = allMessages.length;
    backup.conversationCount = conversations.length;
    await backup.save();

    console.log(`✅ Backup ${backupId} completed successfully`);
  } catch (error) {
    console.error("Error processing backup:", error);
    const backup = await ChatBackup.findById(backupId);
    if (backup) {
      await backup.markFailed(error);
    }
  }
}

/**
 * Convert messages to CSV format
 */
function convertToCSV(messages) {
  const headers = ["ID", "Sender", "Receiver", "Message", "Timestamp", "Delivered", "Seen"];
  const rows = messages.map((msg) => [
    msg.id,
    msg.sender.name,
    msg.receiver.name,
    `"${msg.message.replace(/"/g, '""')}"`, // Escape quotes
    msg.timestamp,
    msg.delivered,
    msg.seen,
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

/**
 * Get backup status
 */
export const getBackupStatus = async (req, res) => {
  try {
    const { backupId } = req.params;
    const userId = req.user._id;

    const backup = await ChatBackup.findOne({ _id: backupId, userId });
    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    res.status(200).json({
      success: true,
      backup: {
        id: backup._id,
        status: backup.status,
        progress: backup.progress,
        messageCount: backup.messageCount,
        conversationCount: backup.conversationCount,
        createdAt: backup.createdAt,
        completedAt: backup.completedAt,
        storage: backup.storage,
      },
    });
  } catch (error) {
    console.error("Error in getBackupStatus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Download backup
 */
export const downloadBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    const userId = req.user._id;

    const backup = await ChatBackup.findOne({ _id: backupId, userId });
    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    if (backup.status !== "completed") {
      return res.status(400).json({ error: "Backup not completed yet" });
    }

    // Track download
    await backup.trackDownload();

    // Send file
    res.download(backup.storage.location, backup.storage.fileName);
  } catch (error) {
    console.error("Error in downloadBackup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get user's backup history
 */
export const getBackupHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const backups = await ChatBackup.getUserBackups(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      backups,
      total: backups.length,
    });
  } catch (error) {
    console.error("Error in getBackupHistory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete backup
 */
export const deleteBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    const userId = req.user._id;

    const backup = await ChatBackup.findOne({ _id: backupId, userId });
    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    // Delete file if exists
    if (backup.storage.location) {
      try {
        await fs.unlink(backup.storage.location);
      } catch (error) {
        console.error("Error deleting backup file:", error);
      }
    }

    // Delete backup record
    await ChatBackup.findByIdAndDelete(backupId);

    res.status(200).json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteBackup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Schedule automatic backup
 */
export const scheduleBackup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { frequency, backupType = "full", includeMedia = true } = req.body;

    if (!["daily", "weekly", "monthly"].includes(frequency)) {
      return res.status(400).json({ error: "Invalid frequency" });
    }

    // Calculate next backup time
    const now = new Date();
    let nextBackupAt;

    if (frequency === "daily") {
      nextBackupAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (frequency === "weekly") {
      nextBackupAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (frequency === "monthly") {
      nextBackupAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const backup = await ChatBackup.create({
      userId,
      backupType,
      scope: { includeMedia },
      isScheduled: true,
      schedule: {
        frequency,
        nextBackupAt,
      },
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Backup scheduled successfully",
      backup: {
        id: backup._id,
        frequency,
        nextBackupAt,
      },
    });
  } catch (error) {
    console.error("Error in scheduleBackup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Process scheduled backups (called by cron job)
 */
export const processScheduledBackups = async () => {
  try {
    const pendingBackups = await ChatBackup.getPendingScheduled();

    console.log(`📅 Processing ${pendingBackups.length} scheduled backups`);

    for (const backup of pendingBackups) {
      try {
        await processBackup(backup._id);

        // Schedule next backup
        const now = new Date();
        let nextBackupAt;

        if (backup.schedule.frequency === "daily") {
          nextBackupAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (backup.schedule.frequency === "weekly") {
          nextBackupAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (backup.schedule.frequency === "monthly") {
          nextBackupAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        backup.schedule.nextBackupAt = nextBackupAt;
        backup.schedule.lastBackupAt = now;
        backup.status = "pending"; // Reset for next run
        await backup.save();
      } catch (error) {
        console.error(`Error processing scheduled backup ${backup._id}:`, error);
      }
    }

    console.log(`✅ Finished processing scheduled backups`);
  } catch (error) {
    console.error("Error in processScheduledBackups:", error);
    throw error;
  }
};

/**
 * Cleanup old backups (called by cron job)
 */
export const cleanupOldBackups = async () => {
  try {
    const result = await ChatBackup.cleanup();
    console.log(`🧹 Cleaned up ${result.deletedCount} old backups`);
    return result;
  } catch (error) {
    console.error("Error cleaning up backups:", error);
    throw error;
  }
};
