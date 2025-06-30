import express from "express";
import {
  allUsers,
  login,
  logout,
  signup,
  getProfile,
  updateProfile
} from "../controller/user.controller.js";
import secureRoute from "../middleware/secureRoute.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/allusers", secureRoute, allUsers);
router.get("profile", secureRoute,getProfile)
router.put("/updateprofile", secureRoute, updateProfile);
export default router;
