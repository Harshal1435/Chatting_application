import express from "express";
import multer from "multer";
import {
  signup,
  login,
  logout,
  allUsers,
  getProfile,
  updateProfile,
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  getNotifications,
  markNotificationsAsSeen,
} from "../controller/user.controller.js";
import isAuthenticated from "../middleware/secureRoute.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Auth
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Profile
router.get("/allusers", isAuthenticated, allUsers);
router.get("/profile/:userId", isAuthenticated, getProfile);
router.put("/profile/:userId", isAuthenticated, upload.single("avatar"), updateProfile);

// Follow system
router.post("/follow", isAuthenticated, sendFollowRequest);
router.post("/accept", isAuthenticated, acceptFollowRequest);
router.post("/reject", isAuthenticated, rejectFollowRequest);
router.post("/unfollow/:unfollowUserId", isAuthenticated, unfollowUser);

// Notifications
router.get("/notifications", isAuthenticated, getNotifications);
router.put("/notifications/seen", isAuthenticated, markNotificationsAsSeen);

export default router;
