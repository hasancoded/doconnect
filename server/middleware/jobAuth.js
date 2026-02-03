// server/middleware/jobAuth.js - Job-specific Authorization Middleware
const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

// Check if user can post jobs (senior doctors only)
exports.canPostJobs = (req, res, next) => {
  if (req.user.role !== "senior") {
    return res.status(403).json({
      success: false,
      message: "Only senior doctors can post jobs",
      requiredRole: "senior",
      currentRole: req.user.role,
    });
  }
  next();
};

// Check if user can apply to jobs (junior doctors only)
exports.canApplyToJobs = (req, res, next) => {
  if (req.user.role !== "junior") {
    return res.status(403).json({
      success: false,
      message: "Only junior doctors can apply to jobs",
      requiredRole: "junior",
      currentRole: req.user.role,
    });
  }
  next();
};

// Check if user can manage specific job (job owner only)
exports.canManageJob = async (req, res, next) => {
  try {
    const jobId = req.params.id || req.params.jobId;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check job ownership
    if (job.posted_by.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage this job",
        reason: "You can only manage jobs that you have posted",
      });
    }

    // Attach job to request for use in controller
    req.job = job;
    next();
  } catch (error) {
    console.error("Error in canManageJob middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error during job authorization",
    });
  }
};

// Check if user can manage specific application
exports.canManageApplication = async (req, res, next) => {
  try {
    const applicationId = req.params.id || req.params.applicationId;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const application = await Application.findById(applicationId).populate(
      "job_id",
      "posted_by",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is the applicant, job owner, or admin
    const isApplicant = application.applicant_id.toString() === req.user.id;
    const isJobOwner = application.job_id.posted_by.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isApplicant && !isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage this application",
        reason: "You can only manage applications you submitted or received",
      });
    }

    // Attach application and roles to request
    req.application = application;
    req.isApplicant = isApplicant;
    req.isJobOwner = isJobOwner;
    req.isAdmin = isAdmin;

    next();
  } catch (error) {
    console.error("Error in canManageApplication middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error during application authorization",
    });
  }
};

// Check if user can view specific job (considering visibility settings)
exports.canViewJob = async (req, res, next) => {
  try {
    const jobId = req.params.id || req.params.jobId;
    const job = await Job.findById(jobId).populate(
      "posted_by",
      "verificationStatus",
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Public jobs can be viewed by anyone
    if (job.visibility === "public") {
      req.job = job;
      return next();
    }

    // Check if user is authenticated for non-public jobs
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to view this job",
        jobVisibility: job.visibility,
      });
    }

    // Verified only jobs require verified account
    if (job.visibility === "verified_only") {
      if (req.user.verificationStatus?.overall !== "verified") {
        return res.status(403).json({
          success: false,
          message: "Verified account required to view this job",
          userVerificationStatus:
            req.user.verificationStatus?.overall || "unverified",
        });
      }
    }

    // Invited only jobs (future implementation for direct invitations)
    if (job.visibility === "invited_only") {
      const isJobOwner = job.posted_by._id.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isJobOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "This is a private job posting",
        });
      }
    }

    req.job = job;
    next();
  } catch (error) {
    console.error("Error in canViewJob middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error during job visibility check",
    });
  }
};

// Check if user can apply to specific job
exports.canApplyToSpecificJob = async (req, res, next) => {
  try {
    // First check if user can apply to jobs in general
    if (req.user.role !== "junior") {
      return res.status(403).json({
        success: false,
        message: "Only junior doctors can apply to jobs",
      });
    }

    const jobId = req.body.job_id || req.params.jobId;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is accepting applications
    if (job.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This job is not currently accepting applications",
        jobStatus: job.status,
      });
    }

    // Check if deadline has passed
    if (job.isExpired) {
      return res.status(400).json({
        success: false,
        message: "The application deadline for this job has passed",
        deadline: job.timeline.deadline,
      });
    }

    // Check if user already applied (exclude withdrawn applications - they can reapply)
    const existingApplication = await Application.findOne({
      job_id: jobId,
      applicant_id: req.user.id,
      status: { $ne: "withdrawn" }, // Allow reapplication after withdrawal
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
        applicationStatus: existingApplication.status,
        appliedAt: existingApplication.createdAt,
      });
    }

    // Check job-specific eligibility
    const eligibility = req.user.canApplyToJob(job);
    if (!eligibility.canApply) {
      return res.status(400).json({
        success: false,
        message: "You are not eligible to apply to this job",
        reasons: eligibility.reasons || ["Requirements not met"],
      });
    }

    req.job = job;
    next();
  } catch (error) {
    console.error("Error in canApplyToSpecificJob middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error during job application eligibility check",
    });
  }
};

// Check if user has active subscription (for premium features)
exports.requireActiveSubscription = (req, res, next) => {
  if (!req.user.subscription || !req.user.subscription.isActive) {
    return res.status(403).json({
      success: false,
      message: "Active subscription required for this feature",
      subscriptionStatus: req.user.subscription?.status || "none",
      upgradeRequired: true,
    });
  }
  next();
};

