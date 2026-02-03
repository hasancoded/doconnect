// server/models/Job.js - Complete Job Posting Schema
const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
      trim: true,
      minlength: [50, "Description must be at least 50 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
      enum: {
        values: [
          "consultation",
          "research",
          "documentation",
          "review",
          "telemedicine",
        ],
        message:
          "Category must be one of: consultation, research, documentation, review, telemedicine",
      },
    },
    specialty: {
      type: String,
      required: function () {
        return this.status !== "draft";
      },
      trim: true,
    },
    subSpecialties: [
      {
        type: String,
        trim: true,
      },
    ],
    skills_required: [
      {
        type: String,
        trim: true,
      },
    ],
    experience_required: {
      minimum_years: {
        type: Number,
        required: function () {
          // For updates, check if status is or will be draft
          if (this.isNew) {
            return this.status !== "draft";
          }
          // During update, don't require if current status is draft
          return this.status !== "draft";
        },
        min: [0, "Minimum years cannot be negative"],
        max: [50, "Minimum years seems too high"],
      },
      level: {
        type: String,
        required: function () {
          // For updates, check if status is or will be draft
          if (this.isNew) {
            return this.status !== "draft";
          }
          // During update, don't require if current status is draft
          return this.status !== "draft";
        },
        enum: {
          values: ["resident", "junior", "mid-level", "senior", "attending"],
          message:
            "Experience level must be one of: resident, junior, mid-level, senior, attending",
        },
      },
    },
    budget: {
      type: {
        type: String,
        required: function () {
          return this.status !== "draft";
        },
        enum: {
          values: ["fixed", "hourly", "negotiable"],
          message: "Budget type must be one of: fixed, hourly, negotiable",
        },
      },
      amount: {
        type: Number,
        required: function () {
          // During updates, this.budget might not be fully populated
          // Only require amount if status is not draft AND budget type is not negotiable
          if (this.status === "draft") return false;
          // Safely check budget.type - if it doesn't exist, don't require amount
          return (
            this.budget && this.budget.type && this.budget.type !== "negotiable"
          );
        },
        min: [0, "Budget amount cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
      },
      negotiable: {
        type: Boolean,
        default: false,
      },
    },
    timeline: {
      estimated_hours: {
        type: Number,
        min: [1, "Estimated hours must be at least 1"],
        max: [1000, "Estimated hours seems too high"],
      },
      deadline: {
        type: Date,
        required: function () {
          return this.status !== "draft";
        },
        validate: {
          validator: function (value) {
            // Skip validation for drafts
            if (this.status === "draft") return true;
            return value > new Date();
          },
          message: "Deadline must be in the future",
        },
      },
      start_date: {
        type: Date,
        default: Date.now,
      },
      flexible: {
        type: Boolean,
        default: false,
      },
    },
    requirements: {
      certifications: [
        {
          type: String,
          trim: true,
        },
      ],
      licenses: [
        {
          type: String,
          trim: true,
        },
      ],
      languages: [
        {
          type: String,
          trim: true,
        },
      ],
      location_preference: {
        type: String,
        enum: ["remote", "onsite", "hybrid"],
        default: "remote",
      },
      timezone_preference: {
        type: String,
        default: "flexible",
      },
      equipment_needed: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "active", "paused", "closed", "completed"],
        message:
          "Status must be one of: draft, active, paused, closed, completed",
      },
      default: "draft",
    },
    visibility: {
      type: String,
      enum: {
        values: ["public", "verified_only", "invited_only"],
        message:
          "Visibility must be one of: public, verified_only, invited_only",
      },
      default: "public",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    applications_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    views_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    analytics: {
      average_proposal_amount: {
        type: Number,
        default: 0,
      },
      proposal_range: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
      application_sources: {
        type: Map,
        of: Number,
        default: new Map(),
      },
    },
    matching_criteria: {
      auto_match: {
        type: Boolean,
        default: true,
      },
      match_threshold: {
        type: Number,
        min: 0,
        max: 100,
        default: 70,
      },
      preferred_experience: [
        {
          type: String,
          trim: true,
        },
      ],
      deal_breakers: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    // SEO and Discovery
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    searchKeywords: [String], // Auto-generated from job data
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
JobSchema.index({ posted_by: 1 });
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ category: 1, specialty: 1 });
JobSchema.index({ "budget.amount": 1 });
JobSchema.index({ "timeline.deadline": 1 });
JobSchema.index({ featured: -1, createdAt: -1 });
JobSchema.index({ visibility: 1, status: 1 });

// Text search index
JobSchema.index({
  title: "text",
  description: "text",
  specialty: "text",
  skills_required: "text",
  searchKeywords: "text",
});

