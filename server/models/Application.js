// server/models/Application.js - Complete Application Schema
const mongoose = require("mongoose");

const CommunicationLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["message", "interview", "status_change", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, "Communication content cannot exceed 1000 characters"],
  },
  from: {
    type: String,
    enum: ["employer", "applicant", "system"],
    required: true,
  },
});

const MilestoneSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, "Milestone description cannot exceed 500 characters"],
  },
  due_date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, "Milestone amount cannot be negative"],
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "overdue"],
    default: "pending",
  },
  completed_date: Date,
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Notes cannot exceed 1000 characters"],
  },
});

const ApplicationSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    applicant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant ID is required"],
    },
    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "submitted",
          "under_review",
          "shortlisted",
          "interview_scheduled",
          "accepted",
          "rejected",
          "withdrawn",
          "completed",
        ],
        message: "Invalid application status",
      },
      default: "draft",
    },
    proposal: {
      cover_letter: {
        type: String,
        required: function () {
          return this.status !== "draft";
        },
        trim: true,
        minlength: [100, "Cover letter must be at least 100 characters"],
        maxlength: [1000, "Cover letter cannot exceed 1000 characters"],
      },
      approach: {
        type: String,
        required: function () {
          return this.status !== "draft";
        },
        trim: true,
        minlength: [50, "Approach description must be at least 50 characters"],
        maxlength: [1500, "Approach description cannot exceed 1500 characters"],
      },
      timeline_days: {
        type: Number,
        required: function () {
          return this.status !== "draft";
        },
        min: [1, "Timeline must be at least 1 day"],
        max: [365, "Timeline cannot exceed 365 days"],
      },
      proposed_budget: {
        type: Number,
        required: function () {
          return this.status !== "draft";
        },
        min: [0, "Proposed budget cannot be negative"],
      },
      availability: {
        start_date: {
          type: Date,
          required: function () {
            return this.status !== "draft";
          },
          validate: {
            validator: function (value) {
              return value >= new Date();
            },
            message: "Start date must be in the future",
          },
        },
        hours_per_week: {
          type: Number,
          min: [1, "Hours per week must be at least 1"],
          max: [168, "Hours per week cannot exceed 168"],
        },
        preferred_schedule: {
          type: String,
          trim: true,
          maxlength: [200, "Schedule preference cannot exceed 200 characters"],
        },
      },
      relevant_experience: {
        type: String,
        trim: true,
        maxlength: [1500, "Relevant experience cannot exceed 1500 characters"],
      },
      portfolio_items: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User.experiences", // Reference to user's experience items
        },
      ],
      questions_for_employer: {
        type: String,
        trim: true,
        maxlength: [500, "Questions cannot exceed 500 characters"],
      },
    },
    match_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    employer_notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Employer notes cannot exceed 2000 characters"],
    },
    applicant_notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Applicant notes cannot exceed 2000 characters"],
    },
    communication_log: [CommunicationLogSchema],
    interview_details: {
      scheduled_date: Date,
      meeting_link: {
        type: String,
        trim: true,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [2000, "Interview notes cannot exceed 2000 characters"],
      },
      completed: {
        type: Boolean,
        default: false,
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    contract_details: {
      agreed_budget: {
        type: Number,
        min: [0, "Agreed budget cannot be negative"],
      },
      agreed_timeline: {
        type: Number,
        min: [1, "Agreed timeline must be at least 1 day"],
      },
      milestones: [MilestoneSchema],
      signed_date: Date,
      contract_terms: {
        type: String,
        trim: true,
        maxlength: [3000, "Contract terms cannot exceed 3000 characters"],
      },
    },
    // Feedback and Rating (after completion)
    feedback: {
      employer_rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      employer_review: {
        type: String,
        trim: true,
        maxlength: [1000, "Review cannot exceed 1000 characters"],
      },
      applicant_rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      applicant_review: {
        type: String,
        trim: true,
        maxlength: [1000, "Review cannot exceed 1000 characters"],
      },
    },
    // Payment tracking
    payment_details: {
      total_amount: {
        type: Number,
        default: 0,
      },
      amount_paid: {
        type: Number,
        default: 0,
      },
      payment_schedule: [
        {
          amount: Number,
          due_date: Date,
          paid: { type: Boolean, default: false },
          paid_date: Date,
          payment_method: String,
        },
      ],
    },
    // Metadata
    submitted_at: Date,
    reviewed_at: Date,
    decision_made_at: Date,
    completed_at: Date,
    source: {
      type: String,
      enum: ["search", "recommendation", "direct", "referral"],
      default: "search",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for performance
ApplicationSchema.index({ job_id: 1, applicant_id: 1 }, { unique: true });
ApplicationSchema.index({ applicant_id: 1, status: 1 });
ApplicationSchema.index({ job_id: 1, match_score: -1 });
ApplicationSchema.index({ job_id: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1, createdAt: -1 });

// Virtual for days since application
ApplicationSchema.virtual("daysSinceApplication").get(function () {
  if (!this.createdAt) return 0;
  const diffTime = new Date() - new Date(this.createdAt);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for application progress percentage
ApplicationSchema.virtual("progressPercentage").get(function () {
  const statusProgress = {
    draft: 0,
    submitted: 15,
    under_review: 30,
    shortlisted: 50,
    interview_scheduled: 70,
    accepted: 85,
    completed: 100,
    rejected: 0,
    withdrawn: 0,
  };
  return statusProgress[this.status] || 0;
});

// Virtual for is active
ApplicationSchema.virtual("isActive").get(function () {
  return !["rejected", "withdrawn", "completed"].includes(this.status);
});

// Pre-save middleware to set timestamps
ApplicationSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case "submitted":
        if (!this.submitted_at) this.submitted_at = now;
        break;
      case "under_review":
        if (!this.reviewed_at) this.reviewed_at = now;
        break;
      case "accepted":
      case "rejected":
        if (!this.decision_made_at) this.decision_made_at = now;
        break;
      case "completed":
        if (!this.completed_at) this.completed_at = now;
        break;
    }

    // Add system communication log entry for status changes
    if (this.status !== "draft") {
      this.communication_log.push({
        type: "status_change",
        content: `Application status changed to ${this.status}`,
        from: "system",
      });
    }
  }
  next();
});

// Pre-save middleware to update job applications count
ApplicationSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.isNew === false) {
    try {
      const Job = mongoose.model("Job");
      await Job.findByIdAndUpdate(this.job_id, {}, { runValidators: false });
    } catch (error) {
      console.error("Error updating job applications count:", error);
    }
  }
  next();
});

