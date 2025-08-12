import express from "express";
import secureRoute from "../middleware/secureRoute.js";
import upload from "../utils/multerConfig.js";
import {
  createPost,
  toggleLikePost,
  addComment,
  showPost,
  getAllPosts,
 deletePost,
} from "../controller/userPost.controller.js";

const router = express.Router();

router.post("/createPost", secureRoute, upload.single("file"), createPost);
router.put("/:id/like", secureRoute, toggleLikePost);
router.post("/:id/comment", secureRoute, addComment);
router.get("/:id", secureRoute, showPost);
router.get("/", getAllPosts);
router.delete("/:id", secureRoute, deletePost);

export default router;
