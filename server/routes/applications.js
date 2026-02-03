// server/routes/applications.js - Complete Application Management Routes - FIXED
const express = require("express");
const {
  submitApplication,
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
  withdrawApplication,
  addMessage,
  scheduleInterview,
  acceptApplication,
  rejectApplication,
  getApplicationDetails,
  rateApplication,
} = require("../controllers/applicationController");

const {
  calculateJobMatch,
  getJobRecommendations,
  getCandidateRecommendations,
  getMatchAnalytics,
  bulkCalculateMatches,
} = require("../controllers/matchingController");

const {
  protect,
  requireActive,
  requireVerifiedAccount,
  requireAdmin,
} = require("../middleware/auth");

const {
  canApplyToJobs,
  canPostJobs,
  canManageApplication,
  canApplyToSpecificJob,
  canPerformBulkOperations,
  checkApplicationLimit,
  validateApplicationStatusTransition,
} = require("../middleware/jobAuth");

const {
  validateApplication,
  validateApplicationStatusUpdate,
  validateInterviewScheduling,
  validateContractDetails,
  validateMessage,
  validateRating,
  validateApplicationSearch,
  validateBulkJobIds,
  validateApplicationOwnership,
} = require("../middleware/jobValidation");

const { requireFeature } = require("../middleware/subscription");

const router = express.Router();

// ======================
// ALL LITERAL ROUTES FIRST - BEFORE ANY /:id ROUTES
// ======================

// Submit job application
router.post(
  "/submit",
  protect,
  requireActive,
  canApplyToJobs,
  canApplyToSpecificJob,
  checkApplicationLimit,
  validateApplication,
  submitApplication
);

// Get user's applications with filtering and pagination
router.get(
  "/my-apps",
  protect,
  canApplyToJobs,
  validateApplicationSearch,
  getMyApplications
);

// Get received applications for employer's jobs
router.get(
  "/received",
  protect,
  canPostJobs,
  validateApplicationSearch,
  getReceivedApplications
);

// ======================
// MATCHING SYSTEM ROUTES - ALL LITERAL
// ======================

// Get personalized job recommendations (junior doctors)
router.get(
  "/matching/recommendations",
  protect,
  canApplyToJobs,
  getJobRecommendations
);

// Bulk calculate matches for multiple jobs (premium feature)
router.post(
  "/matching/bulk",
  protect,
  canApplyToJobs,
  canPerformBulkOperations,
  validateBulkJobIds,
  bulkCalculateMatches
);

// ======================
// BULK OPERATIONS - LITERAL ROUTES
// ======================

// Bulk application operations (verified users only)
router.post(
  "/bulk/withdraw",
  protect,
  requireActive,
  canApplyToJobs,
  requireFeature("bulkOperations"),
  async (req, res) => {
    try {
      const { applicationIds } = req.body;

      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Application IDs array is required",
        });
      }

      const Application = require("../models/Application");

      // Verify all applications belong to the user and can be withdrawn
      const applications = await Application.find({
        _id: { $in: applicationIds.slice(0, 10) }, // Limit to 10
        applicant_id: req.user.id,
        status: { $nin: ["accepted", "completed", "withdrawn"] },
      });

      // Update all applications to withdrawn
      const updateResult = await Application.updateMany(
        {
          _id: { $in: applications.map((app) => app._id) },
          applicant_id: req.user.id,
        },
        {
          status: "withdrawn",
          $push: {
            communication_log: {
              type: "status_change",
              content: "Application withdrawn via bulk operation",
              from: "applicant",
              date: new Date(),
            },
          },
        }
      );

      res.status(200).json({
        success: true,
        message: `${updateResult.modifiedCount} applications withdrawn successfully`,
        data: {
          withdrawn: updateResult.modifiedCount,
          requested: Math.min(applicationIds.length, 10),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error during bulk withdrawal",
      });
    }
  }
);

// ======================
// ADMIN ROUTES - LITERAL PATHS
// ======================

// Get all applications for admin management
router.get("/admin/all", protect, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const Application = require("../models/Application");

    let query = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      // Search in job title or applicant name
      const User = require("../models/User");
      const Job = require("../models/Job");

      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const jobs = await Job.find({
        title: { $regex: search, $options: "i" },
      }).select("_id");

      query.$or = [
        { applicant_id: { $in: users.map((u) => u._id) } },
        { job_id: { $in: jobs.map((j) => j._id) } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate("applicant_id", "firstName lastName email verificationStatus")
      .populate("job_id", "title category posted_by")
      .populate("job_id.posted_by", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin application data",
    });
  }
});

// ======================
// ANALYTICS AND STATISTICS - LITERAL ROUTES
// ======================

