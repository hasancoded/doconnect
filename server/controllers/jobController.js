// server/controllers/jobController.js - Complete Job Management
const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// @desc    Create new job posting
// @route   POST /api/jobs/create
// @access  Private (Senior doctors only)
exports.createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Verify user can post jobs
    if (req.user.role !== "senior") {
      return res.status(403).json({
        success: false,
        message: "Only senior doctors can post jobs",
      });
    }

    // Create job with posted_by field
    const jobData = {
      ...req.body,
      posted_by: req.user.id,
    };

    const job = await Job.create(jobData);

    // Update user job statistics
    await req.user.updateJobStatistics();

    // Update subscription usage tracking

    if (req.user.subscription) {
      const Subscription = require("../models/Subscription");
      try {
        const subscription = await Subscription.findOne({
          userId: req.user.id,
        });

        if (subscription) {
            "Usage before:",
            JSON.stringify(subscription.usage?.jobPostings)
          );
          await subscription.trackUsage("jobPostings", 1);
            "Usage after:",
            JSON.stringify(subscription.usage?.jobPostings)
          );
        } else {
            "⚠️ No subscription document found for userId:",
            req.user.id
          );
        }
      } catch (subError) {
        console.error(
          "❌ Error tracking subscription usage:",
          subError.message
        );
        console.error("Stack:", subError.stack);
        // Don't fail the job creation if subscription tracking fails
      }
    } else {
    }

    // Populate the posted_by field for response
    await job.populate("posted_by", "firstName lastName profilePhoto");

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error creating job:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating job",
    });
  }
};

// @desc    Get job details
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate(
        "posted_by",
        "firstName lastName profilePhoto rating verificationStatus"
      )
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Note: View tracking is handled by the dedicated POST /api/jobs/:id/view endpoint
    // This prevents duplicate counting from React Query refetches and page refreshes

    // Filter sensitive information based on user role
    let jobData = { ...job };

    // If not the job poster, hide some details
    if (!req.user || req.user.id !== job.posted_by._id.toString()) {
      delete jobData.analytics;
      delete jobData.matching_criteria;
    }

    res.status(200).json({
      success: true,
      data: jobData,
    });
  } catch (error) {
    console.error("Error fetching job:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching job",
    });
  }
};

// @desc    Update job posting
// @route   PUT /api/jobs/:id
// @access  Private (Job owner only)
exports.updateJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    // Check if job can be updated
    if (job.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot update completed jobs",
      });
    }

    // Update job
    // Skip validation for drafts
    const runValidators = req.body.status !== "draft" && job.status !== "draft";

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators,
    }).populate("posted_by", "firstName lastName profilePhoto");

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error updating job:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating job",
    });
  }
};

// @desc    Delete job posting (soft delete)
// @route   DELETE /api/jobs/:id
// @access  Private (Job owner only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    // Check if job has active applications
    const activeApplications = await Application.countDocuments({
      job_id: job._id,
      status: {
        $in: [
          "submitted",
          "under_review",
          "shortlisted",
          "interview_scheduled",
        ],
      },
    });

    if (activeApplications > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete job with active applications",
        activeApplications,
      });
    }

    // Soft delete by setting status to closed
    const wasDraft = job.status === "draft";
    job.status = "closed";
    // Skip validation for drafts (they might have empty required fields)
    await job.save({ validateBeforeSave: !wasDraft });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting job",
    });
  }
};

// @desc    Get employer's job postings
// @route   GET /api/jobs/my-jobs
// @access  Private (Senior doctors only)
exports.getMyJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = { posted_by: req.user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("posted_by", "firstName lastName profilePhoto")
      .lean();

    // Get applications count for each job
    for (let job of jobs) {
      job.applications_count = await Application.countDocuments({
        job_id: job._id,
        status: { $ne: "withdrawn" },
      });
    }

    // Get total count for pagination
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
    console.error("Error fetching my jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching jobs",
    });
  }
};