// Method to add communication log entry
ApplicationSchema.methods.addCommunication = function (type, content, from) {
  this.communication_log.push({
    type,
    content,
    from,
    date: new Date(),
  });
  return this.save();
};

// Method to calculate match score
ApplicationSchema.methods.calculateMatchScore = async function () {
  try {
    const Job = mongoose.model("Job");
    const User = mongoose.model("User");

    const job = await Job.findById(this.job_id);
    const applicant = await User.findById(this.applicant_id);

    if (!job || !applicant) {
      this.match_score = 0;
      return 0;
    }

    let score = 0;
    let maxScore = 100;

    // Specialty alignment (40% weight)
    if (
      applicant.primarySpecialty.toLowerCase() === job.specialty.toLowerCase()
    ) {
      score += 40;
    } else if (
      applicant.subspecialties.some(
        (sub) =>
          sub.toLowerCase().includes(job.specialty.toLowerCase()) ||
          job.specialty.toLowerCase().includes(sub.toLowerCase())
      )
    ) {
      score += 20;
    }

    // Experience level match (25% weight)
    const experienceLevels = {
      resident: 1,
      junior: 2,
      "mid-level": 3,
      senior: 4,
      attending: 5,
    };

    const applicantLevel =
      applicant.yearsOfExperience < 2
        ? "resident"
        : applicant.yearsOfExperience < 5
        ? "junior"
        : applicant.yearsOfExperience < 10
        ? "mid-level"
        : applicant.yearsOfExperience < 20
        ? "senior"
        : "attending";

    const requiredLevel = job.experience_required.level;
    const applicantScore = experienceLevels[applicantLevel] || 1;
    const requiredScore = experienceLevels[requiredLevel] || 1;

    if (applicantScore >= requiredScore) {
      score += 25;
    } else if (applicantScore === requiredScore - 1) {
      score += 15;
    } else if (applicantScore === requiredScore - 2) {
      score += 5;
    }

    // Skills overlap (20% weight)
    if (
      job.skills_required &&
      job.skills_required.length > 0 &&
      applicant.skills
    ) {
      const jobSkills = job.skills_required.map((skill) => skill.toLowerCase());
      const applicantSkills = applicant.skills.map((skill) =>
        skill.name.toLowerCase()
      );
      const matchingSkills = jobSkills.filter((skill) =>
        applicantSkills.some(
          (appSkill) => appSkill.includes(skill) || skill.includes(appSkill)
        )
      );
      const skillsScore = (matchingSkills.length / jobSkills.length) * 20;
      score += skillsScore;
    } else {
      score += 10; // Default partial score if no specific skills required
    }

    // Years of experience (10% weight)
    if (applicant.yearsOfExperience >= job.experience_required.minimum_years) {
      score += 10;
    } else {
      const experienceRatio =
        applicant.yearsOfExperience / job.experience_required.minimum_years;
      score += experienceRatio * 10;
    }

    // Location preference (5% weight)
    if (
      job.requirements.location_preference === "remote" ||
      applicant.preferences?.remoteOnly === true
    ) {
      score += 5;
    } else {
      score += 2;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, Math.round(score)));
    this.match_score = score;

    return score;
  } catch (error) {
    console.error("Error calculating match score:", error);
    this.match_score = 0;
    return 0;
  }
};