// Get application statistics
router.get("/statistics/overview", protect, async (req, res) => {
  try {
    const Application = require("../models/Application");
    let query = {};

    // Filter by user role
    if (req.user.role === "junior") {
      query.applicant_id = req.user.id;
    } else if (req.user.role === "senior") {
      const Job = require("../models/Job");
      const userJobs = await Job.find({ posted_by: req.user.id }).select("_id");
      query.job_id = { $in: userJobs.map((job) => job._id) };
    } else if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const stats = await Promise.all([
      Application.countDocuments(query),
      Application.countDocuments({ ...query, status: "accepted" }),
      Application.countDocuments({ ...query, status: "completed" }),
      Application.countDocuments({ ...query, status: "rejected" }),
      Application.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const [total, accepted, completed, rejected, statusBreakdown] = stats;

    res.status(200).json({
      success: true,
      data: {
        total,
        accepted,
        completed,
        rejected,
        successRate:
          total > 0 ? (((accepted + completed) / total) * 100).toFixed(2) : 0,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
    });
  }
});

// ======================
// PARAMETERIZED ROUTES - MUST COME LAST
// ======================

// Calculate match score for specific job (junior doctors) - HAS :jobId PARAM
router.post(
  "/matching/calculate/:jobId",
  protect,
  canApplyToJobs,
  calculateJobMatch
);

// Get candidate recommendations for a job - HAS :jobId PARAM
router.get(
  "/candidates/:jobId",
  protect,
  canPostJobs,
  getCandidateRecommendations
);

// Get match analytics for a job - HAS :jobId PARAM
router.get("/analytics/:jobId", protect, canPostJobs, getMatchAnalytics);

// Get application details (role-based view) - HAS :id PARAM
router.get("/:id", protect, canManageApplication, getApplicationDetails);

// Update application (before submission or draft applications only) - HAS :id PARAM
router.put(
  "/:id/update",
  protect,
  requireActive,
  canManageApplication,
  validateApplication,
  async (req, res) => {
    try {
      if (!req.isApplicant) {
        return res.status(403).json({
          success: false,
          message: "Only the applicant can update their application",
        });
      }

      if (req.application.status !== "draft") {
        return res.status(400).json({
          success: false,
          message: "Can only update draft applications",
        });
      }

      // Update application fields
      Object.keys(req.body).forEach((key) => {
        if (key !== "job_id" && key !== "applicant_id") {
          req.application[key] = req.body[key];
        }
      });

      await req.application.save();

      res.status(200).json({
        success: true,
        message: "Application updated successfully",
        data: req.application,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error while updating application",
      });
    }
  }
);

// Withdraw application - HAS :id PARAM
router.delete(
  "/:id/withdraw",
  protect,
  requireActive,
  canManageApplication,
  withdrawApplication
);

// Send message to employer - HAS :id PARAM
router.post(
  "/:id/message",
  protect,
  requireActive,
  canManageApplication,
  validateMessage,
  addMessage
);

// Rate completed project (applicant rating employer) - HAS :id PARAM
router.post(
  "/:id/rate",
  protect,
  requireActive,
  canManageApplication,
  validateRating,
  rateApplication
);

// Update application status (employer actions) - HAS :id PARAM
router.put(
  "/:id/status",
  protect,
  requireActive,
  canManageApplication,
  validateApplicationStatusTransition,
  validateApplicationStatusUpdate,
  updateApplicationStatus
);

// Schedule interview - HAS :id PARAM
router.post(
  "/:id/interview",
  protect,
  requireActive,
  canManageApplication,
  validateInterviewScheduling,
  scheduleInterview
);

// Accept application (hire candidate) - HAS :id PARAM
router.post(
  "/:id/accept",
  protect,
  requireActive,
  canManageApplication,
  validateContractDetails,
  acceptApplication
);

// Reject application - HAS :id PARAM
router.post(
  "/:id/reject",
  protect,
  requireActive,
  canManageApplication,
  rejectApplication
);

// Add communication log entry - HAS :id PARAM
router.post(
  "/:id/communicate",
  protect,
  requireActive,
  canManageApplication,
  validateMessage,
  addMessage
);

// Priority application (moves application to top of list) - HAS :id PARAM
router.post(
  "/:id/priority",
  protect,
  requireVerifiedAccount,
  canManageApplication,
  async (req, res) => {
    try {
      if (!req.isApplicant) {
        return res.status(403).json({
          success: false,
          message: "Only applicants can prioritize their applications",
        });
      }

      // This would typically require a premium subscription
      // For now, just verified users can use this feature
      req.application.priority = true;
      req.application.prioritized_at = new Date();
      await req.application.save();

      res.status(200).json({
        success: true,
        message: "Application prioritized successfully",
        data: req.application,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error while prioritizing application",
      });
    }
  }
);

// Admin application dispute resolution - HAS :id PARAM
router.put(
  "/admin/:id/resolve-dispute",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const { resolution, notes } = req.body;
      const Application = require("../models/Application");

      const application = await Application.findById(req.params.id)
        .populate("applicant_id", "firstName lastName email")
        .populate("job_id", "title posted_by");

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Add admin resolution to communication log
      await application.addCommunication(
        "system",
        `Admin resolution: ${resolution}. ${notes || ""}`,
        "system"
      );

      // Update application based on resolution
      if (resolution === "reinstate") {
        application.status = "under_review";
      } else if (resolution === "close") {
        application.status = "rejected";
      }

      await application.save();

      res.status(200).json({
        success: true,
        message: "Dispute resolved successfully",
        data: {
          applicationId: application._id,
          resolution,
          status: application.status,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error during dispute resolution",
      });
    }
  }
);

// ======================
// ADDITIONAL ROUTES FOR TEST COMPATIBILITY
// ======================

// ✅ FIX: Support both PUT and DELETE for withdraw
router.put(
  "/:id/withdraw",
  protect,
  requireActive,
  canManageApplication,
  withdrawApplication
);

// ✅ FIX: Support both PUT and POST for accept
router.put(
  "/:id/accept",
  protect,
  requireActive,
  canManageApplication,
  validateContractDetails,
  acceptApplication
);

// ✅ FIX: Support both PUT and POST for reject
router.put(
  "/:id/reject",
  protect,
  requireActive,
  canManageApplication,
  rejectApplication
);

// ✅ FIX: Add rate application with PUT method
router.put(
  "/:id/rate",
  protect,
  requireActive,
  canManageApplication,
  validateRating,
  rateApplication
);

// ======================
// ERROR HANDLING MIDDLEWARE
// ======================

// Catch-all error handler for application routes
router.use((error, req, res, next) => {
  console.error("Application routes error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  res.status(500).json({
    success: false,
    message: "Server error in application operations",
  });
});

module.exports = router;