// Virtual for time remaining
JobSchema.virtual("timeRemaining").get(function () {
  if (!this.timeline.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.timeline.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for is expired
JobSchema.virtual("isExpired").get(function () {
  if (!this.timeline.deadline) return false;
  return new Date() > new Date(this.timeline.deadline);
});

// Pre-save middleware to generate slug
JobSchema.pre("save", async function (next) {
  // Skip slug generation for drafts or if title is empty
  if (this.status === "draft" || !this.title) {
    return next();
  }

  if (!this.isModified("title") && this.slug) {
    return next();
  }

  try {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs and make unique
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
    next();
  } catch (error) {
    console.error("Error generating slug:", error);
    next(error);
  }
});

// Pre-save middleware to generate search keywords
JobSchema.pre("save", function (next) {
  const keywords = [];

  // Add title words
  if (this.title) {
    keywords.push(...this.title.toLowerCase().split(/\s+/));
  }

  // Add specialty and subspecialties
  if (this.specialty) {
    keywords.push(this.specialty.toLowerCase());
  }
  if (this.subSpecialties && this.subSpecialties.length > 0) {
    keywords.push(...this.subSpecialties.map((s) => s.toLowerCase()));
  }

  // Add skills
  if (this.skills_required && this.skills_required.length > 0) {
    keywords.push(...this.skills_required.map((s) => s.toLowerCase()));
  }

  // Add category
  if (this.category) {
    keywords.push(this.category.toLowerCase());
  }

  // Remove duplicates and empty strings
  this.searchKeywords = [...new Set(keywords.filter((k) => k && k.length > 2))];
  next();
});

// Method to track job view
JobSchema.methods.addView = async function () {
  this.views_count += 1;
  await this.save();
};

// Method to update applications count
JobSchema.methods.updateApplicationsCount = async function () {
  const Application = mongoose.model("Application");
  this.applications_count = await Application.countDocuments({
    job_id: this._id,
    status: { $nin: ["withdrawn"] },
  });
  await this.save();
};

// Method to update analytics
JobSchema.methods.updateAnalytics = async function () {
  const Application = mongoose.model("Application");
  const applications = await Application.find({
    job_id: this._id,
    status: { $nin: ["withdrawn", "draft"] },
  });

  if (applications.length > 0) {
    const proposalAmounts = applications
      .map((app) => app.proposal.proposed_budget)
      .filter((amount) => amount && amount > 0);

    if (proposalAmounts.length > 0) {
      this.analytics.average_proposal_amount =
        proposalAmounts.reduce((sum, amount) => sum + amount, 0) /
        proposalAmounts.length;
      this.analytics.proposal_range.min = Math.min(...proposalAmounts);
      this.analytics.proposal_range.max = Math.max(...proposalAmounts);
    }
  }

  await this.save();
};

// Static method to find active jobs
JobSchema.statics.findActive = function () {
  return this.find({
    status: "active",
    "timeline.deadline": { $gt: new Date() },
  });
};

// Static method for job search with filters
JobSchema.statics.searchJobs = function (searchTerm, filters = {}) {
  let query = { status: "active" };

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.specialty) {
    query.$or = [
      { specialty: { $regex: filters.specialty, $options: "i" } },
      { subSpecialties: { $regex: filters.specialty, $options: "i" } },
    ];
  }

  if (filters.experience_level) {
    query["experience_required.level"] = filters.experience_level;
  }

  if (filters.budget_min || filters.budget_max) {
    query["budget.amount"] = {};
    if (filters.budget_min) query["budget.amount"].$gte = filters.budget_min;
    if (filters.budget_max) query["budget.amount"].$lte = filters.budget_max;
  }

  if (filters.remote_only) {
    query["requirements.location_preference"] = { $in: ["remote", "hybrid"] };
  }

  if (filters.deadline_days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(filters.deadline_days));
    query["timeline.deadline"] = { $lte: futureDate };
  }

  // Sort options
  let sortOptions = {};
  if (searchTerm) {
    sortOptions.score = { $meta: "textScore" };
  }
  if (filters.sortBy === "budget_high") {
    sortOptions["budget.amount"] = -1;
  } else if (filters.sortBy === "budget_low") {
    sortOptions["budget.amount"] = 1;
  } else if (filters.sortBy === "deadline") {
    sortOptions["timeline.deadline"] = 1;
  } else if (filters.sortBy === "recent") {
    sortOptions.createdAt = -1;
  } else {
    sortOptions.createdAt = -1; // Default sort
  }

  return this.find(query).sort(sortOptions);
};

module.exports = mongoose.model("Job", JobSchema);
