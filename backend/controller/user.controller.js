import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookie from "../jwt/generateToken.js";

import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";


// ✅ Signup
export const signup = async (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  if (!fullname || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullname, email, password: hashedPassword });
    await newUser.save();

    const token = createTokenAndSaveCookie(newUser._id, res);
    res.status(201).json({
      message: "User created successfully",
      user: { token, _id: newUser._id, fullname: newUser.fullname, email: newUser.email, avatar: newUser.avatar }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = createTokenAndSaveCookie(user._id, res);
    res.status(200).json({
      message: "User logged in successfully",
      user: { token, _id: user._id, fullname: user.fullname, email: user.email, avatar: user.avatar }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get all users (excluding self)
export const allUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("allUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get profile (with follow count)
export const getProfile = async (req, res) => {
  try {
   const  { userId } = req.params;
   console.log("jhncnjkdcn",userId);

    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "username avatar")
      .populate("following", "username avatar")
      .populate("post", "mediaUrl");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Update profile

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullname, isPrivate } = req.body;

    // Check if the logged-in user is authorized
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let avatar = req.user.avatar;

    // ✅ If new avatar file is uploaded
    console.log("req.file", req.file);
    if (req.file) {
      // Delete old avatar if it exists
      if (avatar) {
        await deleteFromCloudinary(avatar, "profile_avatars");
      }

      // Upload new one
      const uploadResult = await uploadToCloudinary(req.file.path, {
        folder: "profile_avatars",
        resourceType: "image",
      });

      avatar = uploadResult.secure_url;
    }
    console.log("avatar", avatar);

    // ✅ Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname: fullname || req.user.fullname,
        avatar,
        isPrivate: isPrivate ?? req.user.isPrivate,
      },
      {
        new: true,
        select: "-password",
      }
    ).populate("contacts", "fullname avatar");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("❌ updateProfile error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Send follow request
export const sendFollowRequest = async (req, res) => {
  const { targetUserId } = req.body;
  const currentUser = await User.findById(req.user._id);
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) return res.status(404).json({ error: "User not found" });
  
  if (targetUser.followers.includes(currentUser._id)) {
    return res.status(400).json({ error: "Already following this user" });
  }

  if (targetUser.isPrivate) {
    if (targetUser.followRequests.includes(currentUser._id)) {
      return res.status(400).json({ error: "Follow request already sent" });
    }

    targetUser.followRequests.push(currentUser._id);
    targetUser.notifications.push({
      type: "follow-request",
      from: currentUser._id,
      seen: false,
      status: "pending",
    });
    await targetUser.save();
    return res.status(200).json({ message: "Follow request sent" });
  } else {
    targetUser.followers.push(currentUser._id);
    currentUser.following.push(targetUser._id);
    await targetUser.save();
    await currentUser.save();
    return res.status(200).json({ message: "User followed" });
  }
};

// ✅ Accept follow request + update notification
export const acceptFollowRequest = async (req, res) => {
  const { requesterId } = req.body;
  const user = await User.findById(req.user._id);
  const requester = await User.findById(requesterId);

  if (!requester) return res.status(404).json({ error: "Requester not found" });
  if (!user.followRequests.includes(requesterId)) {
    return res.status(400).json({ error: "No follow request from this user" });
  }

  user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);
  if (!user.followers.includes(requesterId)) user.followers.push(requesterId);
  if (!requester.following.includes(user._id)) requester.following.push(user._id);

  // ✅ Update notification
  user.notifications.forEach(notification => {
    if (
      notification.type === "follow-request" &&
      notification.from.toString() === requesterId
    ) {
      notification.seen = true;
      notification.status = "accepted";
    }
  });

  await user.save();
  await requester.save();

  res.status(200).json({ message: "Follow request accepted" });
};

// ✅ Reject follow request + update notification
export const rejectFollowRequest = async (req, res) => {
  const { requesterId } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const before = user.followRequests.length;
  user.followRequests = user.followRequests.filter(id => id.toString() !== requesterId);

  if (user.followRequests.length === before) {
    return res.status(400).json({ error: "No follow request from this user" });
  }

  // ✅ Update notification
  user.notifications.forEach(notification => {
    if (
      notification.type === "follow-request" &&
      notification.from.toString() === requesterId
    ) {
      notification.seen = true;
      notification.status = "rejected";
    }
  });

  await user.save();
  res.status(200).json({ message: "Follow request rejected" });
};

// ✅ Unfollow user
export const unfollowUser = async (req, res) => {
 try{ 
  const { unfollowUserId } = req.params;
  console.log("userId", unfollowUserId);
  const currentUser = await User.findById(req.user._id);

  const targetUser = await User.findById(unfollowUserId);
  

  if (!targetUser) return res.status(404).json({ error: "User not found" });

  if (!currentUser.following.includes(unfollowUserId)) {
    return res.status(400).json({ error: "Not following this user" });
  }

  targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
  currentUser.following = currentUser.following.filter(id => id.toString() !== unfollowUserId.toString());

  await targetUser.save();
  await currentUser.save();

  res.status(200).json({ message: "User unfollowed" });}
  catch(error){
  console.error("unfollowUser error", error);
  res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get notifications (latest first)
export const getNotifications = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("notifications.from", "fullname avatar")
    .select("notifications");

  res.status(200).json(user.notifications.reverse());
};

// ✅ Mark all notifications seen
export const markNotificationsAsSeen = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.notifications.forEach(n => n.seen = true);
  await user.save();

  res.status(200).json({ message: "All notifications marked as seen" });
};
