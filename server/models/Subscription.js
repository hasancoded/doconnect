// server/models/Subscription.js - FIXED VERSION
const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    stripeInvoiceId: {
      type: String,
      required: true,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
    },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "void", "uncollectible", "deleted"],
      default: "open",
    },
    paidAt: Date,
    dueDate: Date,
    periodStart: Date,
    periodEnd: Date,
    description: String,
    invoiceUrl: String,
    receiptUrl: String,
    paymentMethodLast4: String,
    attemptCount: {
      type: Number,
      default: 0,
    },
    nextAttemptDate: Date,
    failureReason: String,
  },
  { timestamps: true }
);

const SubscriptionSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },

    // Stripe References
    stripeCustomerId: {
      type: String,
      required: [true, "Stripe Customer ID is required"],
      index: true,
    },

    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // Plan Information
    planId: {
      type: String,
      enum: ["free", "basic", "professional", "enterprise"],
      default: "free",
      required: true,
    },

    planName: {
      type: String,
      enum: ["Free Tier", "Basic Plan", "Professional Plan", "Enterprise Plan"],
      default: "Free Tier",
    },

    planPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    planBillingCycle: {
      type: String,
      enum: ["monthly", "annually"],
      default: "monthly",
    },

    // Subscription Status
    status: {
      type: String,
      enum: [
        "free",
        "active",
        "trialing",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "canceled",
        "paused",
      ],
      default: "free",
      index: true,
    },

    statusReason: {
      type: String,
      enum: [
        "payment_declined",
        "customer_initiated",
        "billing_cycle_reset",
        "dunning_process",
        "upgrade",
        "downgrade",
        "administrative_change",
      ],
    },

    // Trial Information
    trialStart: Date,
    trialEnd: Date,
    trialEndsInDays: {
      type: Number,
      get: function () {
        if (!this.trialEnd) return null;
        const daysLeft = Math.ceil(
          (this.trialEnd - new Date()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft > 0 ? daysLeft : 0;
      },
    },
    hasTrialUsed: {
      type: Boolean,
      default: false,
    },

    // Billing Period
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },

    currentPeriodEnd: {
      type: Date,
      required: true,
    },

    renewalDate: {
      type: Date,
      get: function () {
        return this.currentPeriodEnd;
      },
    },

    // Payment Information
    paymentMethod: {
      brand: String,
      last4: String,
      expMonth: Number,
      expYear: Number,
      fingerprint: String,
      stripePaymentMethodId: String,
    },

    // Billing Details
    billingEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    // Invoice History - FIX: Add default empty array
    invoices: {
      type: [InvoiceSchema],
      default: [],
    },

    // Usage Tracking
    usage: {
      jobApplications: {
        limit: Number,
        used: { type: Number, default: 0 },
        resetDate: Date,
      },
      profileViews: {
        limit: Number,
        used: { type: Number, default: 0 },
        resetDate: Date,
      },
      jobPostings: {
        limit: Number,
        used: { type: Number, default: 0 },
        resetDate: Date,
      },
      messageThreads: {
        limit: Number,
        used: { type: Number, default: 0 },
      },
      bulkOperations: {
        limit: Number,
        used: { type: Number, default: 0 },
        resetDate: Date,
      },
    },

    // Features Access
    features: {
      unlimitedApplications: { type: Boolean, default: false },
      advancedSearch: { type: Boolean, default: false },
      featuredJobPostings: { type: Boolean, default: false },
      directMessaging: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      bulkOperations: { type: Boolean, default: false },
      scheduledPosting: { type: Boolean, default: false },
    },

    // Pricing Information
    pricing: {
      currency: { type: String, default: "usd" },
      amount: { type: Number, default: 0 },
      interval: { type: String, enum: ["month", "year"], default: "month" },
      stripePriceId: String,
    },

    // Cancellation Information
    canceledAt: Date,
    cancelationReason: String,
    cancelationFeedback: String,
    cancelationSurveyResponse: String,
    cancelationDate: Date,
    willCancelAt: Date,
    canReactivate: {
      type: Boolean,
      default: true,
    },

    // Scheduled Downgrade (for maintaining access until period end)
    scheduledDowngrade: {
      targetPlan: {
        type: String,
        enum: ["free", "basic", "professional", "enterprise"],
      },
      effectiveDate: Date,
      reason: String,
    },

    // Downgrade/Upgrade History
    planChangeHistory: [
      {
        fromPlan: String,
        toPlan: String,
        changedAt: { type: Date, default: Date.now },
        changeReason: String,
        prorationCredit: Number,
      },
    ],

    // Metadata
    metadata: {
      source: String,
      campaignId: String,
      couponCode: String,
      discountAmount: { type: Number, default: 0 },
    },

    // Admin Notes
    adminNotes: String,
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    flagReason: String,

    // Activity Tracking
    lastPaymentAttempt: Date,
    lastSuccessfulPayment: Date,
    failedPaymentCount: {
      type: Number,
      default: 0,
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },

    // Testing
    isTestSubscription: {
      type: Boolean,
      default: false,
    },

    // Sync Status
    lastSyncedWithStripe: Date,
    syncRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

// Indexes (removed duplicates - unique/index:true fields auto-index)
// SubscriptionSchema.index({ userId: 1 }); // Already has index: true
// SubscriptionSchema.index({ stripeCustomerId: 1 }); // Already has index: true
// SubscriptionSchema.index({ stripeSubscriptionId: 1 }); // Already has unique: true + index: true
// SubscriptionSchema.index({ status: 1 }); // Already has index: true
SubscriptionSchema.index({ userId: 1, status: 1 }); // Compound index - keep
SubscriptionSchema.index({ currentPeriodEnd: 1 });
SubscriptionSchema.index({ createdAt: -1 });
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 }); // Compound index - keep

