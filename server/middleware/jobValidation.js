// server/middleware/jobValidation.js - Complete Job Validation Rules
const { body, query, param } = require("express-validator");

// Job posting validation rules
exports.validateJobCreation = [
  // Skip validation for drafts
  body("title")
    .if(body("status").not().equals("draft"))
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage("Title must be between 10 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-\.\,\:\;]+$/)
    .withMessage("Title contains invalid characters"),

  body("description")
    .if(body("status").not().equals("draft"))
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage("Description must be between 50 and 2000 characters"),

  body("category")
    .if(body("status").not().equals("draft"))
    .isIn([
      "consultation",
      "research",
      "documentation",
      "review",
      "telemedicine",
    ])
    .withMessage(
      "Category must be one of: consultation, research, documentation, review, telemedicine"
    ),

  body("specialty")
    .if(body("status").not().equals("draft"))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Specialty is required and must be between 2 and 100 characters"
    ),

  body("subSpecialties")
    .optional()
    .isArray()
    .withMessage("Sub-specialties must be an array"),

  body("subSpecialties.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Each sub-specialty must be between 2 and 100 characters"),

  body("skills_required")
    .optional()
    .isArray()
    .withMessage("Skills required must be an array"),

  body("skills_required.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Each skill must be between 2 and 100 characters"),

  body("experience_required.minimum_years")
    .if(body("status").not().equals("draft"))
    .isInt({ min: 0, max: 50 })
    .withMessage("Minimum years of experience must be between 0 and 50"),

  body("experience_required.level")
    .if(body("status").not().equals("draft"))
    .isIn(["resident", "junior", "mid-level", "senior", "attending"])
    .withMessage(
      "Experience level must be one of: resident, junior, mid-level, senior, attending"
    ),

  body("budget.type")
    .if(body("status").not().equals("draft"))
    .isIn(["fixed", "hourly", "negotiable"])
    .withMessage("Budget type must be one of: fixed, hourly, negotiable"),

  body("budget.amount")
    .if(body("status").not().equals("draft"))
    .if(body("budget.type").not().equals("negotiable"))
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Budget amount must be between 0 and 1,000,000"),

  body("budget.currency")
    .optional()
    .isIn(["USD", "EUR", "GBP", "CAD", "AUD"])
    .withMessage("Currency must be one of: USD, EUR, GBP, CAD, AUD"),

  body("timeline.estimated_hours")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Estimated hours must be between 1 and 1000"),

  body("timeline.deadline")
    .if(body("status").not().equals("draft"))
    .isISO8601()
    .withMessage("Deadline must be a valid date")
    .custom((value, { req }) => {
      // Skip for drafts
      if (req.body.status === "draft") return true;

      const deadline = new Date(value);
      const now = new Date();
      const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      if (deadline <= minDate) {
        throw new Error("Deadline must be at least 24 hours in the future");
      }

      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      if (deadline > maxDate) {
        throw new Error("Deadline cannot be more than 1 year in the future");
      }

      return true;
    }),

  body("timeline.start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("timeline.flexible")
    .optional()
    .isBoolean()
    .withMessage("Flexible must be a boolean value"),

  body("requirements.certifications")
    .optional()
    .isArray()
    .withMessage("Certifications must be an array"),

  body("requirements.certifications.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Each certification must be between 2 and 200 characters"),

  body("requirements.licenses")
    .optional()
    .isArray()
    .withMessage("Licenses must be an array"),

  body("requirements.licenses.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Each license must be between 2 and 100 characters"),

  body("requirements.languages")
    .optional()
    .isArray()
    .withMessage("Languages must be an array"),

  body("requirements.languages.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Each language must be between 2 and 50 characters"),

  body("requirements.location_preference")
    .optional()
    .isIn(["remote", "onsite", "hybrid"])
    .withMessage("Location preference must be one of: remote, onsite, hybrid"),

  body("requirements.timezone_preference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Timezone preference cannot exceed 100 characters"),

  body("requirements.equipment_needed")
    .optional()
    .isArray()
    .withMessage("Equipment needed must be an array"),

  body("requirements.equipment_needed.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Each equipment item must be between 2 and 200 characters"),

  body("visibility")
    .optional()
    .isIn(["public", "verified_only", "invited_only"])
    .withMessage(
      "Visibility must be one of: public, verified_only, invited_only"
    ),

  body("matching_criteria.auto_match")
    .optional()
    .isBoolean()
    .withMessage("Auto match must be a boolean value"),

  body("matching_criteria.match_threshold")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Match threshold must be between 0 and 100"),

  body("matching_criteria.preferred_experience")
    .optional()
    .isArray()
    .withMessage("Preferred experience must be an array"),

  body("matching_criteria.deal_breakers")
    .optional()
    .isArray()
    .withMessage("Deal breakers must be an array"),
];

// Job update validation (similar to creation but with optional fields)
exports.validateJobUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage("Title must be between 10 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-\.\,\:\;]+$/)
    .withMessage("Title contains invalid characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage("Description must be between 50 and 2000 characters"),

  body("category")
    .optional()
    .isIn([
      "consultation",
      "research",
      "documentation",
      "review",
      "telemedicine",
    ])
    .withMessage(
      "Category must be one of: consultation, research, documentation, review, telemedicine"
    ),

  body("specialty")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Specialty must be between 2 and 100 characters"),

  body("budget.amount")
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Budget amount must be between 0 and 1,000,000"),

  body("timeline.deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date"),

  body("status")
    .optional()
    .isIn(["draft", "active", "paused", "closed"])
    .withMessage("Status must be one of: draft, active, paused, closed"),
];

// Job search validation
exports.validateJobSearch = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search term must be between 2 and 100 characters"),

  query("page")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page must be between 1 and 100"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("category")
    .optional()
    .isIn([
      "consultation",
      "research",
      "documentation",
      "review",
      "telemedicine",
    ])
    .withMessage("Invalid category"),

  query("specialty")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Specialty must be between 2 and 100 characters"),

  query("experience_level")
    .optional()
    .isIn(["resident", "junior", "mid-level", "senior", "attending"])
    .withMessage("Invalid experience level"),

  query("budget_min")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget minimum must be a positive number"),

  query("budget_max")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget maximum must be a positive number"),

  query("remote_only")
    .optional()
    .isBoolean()
    .withMessage("Remote only must be a boolean value"),

  query("deadline_days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Deadline days must be between 1 and 365"),

  query("sortBy")
    .optional()
    .isIn([
      "relevance",
      "createdAt",
      "budget_high",
      "budget_low",
      "deadline",
      "recent",
    ])
    .withMessage("Invalid sort option"),
];

// Job ID parameter validation
exports.validateJobId = [
  param("id").isMongoId().withMessage("Invalid job ID format"),
];

// Application validation rules
exports.validateApplication = [
  body("job_id").isMongoId().withMessage("Invalid job ID format"),

  body("proposal.cover_letter")
    .trim()
    .isLength({ min: 100, max: 1000 })
    .withMessage("Cover letter must be between 100 and 1000 characters"),

  body("proposal.approach")
    .trim()
    .isLength({ min: 50, max: 1500 })
    .withMessage("Approach description must be between 50 and 1500 characters"),

  body("proposal.timeline_days")
    .isInt({ min: 1, max: 365 })
    .withMessage("Timeline must be between 1 and 365 days"),

  body("proposal.proposed_budget")
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Proposed budget must be between 0 and 1,000,000"),

  body("proposal.availability.start_date")
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      if (startDate < now) {
        throw new Error("Start date must be in the future");
      }
      return true;
    }),

  body("proposal.availability.hours_per_week")
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage("Hours per week must be between 1 and 168"),

  body("proposal.availability.preferred_schedule")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Preferred schedule cannot exceed 200 characters"),

  body("proposal.relevant_experience")
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Relevant experience cannot exceed 1500 characters"),

  body("proposal.questions_for_employer")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Questions for employer cannot exceed 500 characters"),

  body("applicant_notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Applicant notes cannot exceed 2000 characters"),

  body("source")
    .optional()
    .isIn(["search", "recommendation", "direct", "referral"])
    .withMessage(
      "Source must be one of: search, recommendation, direct, referral"
    ),
];

