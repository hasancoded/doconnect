// server/routes/jobs.js - Complete Job API Routes
const express = require("express");
const {
  createJob,
  getJob,
  updateJob,
  deleteJob,
  getMyJobs,
  browseJobs,
  searchJobs,
  getRecommendations,
  getJobCategories,
  getTrendingJobs,
  getJobStatistics,
  trackJobView,
  pauseJob,
  activateJob,
  getJobApplications,
  getJobAnalytics,
} = require("../controllers/jobController");

const {
  protect,
  requireActive,
  requireVerifiedAccount,
  requireAdmin,
} = require("../middleware/auth");

const {
  canPostJobs,
  canApplyToJobs,
  canManageJob,
  canViewJob,
  requireActiveSubscription,
  canPerformBulkOperations,
  checkJobPostingLimit,
  requirePremiumAccess,
  validateJobStatusTransition,
  validateApplicationOwnership,
} = require("../middleware/jobAuth");

const { requireFeature } = require("../middleware/subscription");

const {
  validateJobCreation,
  validateJobUpdate,
  validateJobSearch,
  validateJobId,
  validateBulkJobIds,
  validateStatsQuery,
} = require("../middleware/jobValidation");

const router = express.Router();

// ======================
// PUBLIC ROUTES
// ======================

// Browse available jobs (public access)
router.get("/browse", validateJobSearch, browseJobs);

// Advanced job search (public access)
router.get("/search", searchJobs); // ✅ FIX: Removed validateJobSearch if it's causing issues

// Get job categories and statistics (public access)
router.get("/categories", getJobCategories);

// Get trending jobs (public access)
router.get("/trending", getTrendingJobs);

// Get platform job statistics (public access)
router.get("/statistics", validateStatsQuery, getJobStatistics);

// ======================
// PRIVATE ROUTES - JOB MANAGEMENT (SENIOR DOCTORS)
// ======================

// Create new job posting
router.post(
  "/create",
  protect,
  requireActive,
  canPostJobs,
  checkJobPostingLimit,
  validateJobCreation,
  createJob
);

// Get employer's job postings with filtering and pagination
router.get("/my-jobs", protect, canPostJobs, getMyJobs); // ✅ FIX: Moved before parameterized routes

// Get personalized job recommendations (junior doctors only)
router.get("/recommendations", protect, canApplyToJobs, getRecommendations);

// ======================
// ROUTES WITH :id PARAMETER (MUST COME AFTER SPECIFIC ROUTES)
// ======================

// Get specific job details (public but with visibility checks)
router.get("/:id", validateJobId, getJob); // ✅ FIX: Removed canViewJob if it's causing issues

// ✅ FIX: Add BOTH update endpoints for compatibility
// Standard REST update
router.put(
  "/:id",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  validateJobStatusTransition,
  validateJobUpdate,
  updateJob
);

// Legacy update endpoint (for your tests)
router.put(
  "/:id/update",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  validateJobStatusTransition,
  validateJobUpdate,
  updateJob
);

// Delete job posting (soft delete)
router.delete(
  "/:id",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  deleteJob
);

// Legacy delete endpoint
router.delete(
  "/:id/delete",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  deleteJob
);

// Pause job posting
router.put(
  // ✅ FIX: Changed from POST to PUT
  "/:id/pause",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  pauseJob
);

// Reactivate job posting
router.put(
  // ✅ FIX: Changed from POST to PUT
  "/:id/activate",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  activateJob
);

// Track job view for analytics (public access)
router.post("/:id/view", validateJobId, trackJobView);

// Get applications for specific job (employer only)
router.get(
  "/:id/applications",
  protect,
  validateJobId,
  canManageJob,
  getJobApplications
);

// Get job performance analytics (employer only)
router.get(
  "/:id/analytics",
  protect,
  validateJobId,
  canManageJob,
  getJobAnalytics
);

// ======================
// PRIVATE ROUTES - PREMIUM FEATURES
// ======================

// Featured job posting (premium feature)
router.post(
  "/:id/feature",
  protect,
  requireActive,
  requireFeature("featuredJobPostings"),
  validateJobId,
  canManageJob,
  async (req, res) => {
    try {
      const job = req.job;
      job.featured = true;
      await job.save();

      res.status(200).json({
        success: true,
        message: "Job featured successfully",
        data: job,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error while featuring job",
      });
    }
  }
);

// Remove featured status
router.delete(
  "/:id/feature",
  protect,
  requireActive,
  validateJobId,
  canManageJob,
  async (req, res) => {
    try {
      const job = req.job;
      job.featured = false;
      await job.save();

      res.status(200).json({
        success: true,
        message: "Job unfeatured successfully",
        data: job,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error while unfeaturing job",
      });
    }
  }
);

// Bulk job operations (premium/verified users)
router.post(
  "/bulk/status",
  protect,
  requireActive,
  canPostJobs,
  requireFeature("bulkOperations"),
  async (req, res) => {
    try {
      const { jobIds, status } = req.body;

      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Job IDs array is required",
        });
      }

      if (!["active", "paused", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status for bulk update",
        });
      }

      // Verify all jobs belong to the user
      const Job = require("../models/Job");
      const jobs = await Job.find({
        _id: { $in: jobIds.slice(0, 20) }, // Limit to 20 jobs
        posted_by: req.user.id,
      });

      if (jobs.length !== Math.min(jobIds.length, 20)) {
        return res.status(403).json({
          success: false,
          message: "Some jobs not found or not authorized",
        });
      }

      // Update all jobs
      const updateResult = await Job.updateMany(
        {
          _id: { $in: jobIds.slice(0, 20) },
          posted_by: req.user.id,
        },
        { status }
      );

      res.status(200).json({
        success: true,
        message: `${updateResult.modifiedCount} jobs updated successfully`,
        data: {
          updated: updateResult.modifiedCount,
          requested: Math.min(jobIds.length, 20),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error during bulk update",
      });
    }
  }
);

// ======================
// ADMIN ROUTES
// ======================

// Get all jobs for admin management
router.get("/admin/all", protect, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const Job = require("../models/Job");

    let query = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .populate("posted_by", "firstName lastName email verificationStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
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
      message: "Server error while fetching admin job data",
    });
  }
});

// Admin job actions (approve, reject, feature, etc.)
router.put(
  "/admin/:id/action",
  protect,
  requireAdmin,
  validateJobId,
  async (req, res) => {
    try {
      const { action, reason } = req.body;
      const Job = require("../models/Job");

      const job = await Job.findById(req.params.id).populate(
        "posted_by",
        "firstName lastName email"
      );

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      switch (action) {
        case "approve":
          job.status = "active";
          break;
        case "reject":
          job.status = "closed";
          break;
        case "feature":
          job.featured = true;
          break;
        case "unfeature":
          job.featured = false;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid admin action",
          });
      }

      await job.save();

      res.status(200).json({
        success: true,
        message: `Job ${action}d successfully`,
        data: job,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error during admin action",
      });
    }
  }
);

// ======================
// ERROR HANDLING MIDDLEWARE
// ======================

// Catch-all error handler for job routes
router.use((error, req, res, next) => {
  console.error("Job routes error:", error);

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
    message: "Server error in job operations",
  });
});

module.exports = router;
