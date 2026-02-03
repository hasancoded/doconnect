// server/models/User.js - Enhanced User Model
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ExperienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null, // null means current position
    },
    current: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["residency", "fellowship", "employment", "education"],
      required: true,
    },
  },
  { timestamps: true },
);

const CertificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    issuingOrganization: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expirationDate: {
      type: Date,
    },
    credentialId: {
      type: String,
      trim: true,
    },
    credentialUrl: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["clinical", "research", "administrative", "technical", "other"],
    default: "clinical",
  },
  proficiencyLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert"],
    default: "intermediate",
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

const ReviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project", // Future implementation
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    categories: {
      communication: { type: Number, min: 1, max: 5 },
      expertise: { type: Number, min: 1, max: 5 },
      reliability: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
    },
    helpful: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const AvailabilitySchema = new mongoose.Schema({
  timezone: {
    type: String,
    required: true,
    default: "UTC",
  },
  weeklySchedule: [
    {
      day: {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
        required: true,
      },
      available: {
        type: Boolean,
        default: true,
      },
      timeSlots: [
        {
          startTime: { type: String, required: true }, // Format: "09:00"
          endTime: { type: String, required: true }, // Format: "17:00"
        },
      ],
    },
  ],
  blackoutDates: [
    {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      reason: { type: String, trim: true },
    },
  ],
  hoursPerWeek: {
    type: Number,
    min: 0,
    max: 168,
    default: 40,
  },
  responseTime: {
    type: String,
    enum: ["immediate", "within-hour", "within-day", "within-week"],
    default: "within-day",
  },
});

const DocumentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "medical_license",
        "cv_resume",
        "certification",
        "identification",
        "other",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true, // Cloudinary public ID for deletion
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const ProfileAnalyticsSchema = new mongoose.Schema({
  views: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
  },
  profileViews: [
    {
      viewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      viewedAt: {
        type: Date,
        default: Date.now,
      },
      anonymousId: {
        type: String, // For tracking anonymous views
      },
    },
  ],
  searchAppearances: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
  },
  contactAttempts: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
  },
});