// Method to check if user can modify application
ApplicationSchema.methods.canModify = function (userId, userRole) {
  if (userRole === "admin") return true;

  // Applicants can modify draft applications
  if (this.applicant_id.toString() === userId.toString()) {
    return this.status === "draft";
  }

  // Employers can view and manage applications for their jobs
  return false; // This will be checked at the job level
};

// Method to get public application data (for employer view)
ApplicationSchema.methods.getEmployerView = function () {
  const publicData = this.toObject();
  delete publicData.applicant_notes;
  delete publicData.payment_details;
  return publicData;
};

// Method to get public application data (for applicant view)
ApplicationSchema.methods.getApplicantView = function () {
  const publicData = this.toObject();
  delete publicData.employer_notes;
  return publicData;
};

// Static method to find applications by job with pagination
ApplicationSchema.statics.findByJob = function (jobId, options = {}) {
  const { page = 1, limit = 20, status, sortBy = "createdAt" } = options;

  let query = { job_id: jobId };
  if (status) query.status = status;

  const sortOptions = {};
  if (sortBy === "match_score") {
    sortOptions.match_score = -1;
  } else if (sortBy === "budget") {
    sortOptions["proposal.proposed_budget"] = -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate(
      "applicant_id",
      "firstName lastName profilePhoto rating verificationStatus"
    )
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

// Static method to find applications by user
ApplicationSchema.statics.findByUser = function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    sortBy = "createdAt",
    job_id,
  } = options;

  let query = { applicant_id: userId };
  if (status) query.status = status;
  if (job_id) query.job_id = job_id; // Filter by specific job if provided

  const sortOptions = {};
  if (sortBy === "deadline") {
    sortOptions["job.timeline.deadline"] = 1;
  } else {
    sortOptions.createdAt = -1;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate({
      path: "job_id",
      select: "title category specialty budget timeline status posted_by",
      populate: {
        path: "posted_by",
        select: "firstName lastName email",
      },
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model("Application", ApplicationSchema);