// @desc    Browse available jobs with pagination
// @route   GET /api/jobs/browse
// @access  Public
exports.browseJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      specialty,
      experience_level,
      budget_min,
      budget_max,
      remote_only,
      deadline_days,
      sortBy = "createdAt",
    } = req.query;

    const filters = {
      category,
      specialty,
      experience_level,
      budget_min: budget_min ? parseFloat(budget_min) : undefined,
      budget_max: budget_max ? parseFloat(budget_max) : undefined,
      remote_only: remote_only === "true",
      deadline_days: deadline_days ? parseInt(deadline_days) : undefined,
      sortBy,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    const query = Job.searchJobs(null, filters);

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await query
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        "posted_by",
        "firstName lastName profilePhoto rating verificationStatus"
      )
      .lean();

    // Get total count for pagination
    const totalQuery = Job.searchJobs(null, filters);
    const total = await totalQuery.countDocuments();

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      filters: filters,
    });
  } catch (error) {
    console.error("Error browsing jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while browsing jobs",
    });
  }
};

// @desc    Advanced job search with filters
// @route   GET /api/jobs/search
// @access  Public
exports.searchJobs = async (req, res) => {
  try {
    const {
      q: searchTerm,
      page = 1,
      limit = 20,
      category,
      specialty,
      experience_level,
      budget_min,
      budget_max,
      remote_only,
      deadline_days,
      sortBy = "relevance",
    } = req.query;

    // ✅ FIX: Check if searchTerm exists before calling trim()
    if (searchTerm && searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 2 characters long",
      });
    }

    const filters = {
      category,
      specialty,
      experience_level,
      budget_min: budget_min ? parseFloat(budget_min) : undefined,
      budget_max: budget_max ? parseFloat(budget_max) : undefined,
      remote_only: remote_only === "true",
      deadline_days: deadline_days ? parseInt(deadline_days) : undefined,
      sortBy,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    // ✅ FIX: Use searchTerm only if it exists and has content
    const trimmedSearchTerm =
      searchTerm && searchTerm.trim() !== "" ? searchTerm.trim() : null;
    const query = Job.searchJobs(trimmedSearchTerm, filters);

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await query
      .skip(skip)
      .limit(parseInt(limit))
      .populate(
        "posted_by",
        "firstName lastName profilePhoto rating verificationStatus"
      )
      .lean();

    // ✅ FIX: Use the same trimmedSearchTerm for count query
    const totalQuery = Job.searchJobs(trimmedSearchTerm, filters);
    const total = await totalQuery.countDocuments();

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      searchTerm: trimmedSearchTerm,
      filters,
    });
  } catch (error) {
    console.error("Error searching jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching jobs",
    });
  }
};

// @desc    Get personalized job recommendations
// @route   GET /api/jobs/recommendations
// @access  Private (Junior doctors only)
exports.getRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Job recommendations are only available for junior doctors",
      });
    }

    const recommendations = await req.user.getJobRecommendations(
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: recommendations,
      message: "Personalized job recommendations retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting job recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting recommendations",
    });
  }
};

// @desc    Get job categories
// @route   GET /api/jobs/categories
// @access  Public
exports.getJobCategories = async (req, res) => {
  try {
    const categories = await Job.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const specialties = await Job.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$specialty", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories: categories.map((c) => ({ name: c._id, count: c.count })),
        specialties: specialties.map((s) => ({ name: s._id, count: s.count })),
      },
    });
  } catch (error) {
    console.error("Error getting job categories:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting categories",
    });
  }
};

// @desc    Get trending/popular jobs
// @route   GET /api/jobs/trending
// @access  Public
exports.getTrendingJobs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get jobs with high view counts and recent applications
    const trendingJobs = await Job.find({
      status: "active",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })
      .sort({ views_count: -1, applications_count: -1, featured: -1 })
      .limit(parseInt(limit))
      .populate(
        "posted_by",
        "firstName lastName profilePhoto rating verificationStatus"
      )
      .lean();

    res.status(200).json({
      success: true,
      data: trendingJobs,
    });
  } catch (error) {
    console.error("Error getting trending jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting trending jobs",
    });
  }
};