const UserSchema = new mongoose.Schema(
  {
    // Basic Information (existing)
    firstName: {
      type: String,
      required: [true, "Please provide first name"],
      trim: true,
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide last name"],
      trim: true,
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide email address"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["senior", "junior", "admin"],
      default: "junior",
    },

    // Medical Professional Information (existing + enhanced)
    medicalLicenseNumber: {
      type: String,
      required: [true, "Please provide medical license number"],
      unique: true,
      trim: true,
    },
    licenseState: {
      type: String,
      required: [true, "Please provide license state"],
      trim: true,
    },
    primarySpecialty: {
      type: String,
      required: [true, "Please provide primary specialty"],
      trim: true,
    },
    subspecialties: [
      {
        type: String,
        trim: true,
      },
    ],
    yearsOfExperience: {
      type: Number,
      required: [true, "Please provide years of experience"],
      min: [0, "Years of experience cannot be negative"],
      max: [50, "Years of experience seems too high"],
    },
    medicalSchool: {
      name: {
        type: String,
        required: [true, "Please provide medical school name"],
        trim: true,
      },
      graduationYear: {
        type: Number,
        required: [true, "Please provide graduation year"],
        min: [1950, "Graduation year seems too early"],
        max: [
          new Date().getFullYear(),
          "Graduation year cannot be in the future",
        ],
      },
      location: {
        type: String,
        trim: true,
      },
    },

    // Enhanced Profile Information
    profilePhoto: {
      url: String,
      publicId: String, // Cloudinary public ID
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, "Bio cannot be more than 2000 characters"],
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "United States" },
      timezone: { type: String, default: "America/New_York" },
    },
    languages: [
      {
        language: { type: String, required: true },
        proficiency: {
          type: String,
          enum: ["basic", "conversational", "fluent", "native"],
          default: "conversational",
        },
      },
    ],

    // Professional Experience
    experiences: [ExperienceSchema],
    certifications: [CertificationSchema],
    skills: [SkillSchema],

    // Documents and Verification
    documents: [DocumentSchema],
    verificationStatus: {
      identity: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      medical_license: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      background_check: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      overall: {
        type: String,
        enum: ["unverified", "partial", "verified"],
        default: "unverified",
      },
    },

    // Ratings and Reviews
    reviews: [ReviewSchema],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
      categories: {
        communication: { type: Number, default: 0 },
        expertise: { type: Number, default: 0 },
        reliability: { type: Number, default: 0 },
        professionalism: { type: Number, default: 0 },
      },
    },

    // Availability and Preferences
    availability: AvailabilitySchema,
    preferences: {
      projectTypes: [
        {
          type: String,
          enum: [
            "consultation",
            "second_opinion",
            "chart_review",
            "research",
            "writing",
            "teaching",
            "other",
          ],
        },
      ],
      minimumRate: { type: Number, min: 0 },
      preferredProjectDuration: {
        type: String,
        enum: ["short_term", "medium_term", "long_term", "flexible"],
      },
      remoteOnly: { type: Boolean, default: true },
      maxSimultaneousProjects: { type: Number, default: 3, min: 1, max: 10 },
    },

    // Job Preferences
    job_preferences: {
      seeking_opportunities: {
        type: Boolean,
        default: true,
      },
      preferred_categories: [
        {
          type: String,
          enum: [
            "consultation",
            "research",
            "documentation",
            "review",
            "telemedicine",
          ],
        },
      ],
      preferred_budget_range: {
        min: {
          type: Number,
          min: 0,
        },
        max: {
          type: Number,
          min: 0,
        },
      },
      preferred_timeline: {
        type: String,
        enum: ["urgent", "flexible", "long_term"],
        default: "flexible",
      },
      availability_hours_per_week: {
        type: Number,
        min: 0,
        max: 168,
        default: 20,
      },
      remote_work_preference: {
        type: String,
        enum: ["remote_only", "onsite_only", "flexible"],
        default: "remote_only",
      },
      notification_preferences: {
        new_jobs: { type: Boolean, default: true },
        job_matches: { type: Boolean, default: true },
        application_updates: { type: Boolean, default: true },
      },
    },

    // Profile Analytics
    analytics: ProfileAnalyticsSchema,

    // Job Statistics
    job_statistics: {
      // For Senior Doctors (Employers)
      jobs_posted: {
        type: Number,
        default: 0,
        min: 0,
      },
      jobs_completed: {
        type: Number,
        default: 0,
        min: 0,
      },
      total_spent: {
        type: Number,
        default: 0,
        min: 0,
      },

      // For Junior Doctors (Job Seekers)
      applications_submitted: {
        type: Number,
        default: 0,
        min: 0,
      },
      applications_accepted: {
        type: Number,
        default: 0,
        min: 0,
      },
      total_earnings: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Common Statistics
      projects_completed: {
        type: Number,
        default: 0,
        min: 0,
      },
      success_rate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      average_project_rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      response_time_hours: {
        type: Number,
        default: 24,
        min: 0,
      },
    },

    // Profile Completion
    profileCompletion: {
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      completedSteps: { type: Number, default: 0 },
      totalSteps: { type: Number, default: 8 },
      missingSections: [{ type: String }],
      lastUpdated: { type: Date, default: Date.now },
    },

    // Account Status and Subscription
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "canceled", "past_due", "trialing"],
        default: "active",
      },
      stripeCustomerId: String,
      currentPeriodEnd: Date,
    },

    // Privacy and Settings
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "members_only", "private"],
        default: "members_only",
      },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowDirectContact: { type: Boolean, default: true },
      showLastSeen: { type: Boolean, default: true },
    },

    // Online Status and Presence
    onlineStatus: {
      status: {
        type: String,
        enum: ["online", "away", "offline"],
        default: "offline",
      },
      lastSeen: {
        type: Date,
        default: Date.now,
      },
    },
    socketId: {
      type: String,
      default: null,
    },

    // Notification Preferences
    notificationPreferences: {
      email: {
        newMessage: { type: Boolean, default: true },
        jobApplication: { type: Boolean, default: true },
        applicationStatus: { type: Boolean, default: true },
        jobMatch: { type: Boolean, default: true },
        profileView: { type: Boolean, default: false },
        reviewReceived: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
      },
      push: {
        newMessage: { type: Boolean, default: true },
        jobApplication: { type: Boolean, default: true },
        applicationStatus: { type: Boolean, default: true },
        jobMatch: { type: Boolean, default: true },
        highPriority: { type: Boolean, default: true },
      },
      inApp: {
        all: { type: Boolean, default: true },
        sound: { type: Boolean, default: true },
        desktop: { type: Boolean, default: false },
      },
    },

    // Activity Tracking
    lastActive: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // SEO and Discovery
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    featuredProfile: {
      type: Boolean,
      default: false,
    },
    searchKeywords: [String], // Auto-generated from profile data
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance (removed duplicates - unique fields auto-index)
// UserSchema.index({ email: 1 }); // Already indexed by unique: true
// UserSchema.index({ medicalLicenseNumber: 1 }); // Already indexed by unique: true
// UserSchema.index({ slug: 1 }); // Already indexed by unique: true
UserSchema.index({ "rating.average": -1 });
UserSchema.index({ "verificationStatus.overall": 1 });
UserSchema.index({ accountStatus: 1 });
UserSchema.index({ primarySpecialty: 1 });
UserSchema.index({ "location.city": 1, "location.state": 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActive: -1 });

