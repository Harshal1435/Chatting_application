import Status from "../models/status.model.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// ✅ Create a new status
export const createStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file; // ✅ multer stores file in req.file
    const { caption, type } = req.body;

    if (!file || !userId || !type) {
      return res.status(400).json({ error: "Media file, type, and userId are required" });
    }

    // ✅ Upload to Cloudinary
    const uploadedMedia = await uploadToCloudinary(file.path, "status");

    const newStatus = await Status.create({
      user: userId,
      type,
      media: uploadedMedia.secure_url,
      mediaType: uploadedMedia.resource_type,
      caption: caption || "",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const populatedStatus = await newStatus.populate("user", "fullname avatar");

    // ✅ Notify contacts via socket
    req.io?.to(`status-${userId}`).emit("new-status", populatedStatus);

    res.status(201).json(populatedStatus);
  } catch (error) {
    console.error("❌ Error creating status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ✅ Get all active statuses from contacts
export const getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .populate("user", "fullname avatar email")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: statuses.length, statuses });
  } catch (error) {
    console.error("❌ Error fetching all statuses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ View a specific status and track viewers
export const viewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user._id;

    const status = await Status.findById(id);

    if (!status || new Date() > status.expiresAt) {
      return res.status(404).json({ error: "Status not found or expired" });
    }

    const alreadyViewed = status.viewers.some((v) => v.userId.equals(viewerId));

    if (!status.user.equals(viewerId) && !alreadyViewed) {
      status.viewers.push({ userId: viewerId });
      await status.save();

      // ✅ Notify status owner via socket
      req.io?.to(`status-${status.user}`).emit("status-viewed", {
        statusId: status._id,
        viewerId,
      });
    }

    res.status(200).json(status);
  } catch (error) {
    console.error("❌ Error viewing status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Clean expired statuses (run via cron or manually)
export const deleteExpiredStatuses = async () => {
  try {
    const result = await Status.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log(`🧹 Deleted ${result.deletedCount} expired statuses`);
  } catch (error) {
    console.error("❌ Error deleting expired statuses:", error);
  }
};
