const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Socket.io authentication middleware
 * Verifies JWT token and attaches user to socket
 */
const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return next(new Error("Authentication error: Account is not active"));
    }

    // Attach user to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return next(new Error("Authentication error: Invalid token"));
    }

    if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired"));
    }

    return next(new Error("Authentication error"));
  }
};

module.exports = socketAuth;
