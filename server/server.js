// server/server.js - Updated with Stripe Subscription System and Socket.io
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Load environment-specific .env file
const path = require("path");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
require("dotenv").config({ path: path.join(__dirname, envFile) });

const app = express();

// Trust proxy - CRITICAL for Railway/Heroku/Render deployments
// This allows express-rate-limit to correctly identify users behind proxies
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1); // Trust first proxy
}

// SOCKET.IO INITIALIZATION
// ============================================================================

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with enhanced production settings
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL || "https://your-production-domain.com"
        : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
  // Connection settings
  pingTimeout: 60000, // 60s - how long to wait for pong
  pingInterval: 25000, // 25s - how often to ping
  upgradeTimeout: 10000, // 10s - upgrade timeout
  maxHttpBufferSize: 1e6, // 1MB - max message size

  // Performance settings
  transports: ["websocket", "polling"], // Prefer websocket
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 1024, // Compress messages > 1KB
  },

  // Connection limits
  connectTimeout: 45000, // 45s connection timeout

  // Server-side options
  serveClient: false, // Don't serve client files
  cookie: false, // No cookies needed
});

// Redis adapter for horizontal scaling (optional but recommended)
if (process.env.REDIS_URL) {
  const { createAdapter } = require("@socket.io/redis-adapter");
  const { createClient } = require("redis");

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  // Add error handlers to prevent crashes
  pubClient.on("error", (err) => {
    console.error("Redis Pub Client Error:", err.message);
  });

  subClient.on("error", (err) => {
    console.error("Redis Sub Client Error:", err.message);
  });

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Redis adapter connected for Socket.IO scaling");
    })
    .catch((err) => {
      console.error("❌ Redis adapter connection failed:", err.message);
      console.log("⚠️  Running without Redis - single server mode only");
    });
} else {
  console.log("ℹ️  Redis not configured - running in single server mode");
  console.log("   For production scaling, set REDIS_URL environment variable");
}

// Socket.io middleware
const socketAuth = require("./middleware/socketAuth");
const socketRateLimiter = require("./middleware/socketRateLimiter");

// Apply middleware in order
io.use(socketRateLimiter); // Rate limiting first
io.use(socketAuth); // Then authentication

// Initialize monitoring
const SocketMonitor = require("./utils/socketMonitor");
const socketMonitor = new SocketMonitor(io);

// Initialize message queue
const messageQueue = require("./utils/messageQueue");

// Initialize unified socket handler (fixes "Invalid namespace" error)
require("./sockets/index")(io, socketMonitor);

// Set Socket.io instance for notification service
const notificationService = require("./utils/notificationService");
notificationService.setSocketIO(io);

// Socket.IO health check endpoint
app.get("/api/socket/health", (req, res) => {
  const stats = socketMonitor.getStats();
  const queueStats = messageQueue.getStats();

  res.json({
    success: true,
    socket: {
      status: "active",
      ...stats,
    },
    messageQueue: queueStats,
    redis: process.env.REDIS_URL ? "enabled" : "disabled",
  });
});

console.log("✅ Socket.io initialized with production configuration");
console.log(`   - Rate limiting: enabled`);
console.log(`   - Monitoring: enabled`);
console.log(`   - Message queue: enabled`);
console.log(
  `   - Redis adapter: ${process.env.REDIS_URL ? "enabled" : "disabled"}`
);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL || "https://your-production-domain.com"
        : "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting with different tiers for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

const jobPostingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 job postings per hour
  message: {
    success: false,
    message: "Too many job postings from this IP, please try again later.",
  },
});

const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 30 applications per hour
  message: {
    success: false,
    message: "Too many applications from this IP, please try again later.",
  },
});

// Apply rate limiting
app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/jobs/create", jobPostingLimiter);
app.use("/api/applications/submit", applicationLimiter);

// ============================================================================
// WEBHOOK RAW BODY PARSING (Add BEFORE other body parsing middleware)
// ============================================================================

// This MUST come before express.json() to preserve raw body for webhook signature verification
const subscriptionRoutes = require("./routes/subscriptions");

// Webhook route needs raw body
app.post(
  "/api/subscriptions/webhook",
  express.raw({ type: "application/json" }),
  subscriptionRoutes
);

// ============================================================================
// REGULAR BODY PARSING (Keep existing setup)
// ============================================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with enhanced options
mongoose
  .connect(process.env.MONGODB_URI, {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  })
  .then(async () => {
    console.log("MongoDB connected successfully");
    console.log(`Database: ${mongoose.connection.name}`);

    // ============================================
    // AUTO-CREATE ADMIN USER IF NOT EXISTS
    // ============================================
    try {
      const User = require("./models/User");

      // Check if admin user already exists
      const existingAdmin = await User.findOne({ role: "admin" });

      if (!existingAdmin) {
        console.log("\n🔍 No admin user found. Creating default admin...");

        // Create default admin user
        const adminUser = await User.create({
          firstName: "System",
          lastName: "Admin",
          email: "admin@doconnect.com",
          phone: "+1-000-000-0000", // Required field
          password: "Admin@123", // Will be hashed automatically by pre-save hook
          role: "admin",
          accountStatus: "active",
          medicalLicenseNumber: "ADMIN-000000", // Required field
          licenseState: "System", // Required field
          primarySpecialty: "Administration", // Required field
          yearsOfExperience: 0, // Required field
          medicalSchool: {
            name: "System Administration",
            graduationYear: new Date().getFullYear(),
          },
          verificationStatus: {
            identity: "verified",
            medical_license: "verified",
            background_check: "verified",
            overall: "verified",
          },
        });

        console.log("✅ Default admin user created successfully!");
        console.log("📧 Email: admin@doconnect.com");
        console.log("🔑 Password: Admin@123");
        console.log("⚠️  IMPORTANT: Change this password after first login!\n");
      } else {
        console.log("✅ Admin user already exists.");
      }
    } catch (error) {
      console.error("❌ Error creating admin user:", error.message);
      // Don't exit - let the app continue even if admin creation fails
    }
    // ============================================
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(
      "   Server will continue running - MongoDB will retry automatically"
    );
    // Don't exit - allow server to run
  });