// @desc    Get platform job statistics
// @route   GET /api/jobs/statistics
// @access  Public
exports.getJobStatistics = async (req, res) => {
  try {
    const stats = await Promise.all([
      Job.countDocuments({ status: "active" }),
      Job.countDocuments({ status: "completed" }),
      Job.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalValue: { $sum: "$budget.amount" } } },
      ]),
      Job.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const [activeJobs, completedJobs, totalValueResult, categoriesBreakdown] =
      stats;
    const totalValue = totalValueResult[0]?.totalValue || 0;

    res.status(200).json({
      success: true,
      data: {
        activeJobs,
        completedJobs,
        totalJobs: activeJobs + completedJobs,
        totalValue,
        categoriesBreakdown,
      },
    });
  } catch (error) {
    console.error("Error getting job statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting statistics",
    });
  }
};

// @desc    Track job view (analytics)
// @route   POST /api/jobs/:id/view
// @access  Public
exports.trackJobView = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await job.addView();

    res.status(200).json({
      success: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking job view:", error);
    res.status(500).json({
      success: false,
      message: "Server error while tracking view",
    });
  }
};

// @desc    Pause job posting
// @route   POST /api/jobs/:id/pause
// @access  Private (Job owner only)
exports.pauseJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pause this job",
      });
    }

    if (job.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active jobs can be paused",
      });
    }

    job.status = "paused";
    await job.save();

    res.status(200).json({
      success: true,
      message: "Job paused successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error pausing job:", error);
    res.status(500).json({
      success: false,
      message: "Server error while pausing job",
    });
  }
};

// @desc    Reactivate job posting
// @route   POST /api/jobs/:id/activate
// @access  Private (Job owner only)
exports.activateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to activate this job",
      });
    }

    if (!["paused", "draft"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: "Only paused or draft jobs can be activated",
      });
    }

    // Check if job deadline is still in the future
    if (job.isExpired) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot activate expired job. Please update the deadline first.",
      });
    }

    job.status = "active";
    await job.save();

    res.status(200).json({
      success: true,
      message: "Job activated successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error activating job:", error);
    res.status(500).json({
      success: false,
      message: "Server error while activating job",
    });
  }
};

// @desc    Get applications for specific job
// @route   GET /api/jobs/:id/applications
// @access  Private (Job owner only)
exports.getJobApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = "match_score" } = req.query;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view applications for this job",
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
    };

    const applications = await Application.findByJob(req.params.id, options);
    const total = await Application.countDocuments({
      job_id: req.params.id,
      ...(status && { status }),
    });

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
    console.error("Error getting job applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting applications",
    });
  }
};

// @desc    Get job performance analytics
// @route   GET /api/jobs/:id/analytics
// @access  Private (Job owner only)
exports.getJobAnalytics = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Verify job ownership
    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view analytics for this job",
      });
    }

    // Get detailed analytics
    const applications = await Application.find({ job_id: job._id });
    const applicationsByStatus = await Application.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(job._id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Calculate match score distribution
    const matchScoreDistribution = await Application.aggregate([
      { $match: { job_id: new mongoose.Types.ObjectId(job._id) } },
      {
        $bucket: {
          groupBy: "$match_score",
          boundaries: [0, 25, 50, 75, 100],
          default: "Other",
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: "$match_score" },
          },
        },
      },
    ]);

    const analytics = {
      basic: {
        views: job.views_count,
        applications: job.applications_count,
        conversionRate:
          job.views_count > 0
            ? ((job.applications_count / job.views_count) * 100).toFixed(2)
            : 0,
      },
      applications: {
        total: applications.length,
        byStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        matchScoreDistribution,
      },
      budget: {
        jobBudget: job.budget.amount,
        averageProposal: job.analytics.average_proposal_amount,
        proposalRange: job.analytics.proposal_range,
      },
      timeline: {
        daysActive: Math.floor(
          (new Date() - job.createdAt) / (1000 * 60 * 60 * 24)
        ),
        daysRemaining: job.timeRemaining,
        isExpired: job.isExpired,
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error getting job analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting analytics",
    });
  }
};