// Application status update validation
exports.validateApplicationStatusUpdate = [
  body("status")
    .isIn([
      "submitted",
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "accepted",
      "rejected",
      "withdrawn",
      "completed",
    ])
    .withMessage("Invalid application status"),

  body("employer_notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Employer notes cannot exceed 2000 characters"),

  body("rejection_reason")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Rejection reason must be between 10 and 500 characters"),
];

// Interview scheduling validation
exports.validateInterviewScheduling = [
  body("scheduled_date")
    .isISO8601()
    .withMessage("Interview date must be a valid date")
    .custom((value) => {
      const interviewDate = new Date(value);
      const now = new Date();
      const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      if (interviewDate <= minDate) {
        throw new Error(
          "Interview must be scheduled at least 2 hours in advance"
        );
      }

      const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      if (interviewDate > maxDate) {
        throw new Error(
          "Interview cannot be scheduled more than 30 days in advance"
        );
      }

      return true;
    }),

  body("meeting_link")
    .optional()
    .isURL()
    .withMessage("Meeting link must be a valid URL"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Interview notes cannot exceed 2000 characters"),
];

// Contract details validation
exports.validateContractDetails = [
  body("agreed_budget")
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Agreed budget must be between 0 and 1,000,000"),

  body("agreed_timeline")
    .isInt({ min: 1, max: 365 })
    .withMessage("Agreed timeline must be between 1 and 365 days"),

  body("milestones")
    .optional()
    .isArray()
    .withMessage("Milestones must be an array"),

  body("milestones.*.description")
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Milestone description must be between 5 and 500 characters"),

  body("milestones.*.due_date")
    .optional()
    .isISO8601()
    .withMessage("Milestone due date must be a valid date"),

  body("milestones.*.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Milestone amount must be a positive number"),

  body("contract_terms")
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage("Contract terms cannot exceed 3000 characters"),
];

// Message validation
exports.validateMessage = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
];

