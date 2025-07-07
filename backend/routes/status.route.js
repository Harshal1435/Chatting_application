import express from "express";
import {createStatus,getAllStatuses ,viewStatus} from "../controller/status.controller.js";
import authMiddleware from "../middleware/secureRoute.js";
import multer from "multer";

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Create a status
router.post("/", authMiddleware, upload.single("media"), createStatus);

// Get all statuses from contacts
router.get("/", authMiddleware, getAllStatuses );

// Mark status as viewed
router.post("/:id/view", authMiddleware, viewStatus);

export default router;