// server/middleware/socketRateLimiter.js
/**
 * Socket.IO Rate Limiter Middleware
 * Prevents connection spam and abuse
 */

// Track connection attempts per IP
const connectionAttempts = new Map();

// Cleanup interval - remove old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of connectionAttempts.entries()) {
    if (now - value.timestamp > 60000) {
      connectionAttempts.delete(key);
    }
  }
}, 60000);

const socketRateLimiter = (socket, next) => {
  try {
    const ip = socket.handshake.address;
    const now = Date.now();

    // Get or create attempt record
    const attempts = connectionAttempts.get(ip) || {
      count: 0,
      timestamp: now,
    };

    // Check if rate limit exceeded (10 connections per minute per IP)
    if (attempts.count > 10 && now - attempts.timestamp < 60000) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return next(new Error("Rate limit exceeded. Please try again later."));
    }

    // Reset counter if time window passed
    if (now - attempts.timestamp > 60000) {
      attempts.count = 0;
      attempts.timestamp = now;
    }

    // Increment counter
    attempts.count++;
    connectionAttempts.set(ip, attempts);

    next();
  } catch (error) {
    console.error("Socket rate limiter error:", error);
    next(error);
  }
};

module.exports = socketRateLimiter;
