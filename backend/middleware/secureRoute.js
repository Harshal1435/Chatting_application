import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
; // Adjust path if needed

const secureRoute = async (req, res, next) => {
  try {
    const token =
      req.cookies?.jwt || req.headers.authorization?.split(" ")[1];

    if (!token || typeof token !== "string" || token.trim() === "") {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Optional: Log the raw token for debugging
    // console.log("Received Token:", token);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_TOKEN);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in secureRoute:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default secureRoute;


