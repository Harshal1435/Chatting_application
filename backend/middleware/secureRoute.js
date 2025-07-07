import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const secureRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.jwt;

    console.log("👉 Header Auth:", authHeader);
    console.log("👉 Cookie JWT:", cookieToken);

    const token =
      cookieToken ||
      (authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 🛑 Log the token before verification
    console.log("🛡 Verifying token:", token);

    const decoded = jwt.verify(token, process.env.JWT_TOKEN);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Error in secureRoute:", error);
    res.status(401).json({ error: "Invalid or malformed token" });
  }
};

export default secureRoute;