// Virtuals
SubscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" || this.status === "trialing";
});

SubscriptionSchema.virtual("isPastDue").get(function () {
  return this.status === "past_due";
});

SubscriptionSchema.virtual("isCanceled").get(function () {
  return this.status === "canceled";
});

SubscriptionSchema.virtual("isTrialing").get(function () {
  return this.status === "trialing";
});

SubscriptionSchema.virtual("daysUntilRenewal").get(function () {
  const daysLeft = Math.ceil(
    (this.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)
  );
  return daysLeft > 0 ? daysLeft : 0;
});

SubscriptionSchema.virtual("renewalDateFormatted").get(function () {
  return this.currentPeriodEnd.toLocaleDateString();
});

SubscriptionSchema.virtual("planTierLevel").get(function () {
  const levels = { free: 0, basic: 1, professional: 2, enterprise: 3 };
  return levels[this.planId] || 0;
});

// Methods
SubscriptionSchema.methods.isExpired = function () {
  if (this.status === "free") return false;
  return new Date() > this.currentPeriodEnd;
};

SubscriptionSchema.methods.hasFeature = function (featureName) {
  return this.features[featureName] === true;
};

SubscriptionSchema.methods.canAccessFeature = function (featureName) {
  if (this.status === "free") return false;
  if (this.status === "canceled" || this.status === "incomplete") return false;
  return this.hasFeature(featureName);
};

SubscriptionSchema.methods.getRemainingUsage = function (usageType) {
  if (!this.usage[usageType]) return null;
  const remaining = this.usage[usageType].limit - this.usage[usageType].used;
  return remaining > 0 ? remaining : 0;
};

SubscriptionSchema.methods.hasUsageAvailable = function (usageType) {
  const remaining = this.getRemainingUsage(usageType);
  return remaining === null || remaining > 0;
};

SubscriptionSchema.methods.trackUsage = async function (usageType, amount = 1) {
  if (!this.usage[usageType]) {
    throw new Error(`Unknown usage type: ${usageType}`);
  }

  this.usage[usageType].used += amount;

  if (
    this.usage[usageType].limit &&
    this.usage[usageType].used > this.usage[usageType].limit
  ) {
    this.usage[usageType].used = this.usage[usageType].limit;
  }

  await this.save();
};

