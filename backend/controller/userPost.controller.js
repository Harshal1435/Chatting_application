// controllers/postController.js

import Post from "../models/UserPosts.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Create Post Controller
// controllers/postController.js



// Allowed types
const ALLOWED_TYPES = ["text", "image", "video"];


export const createPost = async (req, res) => {
  try {
    let { type, content, caption } = req.body;

    // Normalize inputs
    type = type?.trim().toLowerCase();
    caption = caption?.trim() || "";

    // ✅ Validate type
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    // ✅ For "text" type, content is required
    if (type === "text") {
      content = content?.trim();
      if (!content) {
        return res.status(400).json({ error: "Text content is required." });
      }
    }

    // ✅ For image/video, handle media upload
    let mediaUrl;
    if (type === "image" || type === "video") {
      if (!req.file) {
        return res.status(400).json({ error: `${type} file is required.` });
      }

      const uploadResult = await uploadToCloudinary(req.file.path, {
        folder: "posts",
        resourceType: type,
      });

      mediaUrl = uploadResult.secure_url;
      if (!mediaUrl) {
        return res.status(500).json({ error: "Failed to upload media." });
      }
    }

    // ✅ Create post object
    const newPost = new Post({
      type,
      content: type === "text" ? content : undefined,
      mediaUrl: (type === "image" || type === "video") ? mediaUrl : undefined,
      caption,
      author: req.user._id,
    });

    await newPost.save();

    // ✅ Push post into user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { post: newPost._id }, // 🔁 use "posts" here if your schema uses plural
    });

    return res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("❌ createPost error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



export const showPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).populate("author");
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.status(200).json(post);
    } catch (error) {
      console.error("Show post error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
    }
    };

    export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const user = await User.findById(post.author._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.posts = user.posts.filter((p) => p._id.toString()!== postId);
    await user.save();
    await post.remove();
    return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
    }
    };

    export const getAllPosts = async (req, res) => {
      try {
        const posts = await Post.find().populate("author");
        return res.status(200).json(posts);
      } catch (error) {
        console.error("Get all posts error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    };



// Like or Unlike Post
export const toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likes.pull(userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Like toggle error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    post.comments.unshift(comment); // latest comment first
    await post.save();

    res.status(201).json({
      message: "Comment added",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Add comment error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