// Text search index
UserSchema.index({
  firstName: "text",
  lastName: "text",
  primarySpecialty: "text",
  subspecialties: "text",
  bio: "text",
  "skills.name": "text",
  searchKeywords: "text",
});

// Indexes for job-related queries
UserSchema.index({ "job_preferences.preferred_categories": 1 });
UserSchema.index({ "job_preferences.seeking_opportunities": 1 });
UserSchema.index({ "job_statistics.success_rate": -1 });
UserSchema.index({ "job_statistics.average_project_rating": -1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name with credentials
UserSchema.virtual("displayName").get(function () {
  const degree = this.role === "senior" ? "MD" : "MD";
  return `Dr. ${this.firstName} ${this.lastName}, ${degree}`;
});

// Virtual for profile completion percentage calculation
UserSchema.virtual("calculatedProfileCompletion").get(function () {
  let completionScore = 0;
  const sections = {
    basic_info:
      this.firstName && this.lastName && this.email && this.phone ? 15 : 0,
    medical_info:
      this.medicalLicenseNumber &&
      this.primarySpecialty &&
      this.medicalSchool.name
        ? 15
        : 0,
    profile_photo: this.profilePhoto && this.profilePhoto.url ? 10 : 0,
    bio: this.bio && this.bio.length > 100 ? 10 : 0,
    experience: this.experiences && this.experiences.length > 0 ? 15 : 0,
    skills: this.skills && this.skills.length >= 3 ? 10 : 0,
    certifications:
      this.certifications && this.certifications.length > 0 ? 10 : 0,
    documents: this.documents && this.documents.length > 0 ? 10 : 0,
    availability: this.availability && this.availability.weeklySchedule ? 5 : 0,
  };

  completionScore = Object.values(sections).reduce(
    (sum, score) => sum + score,
    0,
  );
  return Math.min(completionScore, 100);
});

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Pre-save middleware to generate slug
UserSchema.pre("save", async function (next) {
  if (
    !this.isModified("firstName") &&
    !this.isModified("lastName") &&
    !this.isModified("primarySpecialty") &&
    this.slug
  ) {
    return next();
  }

  try {
    // SAFETY: Provide defaults for undefined fields
    const first = this.firstName
      ? this.firstName.toLowerCase().replace(/\s+/g, "-")
      : "user";
    const last = this.lastName
      ? this.lastName.toLowerCase().replace(/\s+/g, "-")
      : "unknown";
    const specialty = this.primarySpecialty
      ? this.primarySpecialty.toLowerCase().replace(/\s+/g, "-")
      : "general";

    const baseSlug = `${first}-${last}-${specialty}`;
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

// Pre-save middleware to update profile completion
UserSchema.pre("save", function (next) {
  try {
    if (typeof this.calculateProfileCompletion === "function") {
      const pc = this.calculateProfileCompletion();
      this.profileCompletion.percentage = pc.percentage;
      this.profileCompletion.completedSteps = pc.completedSteps;
      this.profileCompletion.totalSteps = pc.totalSteps;
      this.profileCompletion.missingSections = pc.missingSections;
      this.profileCompletion.lastUpdated = new Date();
    }
  } catch (err) {
    // don't block save on profile completion failure
    console.error("Error updating profileCompletion pre-save:", err);
  }
  next();
});

// Method to check password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const jwt = require("jsonwebtoken");

// Method to sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Method to calculate overall verification status
UserSchema.methods.updateVerificationStatus = function () {
  const statuses = Object.values(this.verificationStatus);
  const verifiedCount = statuses.filter(
    (status) => status === "verified",
  ).length;

  if (verifiedCount === 0) {
    this.verificationStatus.overall = "unverified";
  } else if (verifiedCount < statuses.length - 1) {
    // -1 to exclude 'overall'
    this.verificationStatus.overall = "partial";
  } else {
    this.verificationStatus.overall = "verified";
  }
};

// Method to add profile view
UserSchema.methods.addProfileView = async function (
  viewer = null,
  anonymousId = null,
) {
  // Don't count self-views
  if (viewer && viewer.toString() === this._id.toString()) {
    return;
  }

  // Initialize analytics if not present
  if (!this.analytics) {
    this.analytics = {
      views: { total: 0, thisMonth: 0, thisWeek: 0 },
      profileViews: [],
      searchAppearances: { total: 0, thisMonth: 0 },
      contactAttempts: { total: 0, thisMonth: 0 },
    };
  }

  // Initialize profileViews array if not present
  if (!this.analytics.profileViews) {
    this.analytics.profileViews = [];
  }

  // Initialize views object if not present
  if (!this.analytics.views) {
    this.analytics.views = { total: 0, thisMonth: 0, thisWeek: 0 };
  }

  // Don't count duplicate views from same user within 24 hours
  if (viewer) {
    const recentView = this.analytics.profileViews.find(
      (view) =>
        view.viewer &&
        view.viewer.toString() === viewer.toString() &&
        view.viewedAt > new Date(Date.now() - 24 * 60 * 60 * 1000),
    );
    if (recentView) return;
  }

  this.analytics.profileViews.push({
    viewer,
    anonymousId,
    viewedAt: new Date(),
  });

  this.analytics.views.total += 1;
  this.analytics.views.thisMonth += 1;
  this.analytics.views.thisWeek += 1;

  await this.save();
};

// Method to update rating
UserSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = {
      average: 0,
      count: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categories: {
        communication: 0,
        expertise: 0,
        reliability: 0,
        professionalism: 0,
      },
    };
    return;
  }

  const ratings = this.reviews.map((review) => review.rating);
  const average =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  // Calculate breakdown
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((rating) => {
    breakdown[rating] += 1;
  });

  // Calculate category averages
  const categories = {
    communication: 0,
    expertise: 0,
    reliability: 0,
    professionalism: 0,
  };
  const reviewsWithCategories = this.reviews.filter(
    (review) => review.categories,
  );

  if (reviewsWithCategories.length > 0) {
    Object.keys(categories).forEach((category) => {
      const categoryRatings = reviewsWithCategories
        .map((review) => review.categories[category])
        .filter((rating) => rating !== undefined);

      if (categoryRatings.length > 0) {
        categories[category] =
          categoryRatings.reduce((sum, rating) => sum + rating, 0) /
          categoryRatings.length;
      }
    });
  }

  this.rating = {
    average: Math.round(average * 10) / 10, // Round to 1 decimal place
    count: this.reviews.length,
    breakdown,
    categories,
  };
};

// Method to calculate average response time based on messages
UserSchema.methods.calculateResponseTime = async function () {
  try {
    const Conversation = mongoose.model("Conversation");
    const Message = mongoose.model("Message");

    // Get all conversations where this user is a participant
    const conversations = await Conversation.find({
      participants: this._id,
    }).select("_id");

    if (conversations.length === 0) {
      // No conversations, keep default or set to null
      return null;
    }

    const conversationIds = conversations.map((c) => c._id);

    // Get all messages in these conversations
    const messages = await Message.find({
      conversation: { $in: conversationIds },
    })
      .sort({ createdAt: 1 })
      .select("sender createdAt conversation");

    // Calculate response times
    const responseTimes = [];
    const conversationMessages = {};

    // Group messages by conversation
    messages.forEach((msg) => {
      const convId = msg.conversation.toString();
      if (!conversationMessages[convId]) {
        conversationMessages[convId] = [];
      }
      conversationMessages[convId].push(msg);
    });

    // Calculate response time for each conversation
    Object.values(conversationMessages).forEach((convMsgs) => {
      for (let i = 1; i < convMsgs.length; i++) {
        const prevMsg = convMsgs[i - 1];
        const currentMsg = convMsgs[i];

        // If current message is from this user and previous was from someone else
        if (
          currentMsg.sender.toString() === this._id.toString() &&
          prevMsg.sender.toString() !== this._id.toString()
        ) {
          const responseTime =
            (new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt)) /
            (1000 * 60 * 60); // Convert to hours
          responseTimes.push(responseTime);
        }
      }
    });

    if (responseTimes.length === 0) {
      return null;
    }

    // Calculate average response time
    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    // Round to 1 decimal place
    return Math.round(avgResponseTime * 10) / 10;
  } catch (error) {
    console.error("Error calculating response time:", error);
    return null;
  }
};

// Method to update job statistics
UserSchema.methods.updateJobStatistics = async function () {
  try {
    const Job = mongoose.model("Job");
    const Application = mongoose.model("Application");

    if (this.role === "senior") {
      // Update employer statistics
      this.job_statistics.jobs_posted = await Job.countDocuments({
        posted_by: this._id,
      });

      this.job_statistics.jobs_completed = await Job.countDocuments({
        posted_by: this._id,
        status: "completed",
      });

      // Calculate total spent (sum of completed job budgets)
      const completedJobs = await Job.find({
        posted_by: this._id,
        status: "completed",
      }).select("budget.amount");

      this.job_statistics.total_spent = completedJobs.reduce(
        (sum, job) => sum + (job.budget.amount || 0),
        0,
      );
    } else if (this.role === "junior") {
      // Update job seeker statistics
      this.job_statistics.applications_submitted =
        await Application.countDocuments({
          applicant_id: this._id,
          status: { $ne: "draft" },
        });

      this.job_statistics.applications_accepted =
        await Application.countDocuments({
          applicant_id: this._id,
          status: "accepted",
        });

      // Calculate total earnings from completed applications
      const completedApplications = await Application.find({
        applicant_id: this._id,
        status: "completed",
      }).select("proposal.proposed_budget");

      this.job_statistics.total_earnings = completedApplications.reduce(
        (sum, app) => sum + (app.proposal.proposed_budget || 0),
        0,
      );
    }

    // Calculate success rate
    if (
      this.job_statistics.jobs_posted > 0 ||
      this.job_statistics.applications_submitted > 0
    ) {
      const completed =
        this.job_statistics.jobs_completed ||
        this.job_statistics.applications_accepted ||
        0;
      const total =
        this.job_statistics.jobs_posted ||
        this.job_statistics.applications_submitted ||
        1;
      this.job_statistics.success_rate = Math.round((completed / total) * 100);
    }

    await this.save({ validateBeforeSave: false });
  } catch (error) {
    console.error("Error updating job statistics:", error);
  }
};

// Method to get job recommendations
UserSchema.methods.getJobRecommendations = function (limit = 10) {
  const Job = mongoose.model("Job");

  let query = { status: "active" };

  // Filter by preferred categories
  if (
    this.job_preferences.preferred_categories &&
    this.job_preferences.preferred_categories.length > 0
  ) {
    query.category = { $in: this.job_preferences.preferred_categories };
  }

  // Filter by specialty match
  if (this.primarySpecialty) {
    query.$or = [
      { specialty: { $regex: this.primarySpecialty, $options: "i" } },
      { subSpecialties: { $regex: this.primarySpecialty, $options: "i" } },
    ];
  }

  // Filter by budget range
  if (this.job_preferences.preferred_budget_range) {
    const { min, max } = this.job_preferences.preferred_budget_range;
    if (min || max) {
      query["budget.amount"] = {};
      if (min) query["budget.amount"].$gte = min;
      if (max) query["budget.amount"].$lte = max;
    }
  }

  // Filter by remote work preference
  if (this.job_preferences.remote_work_preference === "remote_only") {
    query["requirements.location_preference"] = { $in: ["remote", "hybrid"] };
  }

  return Job.find(query)
    .sort({ createdAt: -1, featured: -1 })
    .limit(limit)
    .populate("posted_by", "firstName lastName profilePhoto rating");
};

// Method to check job application eligibility
UserSchema.methods.canApplyToJob = function (job) {
  const reasons = [];

  // Check role
  if (this.role !== "junior") {
    reasons.push("Only junior doctors can apply to jobs");
  }

  // Check account status
  if (this.accountStatus !== "active") {
    reasons.push("Account must be active to apply to jobs");
  }

  // Only block if explicitly set to false (not seeking)
  // If undefined or true, allow application
  if (this.job_preferences?.seeking_opportunities === false) {
    reasons.push("User is not currently seeking opportunities");
  }

  // Check experience requirements
  if (
    job.experience_required &&
    job.experience_required.minimum_years > this.yearsOfExperience
  ) {
    reasons.push(
      `Minimum ${job.experience_required.minimum_years} years of experience required`,
    );
  }

  // Check specialty match (optional but recommended)
  if (job.specialty) {
    const specialtyMatch =
      this.primarySpecialty?.toLowerCase() === job.specialty.toLowerCase() ||
      (this.subspecialties &&
        this.subspecialties.some(
          (sub) => sub.toLowerCase() === job.specialty.toLowerCase(),
        ));

    if (!specialtyMatch) {
      // This is a soft warning, not a hard requirement
      // reasons.push(`Specialty mismatch: ${job.specialty} required`);
    }
  }

  return {
    canApply: reasons.length === 0,
    reasons: reasons,
  };
};

// Static method to find verified doctors
UserSchema.statics.findVerified = function () {
  return this.find({
    "verificationStatus.overall": "verified",
    accountStatus: "active",
  });
};

// Static method for search with filters
UserSchema.statics.searchDoctors = function (searchTerm, filters = {}) {
  let query = { accountStatus: "active" };

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  if (filters.specialty) {
    query.$or = [
      { primarySpecialty: { $regex: filters.primarySpecialty, $options: "i" } },
      { subspecialties: { $regex: filters.primarySpecialty, $options: "i" } },
    ];
  }

  if (filters.experience) {
    query.yearsOfExperience = { $gte: filters.experience };
  }

  if (filters.rating) {
    query["rating.average"] = { $gte: filters.rating };
  }

  if (filters.location) {
    query.$or = [
      { "location.city": { $regex: filters.location, $options: "i" } },
      { "location.state": { $regex: filters.location, $options: "i" } },
    ];
  }

  if (filters.verified) {
    query["verificationStatus.overall"] = "verified";
  }

  let sortOptions = {};
  if (searchTerm) {
    sortOptions.score = { $meta: "textScore" };
  }
  if (filters.sortBy === "rating") {
    sortOptions["rating.average"] = -1;
  } else if (filters.sortBy === "experience") {
    sortOptions.yearsOfExperience = -1;
  } else if (filters.sortBy === "recent") {
    sortOptions.createdAt = -1;
  }

  return this.find(query).sort(sortOptions);
};

// Calculate canonical profile completion
UserSchema.methods.calculateProfileCompletion = function () {
  const totalSteps = 8;
  let completedSteps = 1; // Basic info is considered present by default

  // Profile Photo
  if (this.profilePhoto && this.profilePhoto.url) completedSteps++;

  // Professional Bio (meaningful length)
  if (this.bio && this.bio.trim().length > 50) completedSteps++;

  // Work Experience
  if (this.experiences && this.experiences.length > 0) completedSteps++;

  // Skills (at least 3)
  if (this.skills && this.skills.length >= 3) completedSteps++;

  // Certifications
  if (this.certifications && this.certifications.length > 0) completedSteps++;

  // Documents
  if (this.documents && this.documents.length > 0) completedSteps++;

  // Availability settings
  if (
    (this.availability && this.availability.weeklySchedule) ||
    (this.availability && this.availability.hoursPerWeek) ||
    (this.availability && this.availability.availability_hours_per_week)
  ) {
    completedSteps++;
  }

  const percentage = Math.round((completedSteps / totalSteps) * 100);

  // Build missing sections list (human-friendly titles)
  const missingSections = [];
  if (!this.profilePhoto || !this.profilePhoto.url)
    missingSections.push("Profile Photo");
  if (!this.bio || this.bio.trim().length <= 50)
    missingSections.push("Professional Bio");
  if (!this.experiences || this.experiences.length === 0)
    missingSections.push("Work Experience");
  if (!this.skills || this.skills.length < 3)
    missingSections.push("Skills & Expertise");
  if (!this.certifications || this.certifications.length === 0)
    missingSections.push("Certifications");
  if (!this.documents || this.documents.length === 0)
    missingSections.push("Documents");
  if (
    !(
      (this.availability && this.availability.weeklySchedule) ||
      (this.availability && this.availability.hoursPerWeek) ||
      (this.availability && this.availability.availability_hours_per_week)
    )
  ) {
    missingSections.push("Availability");
  }

  return {
    percentage,
    completedSteps,
    totalSteps,
    missingSections,
  };
};

module.exports = mongoose.model("User", UserSchema);