SubscriptionSchema.methods.addInvoice = function (invoiceData) {
  const invoice = {
    stripeInvoiceId: invoiceData.id,
    amount: invoiceData.amount_paid || invoiceData.amount_due,
    currency: invoiceData.currency,
    status: invoiceData.status,
    paidAt: invoiceData.paid_at ? new Date(invoiceData.paid_at * 1000) : null,
    dueDate: invoiceData.due_date
      ? new Date(invoiceData.due_date * 1000)
      : null,
    periodStart: new Date(invoiceData.period_start * 1000),
    periodEnd: new Date(invoiceData.period_end * 1000),
    invoiceUrl: invoiceData.hosted_invoice_url,
    receiptUrl: invoiceData.receipt_number,
  };

  const exists = this.invoices.some(
    (inv) => inv.stripeInvoiceId === invoice.stripeInvoiceId
  );
  if (!exists) {
    this.invoices.push(invoice);
  }

  return this.save();
};

// FIX: Safe getLastInvoice method
SubscriptionSchema.methods.getLastInvoice = function () {
  // Check if invoices exists and is an array with length
  if (
    !this.invoices ||
    !Array.isArray(this.invoices) ||
    this.invoices.length === 0
  ) {
    return null;
  }
  return this.invoices[this.invoices.length - 1];
};

SubscriptionSchema.methods.canDowngradeTo = function (targetPlanId) {
  const levels = { free: 0, basic: 1, professional: 2, enterprise: 3 };
  return levels[targetPlanId] <= levels[this.planId];
};

SubscriptionSchema.methods.canUpgradeTo = function (targetPlanId) {
  const levels = { free: 0, basic: 1, professional: 2, enterprise: 3 };
  return levels[targetPlanId] > levels[this.planId];
};

SubscriptionSchema.methods.getUpgradeProration = function (newPlanPrice) {
  const daysRemaining = this.daysUntilRenewal;
  const dailyRate = this.planPrice / 30;
  const prorationCredit = dailyRate * daysRemaining;
  const upgradeCost = newPlanPrice - this.planPrice;
  return upgradeCost - prorationCredit;
};

// FIX: Enhanced formatForResponse
SubscriptionSchema.methods.formatForResponse = function () {
  return {
    id: this._id,
    userId: this.userId,
    planId: this.planId,
    planName: this.planName,
    planPrice: this.planPrice,
    planBillingCycle: this.planBillingCycle,
    status: this.status,
    isActive: this.isActive,
    isCanceled: this.isCanceled,
    isPastDue: this.isPastDue,
    isTrialing: this.isTrialing,
    currentPeriodStart: this.currentPeriodStart,
    currentPeriodEnd: this.currentPeriodEnd,
    renewalDate: this.renewalDate,
    daysUntilRenewal: this.daysUntilRenewal,
    paymentMethod: this.paymentMethod,
    features: this.features,
    usage: this.usage,
    lastInvoice: this.getLastInvoice() || null, // Safe fallback
    canceledAt: this.canceledAt,
    trialEnd: this.trialEnd,
    trialEndsInDays: this.trialEndsInDays,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Pre-save middleware
SubscriptionSchema.pre("save", function (next) {
  // Auto-set currentPeriodEnd if not set
  if (!this.currentPeriodEnd && this.currentPeriodStart) {
    const end = new Date(this.currentPeriodStart);
    if (this.planBillingCycle === "annually") {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    this.currentPeriodEnd = end;
  }

  // FIX: Ensure invoices is always an array
  if (!this.invoices) {
    this.invoices = [];
  }

  next();
});

// Static methods
SubscriptionSchema.statics.findActiveByUserId = function (userId) {
  return this.findOne({
    userId,
    status: { $in: ["active", "trialing"] },
  });
};

SubscriptionSchema.statics.findByStripeCustomerId = function (customerId) {
  return this.findOne({ stripeCustomerId: customerId });
};

SubscriptionSchema.statics.findExpiredSubscriptions = function () {
  return this.find({
    status: { $in: ["active", "trialing"] },
    currentPeriodEnd: { $lt: new Date() },
  });
};

SubscriptionSchema.statics.findUpcomingRenewals = function (daysAhead = 7) {
  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000
  );

  return this.find({
    status: { $in: ["active", "trialing"] },
    currentPeriodEnd: { $gte: startDate, $lte: endDate },
  });
};

SubscriptionSchema.statics.findPastDueSubscriptions = function () {
  return this.find({
    status: "past_due",
  });
};

module.exports = mongoose.model("Subscription", SubscriptionSchema);
