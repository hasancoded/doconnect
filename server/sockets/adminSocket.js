// server/sockets/adminSocket.js - Real-Time Admin Dashboard Events
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const jwt = require("jsonwebtoken");

/**
 * Admin Socket.IO Namespace Handler
 * Provides real-time updates for admin dashboard
 */
module.exports = (io) => {
  console.log("🔧 Initializing admin Socket.IO namespace...");

  // Create dedicated admin namespace
  const adminNamespace = io.of("/admin");
  console.log("✅ Admin namespace created: /admin");

  // Middleware: Authenticate and verify admin role
  adminNamespace.use(async (socket, next) => {
    console.log("🔐 Admin namespace middleware triggered");

    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;
      console.log("Token received:", token ? "Yes" : "No");

      if (!token) {
        console.error("❌ No token provided to admin namespace");
        return next(new Error("No token provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified, user ID:", decoded.id);

      // Get user from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.error("❌ User not found:", decoded.id);
        return next(new Error("User not found"));
      }

      console.log("✅ User found:", user.email, "Role:", user.role);

      if (user.accountStatus !== "active") {
        console.error("❌ Account not active:", user.email);
        return next(new Error("Account not active"));
      }

      // Check if user is admin
      if (user.role !== "admin") {
        console.error("❌ Not an admin:", user.email, "Role:", user.role);
        return next(new Error("Unauthorized: Admin access required"));
      }

      // Attach user to socket
      socket.user = user;

      console.log(`✅ Admin authenticated: ${user.email} (${socket.id})`);
      next();
    } catch (error) {
      console.error("❌ Admin socket auth error:", error.message);
      next(new Error("Authentication failed: " + error.message));
    }
  });

  // Connection handler
  adminNamespace.on("connection", (socket) => {
    const adminUser = socket.user;

    console.log(`🔐 Admin dashboard connected: ${adminUser.email}`);

    // Join admin room
    socket.join("admin-room");

    // Send initial connection confirmation
    socket.emit("admin:connected", {
      message: "Connected to admin real-time updates",
      timestamp: new Date().toISOString(),
    });

    // Handle manual metrics refresh request
    socket.on("admin:metrics:request", async () => {
      try {
        const metrics = await getRealtimeMetrics();
        socket.emit("admin:metrics:update", metrics);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        socket.emit("admin:error", {
          message: "Failed to fetch metrics",
          error: error.message,
        });
      }
    });

    // Handle activity feed request
    socket.on("admin:activity:request", async (options = {}) => {
      try {
        const { limit = 50 } = options;
        const activities = await getRecentActivity(limit);
        socket.emit("admin:activity:feed", activities);
      } catch (error) {
        console.error("Error fetching activity:", error);
        socket.emit("admin:error", {
          message: "Failed to fetch activity feed",
          error: error.message,
        });
      }
    });

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Admin disconnected: ${adminUser.email} (${reason})`);
    });
  });

  // ============================================================================
  // REAL-TIME METRIC UPDATES (Every 10 seconds)
  // ============================================================================

  let metricsInterval = null;

  const startMetricsUpdates = () => {
    if (metricsInterval) {
      clearInterval(metricsInterval);
    }

    metricsInterval = setInterval(async () => {
      try {
        // Only send if admins are connected
        const adminSockets = await adminNamespace.fetchSockets();
        if (adminSockets.length === 0) return;

        const metrics = await getRealtimeMetrics();
        adminNamespace.to("admin-room").emit("admin:metrics:update", metrics);
      } catch (error) {
        console.error("Error in metrics update interval:", error);
      }
    }, 10000); // 10 seconds
  };

  // Start metrics updates
  startMetricsUpdates();

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get real-time metrics from database
   */
  async function getRealtimeMetrics() {
    try {
      const [
        totalUsers,
        activeUsers,
        seniorDoctors,
        juniorDoctors,
        fullyVerified,
        pendingVerification,
        newUsersLast7Days,
        recentlyVerified,
        activeJobs,
        totalApplications,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ accountStatus: "active" }),
        User.countDocuments({ role: "senior", accountStatus: "active" }),
        User.countDocuments({ role: "junior", accountStatus: "active" }),
        User.countDocuments({ "verificationStatus.overall": "verified" }),
        User.countDocuments({
          "verificationStatus.overall": { $in: ["unverified", "partial"] },
        }),
        User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
        User.countDocuments({
          "verificationStatus.overall": "verified",
          updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
        Job.countDocuments({ status: "active" }),
        Application.countDocuments(),
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        doctors: {
          senior: seniorDoctors,
          junior: juniorDoctors,
        },
        verification: {
          verified: fullyVerified,
          pending: pendingVerification,
          rate:
            totalUsers > 0
              ? ((fullyVerified / totalUsers) * 100).toFixed(1)
              : 0,
        },
        activity: {
          newUsers: newUsersLast7Days,
          recentlyVerified: recentlyVerified,
        },
        jobs: {
          active: activeJobs,
        },
        applications: {
          total: totalApplications,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching realtime metrics:", error);
      throw error;
    }
  }

  /**
   * Get recent activity feed
   */
  async function getRecentActivity(limit = 50) {
    try {
      // Get recent users
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("firstName lastName email createdAt role");

      // Get recent verifications
      const recentVerifications = await User.find({
        "verificationStatus.overall": "verified",
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("firstName lastName email updatedAt");

      // Get recent jobs
      const recentJobs = await Job.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title createdAt status")
        .populate("posted_by", "firstName lastName");

      // Combine and format activities
      const activities = [];

      recentUsers.forEach((user) => {
        activities.push({
          id: `user_${user._id}`,
          type: "user_registered",
          message: `Dr. ${user.firstName} ${user.lastName} registered as ${user.role}`,
          timestamp: user.createdAt,
          metadata: {
            userId: user._id,
            userEmail: user.email,
            role: user.role,
          },
        });
      });

      recentVerifications.forEach((user) => {
        activities.push({
          id: `verify_${user._id}`,
          type: "user_verified",
          message: `Dr. ${user.firstName} ${user.lastName} was verified`,
          timestamp: user.updatedAt,
          metadata: {
            userId: user._id,
            userEmail: user.email,
          },
        });
      });

      recentJobs.forEach((job) => {
        activities.push({
          id: `job_${job._id}`,
          type: "job_created",
          message: `New job posted: ${job.title}`,
          timestamp: job.createdAt,
          metadata: {
            jobId: job._id,
            jobTitle: job.title,
            postedBy: job.posted_by
              ? `${job.posted_by.firstName} ${job.posted_by.lastName}`
              : "Unknown",
          },
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw error;
    }
  }

  // ============================================================================
  // EVENT EMITTERS (Called from other parts of the application)
  // ============================================================================

  /**
   * Emit event when new user registers
   */
  const emitUserRegistered = (user) => {
    adminNamespace.to("admin-room").emit("admin:user:registered", {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Emit event when verification status changes
   */
  const emitVerificationUpdated = (user, verificationType, status) => {
    adminNamespace.to("admin-room").emit("admin:verification:updated", {
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      verificationType,
      status,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Emit event when new job is created
   */
  const emitJobCreated = (job) => {
    adminNamespace.to("admin-room").emit("admin:job:created", {
      jobId: job._id,
      title: job.title,
      status: job.status,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Emit event when new application is submitted
   */
  const emitApplicationSubmitted = (application) => {
    adminNamespace.to("admin-room").emit("admin:application:submitted", {
      applicationId: application._id,
      jobId: application.job,
      applicantId: application.applicant,
      timestamp: new Date().toISOString(),
    });
  };

  // Export event emitters for use in other modules
  return {
    emitUserRegistered,
    emitVerificationUpdated,
    emitJobCreated,
    emitApplicationSubmitted,
    getRealtimeMetrics,
    getRecentActivity,
  };
};