// MongoDB connection event handlers
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Handle app termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});

// ============================================================================
// STRIPE INITIALIZATION (Add after middleware)
// ============================================================================

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Verify Stripe connection on startup
if (process.env.STRIPE_SECRET_KEY) {
  stripe.balance.retrieve((err, balance) => {
    if (err) {
      console.error("⚠️  Stripe connection failed:", err.message);
    } else {
      console.log("✅ Stripe connected successfully");
    }
  });
}

// ============================================================================
// ZOOM INITIALIZATION (Test connection on startup)
// ============================================================================
const zoomService = require("./services/zoomService");

// Verify Zoom connection on startup
if (zoomService.isConfigured()) {
  zoomService
    .getAccessToken()
    .then(() => {
      console.log("✅ Zoom API connected successfully");
    })
    .catch((err) => {
      console.error("❌ Zoom connection failed:", err.message);
      console.error("   Check your ZOOM credentials in .env file");
    });
} else {
  console.log(
    "ℹ️  Zoom not configured - appointments will work without meeting links"
  );
}

// Health check routes
app.get("/api/health", (req, res) => {
  res.json({
    message: "Doconnect API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    const stats = await mongoose.connection.db.stats();
    res.json({
      success: true,
      message: "Database connected successfully",
      stats: {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        objects: stats.objects,
      },
      connection: {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// API status endpoint
app.get("/api/status", async (req, res) => {
  try {
    const User = require("./models/User");
    const Job = require("./models/Job");
    const Application = require("./models/Application");

    const [totalUsers, activeJobs, totalApplications] = await Promise.all([
      User.countDocuments({ accountStatus: "active" }),
      Job.countDocuments({ status: "active" }),
      Application.countDocuments(),
    ]);

    res.json({
      success: true,
      platform: {
        name: "Doconnect",
        version: "1.0.0",
        environment: process.env.NODE_ENV,
      },
      statistics: {
        totalUsers,
        activeJobs,
        totalApplications,
      },
      features: {
        authentication: "✅ Active",
        profiles: "✅ Active",
        jobs: "✅ Active",
        applications: "✅ Active",
        matching: "✅ Active",
        messaging: "✅ Active",
        notifications: "✅ Active",
        subscriptions: "✅ Active",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching API status",
      error: error.message,
    });
  }
});

// Import routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notifications");
const newsRoutes = require("./routes/news");
const appointmentRoutes = require("./routes/appointments");

// ============================================================================
// MOUNT SUBSCRIPTION ROUTES (Add with other routes)
// ============================================================================

const subscriptionsRouter = require("./routes/subscriptions");
app.use("/api/subscriptions", subscriptionsRouter);

// Mount routes with appropriate middleware
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/appointments", appointmentRoutes);

// 404 handler for API routes
app.all(/^\/api\/.*$/, (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      "/api/health",
      "/api/health/db",
      "/api/status",
      "/api/auth/*",
      "/api/profile/*",
      "/api/admin/*",
      "/api/jobs/*",
      "/api/applications/*",
      "/api/subscriptions/*",
      "/api/messages/*",
      "/api/notifications/*",
      "/api/news/*",
      "/api/appointments/*",
    ],
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const fieldMessages = {
      email: "Email address is already registered",
      medicalLicenseNumber: "Medical license number is already registered",
      slug: "This identifier is already taken",
    };

    return res.status(400).json({
      success: false,
      message: fieldMessages[field] || "Duplicate field value",
      field,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      field: err.path,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired",
    });
  }

  // Multer errors (file upload)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 10MB",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files uploaded",
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed");

    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error("Unhandled Promise Rejection:", err.message);
  console.error("Stack:", err.stack);

  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  console.error("Stack:", err.stack);

  // Close server & exit process
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("=================================");
  console.log(`Doconnect API Server Started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  Database: ${mongoose.connection.name}`);
  console.log("================================");
  console.log("✅ Features Active:");
  console.log("   • Authentication System");
  console.log("   • Enhanced Doctor Profiles");
  console.log("   • Job Posting System");
  console.log("   • Application Management");
  console.log("   • Smart Job Matching");
  console.log("   • Subscription System (Stripe)");
  console.log("   • Plan Management");
  console.log("   • Feature Access Control");
  console.log("   • Admin Dashboard");
  console.log("   • Real-Time Messaging (Socket.io)");
  console.log("   • Real-Time Notifications");
  console.log("   • Online Status Tracking");
  console.log("================================");
  console.log(`🚀 API Documentation: http://localhost:${PORT}/api/status`);
  console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
  console.log("=================================");

  // List registered API routes
  if (app._router && app._router.stack) {
    console.log("📋 Registered API Routes:");
    app._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        console.log(
          `   ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`
        );
      }
    });
    console.log("=================================");
  }
});

// Set server timeout
server.setTimeout(30000); // 30 seconds

module.exports = { app, io, server };
