import express from "express";
import secureRoute from "../middleware/secureRoute.js";
import {
  createBackup,
  getBackupStatus,
  downloadBackup,
  getBackupHistory,
  deleteBackup,
  scheduleBackup,
} from "../controller/chatBackup.controller.js";

const router = express.Router();

// Create new backup
router.post("/create", secureRoute, createBackup);

// Get backup status
router.get("/status/:backupId", secureRoute, getBackupStatus);

// Download backup
router.get("/download/:backupId", secureRoute, downloadBackup);

// Get backup history
router.get("/history", secureRoute, getBackupHistory);

// Delete backup
router.delete("/:backupId", secureRoute, deleteBackup);

// Schedule automatic backup
router.post("/schedule", secureRoute, scheduleBackup);

export default router;
