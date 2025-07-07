import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createTokenAndSaveCookie from "../jwt/generateToken.js";

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
    if (existingUser) {
      return res.status(400).json({ error: "User already registered" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = createTokenAndSaveCookie(newUser._id, res);

    res.status(201).json({
      message: "User created successfully",
      user: {
        token,
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        avatar:newUser.avatar
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

 
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid user credentials" });
    }

   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid user credentials" });
    }

    const token = createTokenAndSaveCookie(user._id, res);

    console.log("User logged in successfully :::", user);

    res.status(200).json({
      message: "User logged in successfully",
      user: {
        token,
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
         avatar:user.avatar
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.status(201).json({ message: "User logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const allUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");
    res.status(201).json(filteredUsers);
  } catch (error) {
    console.log("Error in allUsers Controller: " + error);
  }
};

export const getProfile = async (req, res) => {
  try {
    res.status(200).json(req.user); // req.user comes from protect middleware
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export const updateProfile = async (req, res) => {
 try {
    const { fullname, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullname = fullname || user.fullname;
    user.avatar = avatar || user.avatar;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
}