// Rating validation
exports.validateRating = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("review")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Review cannot exceed 1000 characters"),
];

// Application search/filter validation
exports.validateApplicationSearch = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page must be between 1 and 100"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("status")
    .optional()
    .isIn([
      "all",
      "submitted",
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "accepted",
      "rejected",
      "withdrawn",
      "completed",
    ])
    .withMessage("Invalid status filter"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "match_score", "budget", "deadline"])
    .withMessage("Invalid sort option"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be 'asc' or 'desc'"),
];

// Bulk operations validation
exports.validateBulkJobIds = [
  body("jobIds")
    .isArray({ min: 1, max: 20 })
    .withMessage("Job IDs must be an array with 1-20 items"),

  body("jobIds.*")
    .isMongoId()
    .withMessage("Each job ID must be a valid MongoDB ObjectId"),
];

// Job statistics query validation
exports.validateStatsQuery = [
  query("period")
    .optional()
    .isIn(["week", "month", "quarter", "year", "all"])
    .withMessage("Period must be one of: week, month, quarter, year, all"),

  query("category")
    .optional()
    .isIn([
      "consultation",
      "research",
      "documentation",
      "review",
      "telemedicine",
    ])
    .withMessage("Invalid category for statistics"),
];

// Advanced validation helpers
exports.validateJobOwnership = async (req, res, next) => {
  try {
    const Job = require("../models/Job");
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.posted_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this job",
      });
    }

    req.job = job;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during job ownership validation",
    });
  }
};

exports.validateApplicationOwnership = async (req, res, next) => {
  try {
    const Application = require("../models/Application");
    const application = await Application.findById(req.params.id).populate(
      "job_id",
      "posted_by"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const isApplicant = application.applicant_id.toString() === req.user.id;
    const isJobOwner = application.job_id.posted_by.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isApplicant && !isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this application",
      });
    }

    req.application = application;
    req.isApplicant = isApplicant;
    req.isJobOwner = isJobOwner;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during application ownership validation",
    });
  }
};