// Check if user can perform bulk operations
exports.canPerformBulkOperations = (req, res, next) => {
  const isAdmin = req.user.role === "admin";
  const hasBulkOperations = req.user.subscription?.hasFeature("bulkOperations");

  if (!hasBulkOperations && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Bulk operations require Professional plan or higher",
      currentPlan: req.user.subscription?.planId || "free",
      requiredFeature: "bulkOperations",
      upgradeRequired: true,
    });
  }
  next();
};

// Rate limiting for job posting (prevent spam)
exports.checkJobPostingLimit = async (req, res, next) => {
  try {
    // Fetch fresh subscription data from database to ensure we have latest usage
    const Subscription = require("../models/Subscription");
    const subscription = await Subscription.findOne({ userId: req.user.id });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Subscription information not available",
      });
    }

    // Check usage limits from subscription - direct property access
    const jobPostingsUsage = subscription.usage?.jobPostings;

    if (!jobPostingsUsage) {
      // If no usage tracking exists, allow the operation (free tier default)
      return next();
    }

    const limit = jobPostingsUsage.limit || 0;
    const used = jobPostingsUsage.used || 0;
    const remaining = limit - used;

    // Check if user has reached their limit
    if (remaining <= 0 && limit !== -1) {
      // -1 means unlimited
      return res.status(429).json({
        success: false,
        message: "Job posting limit reached for your plan",
        limit: limit,
        used: used,
        remaining: 0,
        currentPlan: subscription.planId,
        upgradeInfo:
          subscription.planId !== "enterprise"
            ? {
                message: "Upgrade your subscription for higher limits",
                nextPlan:
                  subscription.planId === "free"
                    ? "basic"
                    : subscription.planId === "basic"
                      ? "professional"
                      : "enterprise",
              }
            : null,
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkJobPostingLimit middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error during rate limit check",
    });
  }
};

// Rate limiting for job applications (prevent spam applications)
exports.checkApplicationLimit = async (req, res, next) => {
  try {
    const subscription = req.user.subscription;

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Subscription information not available",
      });
    }

    // Check usage limits from subscription - direct property access
    const jobApplicationsUsage = subscription.usage?.jobApplications;

    if (!jobApplicationsUsage) {
      // If no usage tracking exists, allow the operation (free tier default)
      return next();
    }

    const limit = jobApplicationsUsage.limit || 0;
    const used = jobApplicationsUsage.used || 0;
    const remaining = limit - used;

    // Check if user has reached their limit
    if (remaining <= 0 && limit !== -1) {
      // -1 means unlimited
      return res.status(429).json({
        success: false,
        message: "Job application limit reached for your plan",
        limit: limit,
        used: used,
        remaining: 0,
        currentPlan: subscription.planId,
        upgradeInfo:
          subscription.planId !== "enterprise"
            ? {
                message: "Upgrade your subscription for higher limits",
                nextPlan:
                  subscription.planId === "free"
                    ? "basic"
                    : subscription.planId === "basic"
                      ? "professional"
                      : "enterprise",
              }
            : null,
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkApplicationLimit middleware:", error);
    res.status(500).json({
      success: false,
      message: "Server error during application rate limit check",
    });
  }
};

// Check if user can access premium job features
exports.requirePremiumAccess = (req, res, next) => {
  const isPremium =
    req.user.subscription?.planId === "professional" ||
    req.user.subscription?.planId === "enterprise";
  const isAdmin = req.user.role === "admin";

  if (!isPremium && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Professional or Enterprise plan required for this feature",
      currentPlan: req.user.subscription?.planId || "free",
      requiredPlan: "professional",
    });
  }

  next();
};

// Validate job status transitions
exports.validateJobStatusTransition = (req, res, next) => {
  const { status } = req.body;
  const currentStatus = req.job.status;

  const validTransitions = {
    draft: ["draft", "active", "closed"], // Allow updating drafts
    active: ["paused", "closed", "completed"],
    paused: ["active", "closed"],
    closed: ["active"], // Can reopen if needed
    completed: [], // Final state
  };

  if (status && !validTransitions[currentStatus]?.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change job status from ${currentStatus} to ${status}`,
      currentStatus,
      allowedTransitions: validTransitions[currentStatus] || [],
    });
  }

  next();
};

// Validate application status transitions
exports.validateApplicationStatusTransition = (req, res, next) => {
  const { status } = req.body;
  const currentStatus = req.application.status;

  const validTransitions = {
    draft: ["submitted", "withdrawn"],
    submitted: ["under_review", "rejected", "withdrawn"],
    under_review: ["shortlisted", "rejected"],
    shortlisted: ["interview_scheduled", "accepted", "rejected"],
    interview_scheduled: ["accepted", "rejected"],
    accepted: ["completed"],
    completed: [], // Final state
    rejected: [], // Final state
    withdrawn: [], // Final state
  };

  if (status && !validTransitions[currentStatus]?.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change application status from ${currentStatus} to ${status}`,
      currentStatus,
      allowedTransitions: validTransitions[currentStatus] || [],
    });
  }

  next();
};
