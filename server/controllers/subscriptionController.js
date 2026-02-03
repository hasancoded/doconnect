// server/controllers/subscriptionController.js - Complete Subscription Management
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { validationResult } = require("express-validator");

// ============================================================================
// PLAN CONFIGURATION
// ============================================================================
const PLANS = {
  free: {
    id: "free",
    name: "Free Tier",
    price: 0,
    currency: "usd",
    interval: "month",
    description: "Basic access to Doconnect platform",
    features: {
      unlimitedApplications: false,
      advancedSearch: false,
      featuredJobPostings: false,
      directMessaging: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      bulkOperations: false,
      scheduledPosting: false,
    },
    usage: {
      jobApplications: { limit: 5 },
      profileViews: { limit: 50 },
      jobPostings: { limit: 3 },
      messageThreads: { limit: 10 },
      bulkOperations: { limit: 0 },
    },
  },
  basic: {
    id: "basic",
    name: "Basic Plan",
    price: 1900, // $19.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_BASIC,
    description: "Enhanced platform access with professional features",
    features: {
      unlimitedApplications: true,
      advancedSearch: true,
      featuredJobPostings: false,
      directMessaging: true,
      advancedAnalytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      bulkOperations: false,
      scheduledPosting: false,
    },
    usage: {
      jobApplications: { limit: null }, // unlimited
      profileViews: { limit: 500 },
      jobPostings: { limit: 20 },
      messageThreads: { limit: 50 },
      bulkOperations: { limit: 5 },
    },
  },
  professional: {
    id: "professional",
    name: "Professional Plan",
    price: 3900, // $39.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL,
    description: "Full platform access with advanced tools",
    features: {
      unlimitedApplications: true,
      advancedSearch: true,
      featuredJobPostings: true,
      directMessaging: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: false,
      apiAccess: false,
      bulkOperations: true,
      scheduledPosting: true,
    },
    usage: {
      jobApplications: { limit: null },
      profileViews: { limit: null },
      jobPostings: { limit: 50 },
      messageThreads: { limit: 200 },
      bulkOperations: { limit: 50 },
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    price: 9900, // $99.00 in cents
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
    description: "Complete platform access for clinics and teams",
    features: {
      unlimitedApplications: true,
      advancedSearch: true,
      featuredJobPostings: true,
      directMessaging: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: true,
      apiAccess: true,
      bulkOperations: true,
      scheduledPosting: true,
    },
    usage: {
      jobApplications: { limit: null },
      profileViews: { limit: null },
      jobPostings: { limit: null },
      messageThreads: { limit: null },
      bulkOperations: { limit: null },
    },
  },
};

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

// @desc    Create Stripe checkout session
// @route   POST /api/subscriptions/create-checkout-session
// @access  Private (Authenticated users only)
exports.createCheckoutSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { planId, billingCycle = "monthly" } = req.body;
    const user = req.user;


    // Validate plan
    if (!PLANS[planId]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
        validPlans: Object.keys(PLANS),
      });
    }

    // Can't use free plan in checkout
    if (planId === "free") {
      return res.status(400).json({
        success: false,
        message:
          "Free plan cannot be purchased. Cancel your subscription to use free tier.",
      });
    }

    // Find existing subscription
    let subscription = await Subscription.findOne({
      userId: user._id,
    });


    // Check if user already has this plan active
    if (
      subscription &&
      subscription.planId === planId &&
      subscription.isActive
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have this plan active",
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = subscription?.stripeCustomerId;

    // Check if we need to create a new Stripe customer
    // (no ID, or has a temporary/seed ID)
    const needsNewCustomer =
      !stripeCustomerId ||
      stripeCustomerId.startsWith("temp_") ||
      stripeCustomerId.startsWith("seed_");

    if (needsNewCustomer) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
          role: user.role,
        },
      });
      stripeCustomerId = customer.id;
    } else {
    }

    // Create or update subscription record
    if (!subscription) {
      subscription = await Subscription.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            stripeCustomerId,
            planId: "free",
            planName: "Free Tier",
            status: "free",
            billingEmail: user.email,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            invoices: [],
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } else if (subscription.stripeCustomerId !== stripeCustomerId) {
      subscription.stripeCustomerId = stripeCustomerId;
      await subscription.save();
    }

    // Get plan details
    const plan = PLANS[planId];
    let priceId = plan.stripePriceId;

    if (!priceId) {
      console.error(`Missing Stripe price ID for plan: ${planId}`);
      return res.status(500).json({
        success: false,
        message: `Plan price not configured for ${planId}. Please contact support.`,
      });
    }


    // Determine if user gets trial
    const shouldGetTrial =
      !subscription.hasTrialUsed &&
      (subscription.planId === "free" || !subscription.planId);


    // Build checkout session config
    const sessionConfig = {
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          planId,
        },
        trial_period_days: shouldGetTrial ? 7 : 0,
      },
      billing_address_collection: "required",
    };

    // Conditionally enable automatic tax (configurable via env)
    const enableAutomaticTax = process.env.STRIPE_ENABLE_TAX === "true";

    if (enableAutomaticTax) {
      sessionConfig.automatic_tax = { enabled: true };
    } else {
        "ℹ️  Automatic tax disabled (configure STRIPE_ENABLE_TAX=true to enable)"
      );
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);


    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        planId,
        planName: plan.name,
        amount: plan.price,
        billingCycle,
        trialDays: shouldGetTrial ? 7 : 0,
      },
    });
  } catch (error) {
    console.error("❌ Stripe checkout error:", error.message);

    // Better error handling for Stripe errors
    const errorMessage =
      error.type === "StripeInvalidRequestError"
        ? `Stripe configuration error: ${error.message}`
        : "Error creating checkout session";

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

// @desc    Handle Stripe webhook events
// @route   POST /api/subscriptions/webhook
// @access  Public (with signature verification)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${err.message}`,
    });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "customer.updated":
        await handleCustomerUpdated(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      default:
    }

    // Return success
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing webhook",
    });
  }
};

// @desc    Get current user subscription
// @route   GET /api/subscriptions/current
// @access  Private
exports.getCurrentSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({
      userId: req.user._id,
    }).select("-invoices");

    // If no subscription, create free tier with findOneAndUpdate
    if (!subscription) {
      subscription = await Subscription.findOneAndUpdate(
        { userId: req.user._id },
        {
          $setOnInsert: {
            userId: req.user._id,
            stripeCustomerId: `temp_${req.user._id}`, // Temporary ID
            planId: "free",
            planName: "Free Tier",
            status: "free",
            billingEmail: req.user.email,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            invoices: [], // Initialize with empty array
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      data: subscription.formatForResponse(),
    });
  } catch (error) {
    console.error("Error getting subscription:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving subscription",
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason, feedback } = req.body;

    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // If already on free tier, nothing to cancel
    if (subscription.planId === "free") {
      return res.status(400).json({
        success: false,
        message: "Already on free tier",
      });
    }

    // If has real Stripe subscription, cancel it
    const hasRealStripeId =
      subscription.stripeSubscriptionId &&
      !subscription.stripeSubscriptionId.startsWith("seed_") &&
      !subscription.stripeSubscriptionId.startsWith("temp_");

    if (hasRealStripeId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        // Schedule downgrade to free tier at period end (maintains access)
        subscription.scheduledDowngrade = {
          targetPlan: "free",
          effectiveDate: subscription.currentPeriodEnd,
          reason: reason || "User requested cancellation",
        };
        subscription.willCancelAt = subscription.currentPeriodEnd;
      } catch (stripeError) {
        console.error("Stripe cancellation error:", stripeError.message);
        // Continue with local cancellation even if Stripe fails
      }
    } else {
      // For seeded/test subscriptions, downgrade immediately
      subscription.planId = "free";
      subscription.planName = "Free Tier";
      subscription.planPrice = 0;
      subscription.status = "free";

      // Update features for free tier
      subscription.features = {
        unlimitedApplications: false,
        advancedSearch: false,
        featuredJobPostings: false,
        directMessaging: false,
        advancedAnalytics: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        bulkOperations: false,
        scheduledPosting: false,
      };

      // Update usage limits for free tier
      subscription.usage = {
        jobApplications: { limit: 5, used: 0 },
        profileViews: { limit: 50, used: 0 },
        jobPostings: { limit: 3, used: 0 },
        messageThreads: { limit: 10, used: 0 },
        bulkOperations: { limit: 0, used: 0 },
      };
    }

    subscription.canceledAt = new Date();
    subscription.cancelationReason = reason || "Downgraded to free tier";
    subscription.cancelationFeedback = feedback;

    await subscription.save();

    const message = hasRealStripeId
      ? `Subscription will be canceled on ${subscription.currentPeriodEnd.toLocaleDateString()}. You'll retain access until then.`
      : "Successfully downgraded to free tier";

    res.status(200).json({
      success: true,
      message,
      data: {
        planId: subscription.planId,
        status: subscription.status,
        canceledAt: subscription.canceledAt,
        willCancelAt: subscription.willCancelAt,
        scheduledDowngrade: subscription.scheduledDowngrade,
      },
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).json({
      success: false,
      message: "Error canceling subscription",
      error: error.message,
    });
  }
};

// @desc    Reactivate canceled subscription
// @route   POST /api/subscriptions/reactivate
// @access  Private
exports.reactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Check if user has real Stripe subscription ID
    const hasRealStripeId =
      subscription.stripeSubscriptionId &&
      !subscription.stripeSubscriptionId.startsWith("seed_") &&
      !subscription.stripeSubscriptionId.startsWith("temp_");

    if (!hasRealStripeId) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot reactivate test/seeded subscriptions. Please upgrade to a paid plan.",
      });
    }

    // SCENARIO 1: Subscription is scheduled for cancellation but still active
    // Action: Remove cancel_at_period_end flag from Stripe
    if (subscription.willCancelAt && subscription.status === "active") {
      try {
        // Remove cancellation from Stripe
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });

        // Clear cancellation fields in database
        subscription.willCancelAt = null;
        subscription.scheduledDowngrade = null;
        subscription.canceledAt = null;
        subscription.cancelationReason = null;
        subscription.cancelationFeedback = null;

        await subscription.save();

        return res.status(200).json({
          success: true,
          message:
            "Subscription reactivated successfully. Your plan will continue as normal.",
          data: {
            planId: subscription.planId,
            planName: subscription.planName,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            willCancelAt: null,
          },
        });
      } catch (stripeError) {
        console.error("Stripe reactivation error:", stripeError);
        return res.status(500).json({
          success: false,
          message: "Failed to reactivate subscription with Stripe",
          error: stripeError.message,
        });
      }
    }

    // SCENARIO 2: Subscription already canceled/expired (period ended)
    // Action: Redirect to checkout for new subscription
    if (subscription.status === "canceled" || subscription.planId === "free") {
      const { planId = "basic" } = req.body; // Default to basic if not specified

      if (!PLANS[planId] || planId === "free") {
        return res.status(400).json({
          success: false,
          message: "Invalid plan for reactivation",
        });
      }

      const plan = PLANS[planId];

      // Create new checkout session
      const session = await stripe.checkout.sessions.create({
        customer: subscription.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/subscription/manage`,
        subscription_data: {
          metadata: {
            userId: req.user._id.toString(),
            planId,
            isReactivation: "true",
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: "Checkout session created for reactivation",
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    }

    // SCENARIO 3: Subscription is active and not canceled
    // Action: Nothing to reactivate
    return res.status(400).json({
      success: false,
      message:
        "Subscription is already active and not scheduled for cancellation",
      currentStatus: subscription.status,
    });
  } catch (error) {
    console.error("Reactivation error:", error);
    res.status(500).json({
      success: false,
      message: "Error reactivating subscription",
      error: error.message,
    });
  }
};

// @desc    Create Stripe Customer Portal session for payment method update
// @route   POST /api/subscriptions/update-payment-method
// @access  Private
exports.updatePaymentMethod = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Check if user has real Stripe customer ID
    const hasRealStripeId =
      subscription.stripeCustomerId &&
      !subscription.stripeCustomerId.startsWith("seed_") &&
      !subscription.stripeCustomerId.startsWith("temp_");

    if (!hasRealStripeId) {
      return res.status(400).json({
        success: false,
        message:
          "Payment method update is only available for active paid subscriptions",
      });
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/subscription/manage`,
    });

    res.status(200).json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Payment method update error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment portal session",
      error: error.message,
    });
  }
};

// @desc    Get subscription invoices
// @route   GET /api/subscriptions/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Get invoices from Stripe if subscription has valid Stripe ID
    let invoices = [];

    // Only call Stripe if we have a real customer ID (not seed_ or temp_)
    const hasRealStripeId =
      subscription.stripeCustomerId &&
      !subscription.stripeCustomerId.startsWith("seed_") &&
      !subscription.stripeCustomerId.startsWith("temp_");

    if (hasRealStripeId) {
      try {
        const stripeInvoices = await stripe.invoices.list({
          customer: subscription.stripeCustomerId,
          limit: parseInt(limit),
        });

        invoices = stripeInvoices.data.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid || invoice.amount_due,
          currency: invoice.currency,
          status: invoice.status,
          date: new Date(invoice.created * 1000),
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
          paidAt: invoice.paid_at ? new Date(invoice.paid_at * 1000) : null,
          invoiceUrl: invoice.hosted_invoice_url,
          receiptUrl: invoice.receipt_number,
          description: invoice.description,
        }));
      } catch (stripeError) {
        console.error("Stripe invoice fetch error:", stripeError.message);
        // Don't fail the request, just return empty invoices
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedInvoices = invoices.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedInvoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: invoices.length,
        pages: Math.ceil(invoices.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting invoices:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving invoices",
    });
  }
};

// @desc    Upgrade subscription plan
// @route   POST /api/subscriptions/upgrade
// @access  Private
exports.upgradePlan = async (req, res) => {
  try {
    const { targetPlanId } = req.body;

    if (!PLANS[targetPlanId]) {
      return res.status(400).json({
        success: false,
        message: "Invalid target plan",
      });
    }

    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Verify it's actually an upgrade
    if (!subscription.canUpgradeTo(targetPlanId)) {
      return res.status(400).json({
        success: false,
        message: "This is not an upgrade or plan is not available",
        currentPlan: subscription.planId,
        targetPlan: targetPlanId,
      });
    }

    // For free to paid, redirect to checkout
    if (subscription.planId === "free") {
      const plan = PLANS[targetPlanId];
      const session = await stripe.checkout.sessions.create({
        customer: subscription.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/subscription/plans`,
      });

      return res.status(200).json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    }

    // For existing subscription, use Stripe's update
    if (subscription.stripeSubscriptionId) {
      const targetPlan = PLANS[targetPlanId];

      // Get current subscription from Stripe
      const currentSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      const item = currentSubscription.items.data[0];

      // Update subscription in Stripe with immediate proration
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: item.id,
              price: targetPlan.stripePriceId,
            },
          ],
          proration_behavior: "create_prorations", // Charge immediately
        }
      );

      // CRITICAL: Sync database with Stripe state
      subscription.planId = targetPlanId;
      subscription.planName = targetPlan.name;
      subscription.planPrice = targetPlan.price;
      subscription.features = targetPlan.features;
      subscription.usage = {
        ...targetPlan.usage,
        // Preserve current usage counts
        jobApplications: {
          limit: targetPlan.usage.jobApplications.limit,
          used: subscription.usage.jobApplications?.used || 0,
        },
        profileViews: {
          limit: targetPlan.usage.profileViews.limit,
          used: subscription.usage.profileViews?.used || 0,
        },
        jobPostings: {
          limit: targetPlan.usage.jobPostings.limit,
          used: subscription.usage.jobPostings?.used || 0,
        },
        messageThreads: {
          limit: targetPlan.usage.messageThreads.limit,
          used: subscription.usage.messageThreads?.used || 0,
        },
        bulkOperations: {
          limit: targetPlan.usage.bulkOperations.limit,
          used: subscription.usage.bulkOperations?.used || 0,
        },
      };

      // Update period from Stripe
      subscription.currentPeriodStart = new Date(
        updatedSubscription.current_period_start * 1000
      );
      subscription.currentPeriodEnd = new Date(
        updatedSubscription.current_period_end * 1000
      );

      // Add to plan change history
      subscription.planChangeHistory.push({
        fromPlan: subscription.planId,
        toPlan: targetPlanId,
        changedAt: new Date(),
        changeReason: "User-initiated upgrade",
      });

      await subscription.save();

      return res.status(200).json({
        success: true,
        message:
          "Plan upgraded successfully. Changes are effective immediately.",
        data: {
          planId: subscription.planId,
          planName: subscription.planName,
          fromPlan:
            subscription.planChangeHistory[
              subscription.planChangeHistory.length - 1
            ].fromPlan,
          toPlan: targetPlanId,
          newPrice: targetPlan.price / 100,
          billingCycle: subscription.planBillingCycle,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Stripe subscription found. Please contact support.",
      });
    }
  } catch (error) {
    console.error("Upgrade error:", error);
    res.status(500).json({
      success: false,
      message: "Error upgrading plan",
      error: error.message,
    });
  }
};

// @desc    Downgrade subscription plan
// @route   POST /api/subscriptions/downgrade
// @access  Private
exports.downgradePlan = async (req, res) => {
  try {
    const { targetPlanId } = req.body;

    if (!PLANS[targetPlanId]) {
      return res.status(400).json({
        success: false,
        message: "Invalid target plan",
      });
    }

    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: { $in: ["active", "trialing"] },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Verify it's actually a downgrade
    if (!subscription.canDowngradeTo(targetPlanId)) {
      return res.status(400).json({
        success: false,
        message: "This is not a downgrade",
        currentPlan: subscription.planId,
        targetPlan: targetPlanId,
      });
    }

    // Check if user has real Stripe subscription
    const hasRealStripeId =
      subscription.stripeSubscriptionId &&
      !subscription.stripeSubscriptionId.startsWith("seed_") &&
      !subscription.stripeSubscriptionId.startsWith("temp_");

    if (!hasRealStripeId) {
      return res.status(400).json({
        success: false,
        message: "Cannot downgrade test/seeded subscriptions",
      });
    }

    const targetPlan = PLANS[targetPlanId];

    // IMPORTANT: Schedule downgrade for end of billing period
    // Do NOT update Stripe subscription immediately
    // The downgrade will be applied by webhook when subscription period ends

    // Store scheduled downgrade in database
    subscription.scheduledDowngrade = {
      targetPlan: targetPlanId,
      effectiveDate: subscription.currentPeriodEnd,
      reason: "User-initiated downgrade",
    };

    // Add to plan change history
    subscription.planChangeHistory.push({
      fromPlan: subscription.planId,
      toPlan: targetPlanId,
      changedAt: new Date(),
      changeReason: "User-initiated downgrade (scheduled)",
    });

    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Downgrade to ${
        targetPlan.name
      } scheduled for ${subscription.currentPeriodEnd.toLocaleDateString()}`,
      data: {
        currentPlan: subscription.planId,
        currentPlanName: subscription.planName,
        targetPlan: targetPlanId,
        targetPlanName: targetPlan.name,
        effectiveDate: subscription.currentPeriodEnd,
        scheduledDowngrade: subscription.scheduledDowngrade,
        message:
          "You'll retain access to your current plan features until the end of your billing period.",
      },
    });
  } catch (error) {
    console.error("Downgrade error:", error);
    res.status(500).json({
      success: false,
      message: "Error downgrading plan",
      error: error.message,
    });
  }
};

// @desc    Get subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const plans = Object.values(PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price / 100, // Convert cents to dollars
      currency: plan.currency,
      interval: plan.interval,
      description: plan.description,
      features: plan.features,
      usage: plan.usage,
    }));

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving plans",
    });
  }
};

// @desc    Track feature usage
// @route   POST /api/subscriptions/track-usage
// @access  Private (internal use)
exports.trackUsage = async (req, res) => {
  try {
    const { usageType, amount = 1 } = req.body;

    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    // Check if limit exists
    if (
      !subscription.usage[usageType] ||
      subscription.usage[usageType].limit === null
    ) {
      // Unlimited usage, just track
      await subscription.trackUsage(usageType, amount);
      return res.status(200).json({
        success: true,
        message: "Usage tracked",
        data: {
          usageType,
          used: subscription.usage[usageType].used,
          limit: subscription.usage[usageType].limit,
        },
      });
    }

    // Check if within limit
    if (!subscription.hasUsageAvailable(usageType)) {
      return res.status(429).json({
        success: false,
        message: `${usageType} limit reached`,
        limit: subscription.usage[usageType].limit,
        used: subscription.usage[usageType].used,
        upgrade: "Upgrade your plan for higher limits",
      });
    }

    // Track usage
    await subscription.trackUsage(usageType, amount);

    res.status(200).json({
      success: true,
      message: "Usage tracked",
      data: {
        usageType,
        used: subscription.usage[usageType].used,
        limit: subscription.usage[usageType].limit,
        remaining: subscription.getRemainingUsage(usageType),
      },
    });
  } catch (error) {
    console.error("Usage tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking usage",
    });
  }
};

// @desc    Check feature access
// @route   GET /api/subscriptions/feature/:featureName
// @access  Private
exports.checkFeatureAccess = async (req, res) => {
  try {
    const { featureName } = req.params;

    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No subscription found",
      });
    }

    const hasAccess = subscription.canAccessFeature(featureName);

    res.status(200).json({
      success: true,
      data: {
        feature: featureName,
        hasAccess,
        plan: subscription.planId,
        planStatus: subscription.status,
      },
    });
  } catch (error) {
    console.error("Feature access check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking feature access",
    });
  }
};

// @desc    Sync subscription with Stripe
// @route   POST /api/subscriptions/sync
// @access  Private (admin only)
exports.syncSubscriptionWithStripe = async (req, res) => {
  try {
    const { userId } = req.body;

    const subscription = await Subscription.findOne({
      userId,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No Stripe subscription to sync",
      });
    }

    // Fetch from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Update local record
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000
    );
    subscription.currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000
    );
    subscription.lastSyncedWithStripe = new Date();
    subscription.syncRequired = false;

    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription synced successfully",
      data: subscription.formatForResponse(),
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing subscription",
    });
  }
};

// ============================================================================
// PRIVATE HELPER FUNCTIONS
// ============================================================================

async function handleSubscriptionCreated(stripeSubscription) {
  try {
    const userId = stripeSubscription.metadata.userId;
    const planId = stripeSubscription.metadata.planId;

    if (!userId || !planId) {
      console.error("Missing metadata in subscription created event");
      return;
    }

    const plan = PLANS[planId];
    if (!plan) {
      console.error(`Invalid plan ID: ${planId}`);
      return;
    }

    // Find or create subscription record
    let subscription = await Subscription.findOne({
      userId,
    });

    if (!subscription) {
      subscription = new Subscription({
        userId,
        stripeCustomerId: stripeSubscription.customer,
        stripeSubscriptionId: stripeSubscription.id,
        planId,
        planName: plan.name,
        planPrice: plan.price,
        planBillingCycle: plan.interval === "year" ? "annually" : "monthly",
        status: stripeSubscription.status,
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000
        ),
        billingEmail:
          stripeSubscription.billing_details?.email ||
          (await User.findById(userId)).email,
        features: plan.features,
        usage: plan.usage,
      });
    } else {
      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.planId = planId;
      subscription.planName = plan.name;
      subscription.planPrice = plan.price;
      subscription.status = stripeSubscription.status;
      subscription.currentPeriodStart = new Date(
        stripeSubscription.current_period_start * 1000
      );
      subscription.currentPeriodEnd = new Date(
        stripeSubscription.current_period_end * 1000
      );
      subscription.features = plan.features;
      subscription.usage = plan.usage;

      // Store plan change history
      if (subscription.planId !== planId) {
        subscription.planChangeHistory.push({
          fromPlan: subscription.planId,
          toPlan: planId,
          changeReason: "Subscription created",
        });
      }
    }

    // Store trial info if applicable
    if (stripeSubscription.trial_start && stripeSubscription.trial_end) {
      subscription.trialStart = new Date(stripeSubscription.trial_start * 1000);
      subscription.trialEnd = new Date(stripeSubscription.trial_end * 1000);
      subscription.hasTrialUsed = true;
    }

    await subscription.save();

  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(stripeSubscription) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (!subscription) {
      console.error(`Subscription not found: ${stripeSubscription.id}`);
      return;
    }

    // Update status
    subscription.status = stripeSubscription.status;
    subscription.currentPeriodStart = new Date(
      stripeSubscription.current_period_start * 1000
    );
    subscription.currentPeriodEnd = new Date(
      stripeSubscription.current_period_end * 1000
    );
    subscription.lastSyncedWithStripe = new Date();

    // Handle cancellation date
    if (
      stripeSubscription.cancel_at_period_end &&
      stripeSubscription.cancel_at
    ) {
      subscription.willCancelAt = new Date(stripeSubscription.cancel_at * 1000);
    }

    await subscription.save();

      `Subscription updated for user ${subscription.userId}, status: ${stripeSubscription.status}`
    );
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

/**
 * Handle Stripe subscription.deleted webhook event
 * CRITICAL: This is where scheduled downgrades are executed
 *
 * Scenarios:
 * 1. User canceled subscription → Apply scheduled downgrade to free tier
 * 2. User downgraded plan → Apply scheduled downgrade to target plan
 * 3. Payment failed repeatedly → Mark as canceled
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id,
    });

    if (!subscription) {
      console.error(
        `❌ Subscription not found for Stripe ID: ${stripeSubscription.id}`
      );
      return;
    }

      `🔄 Processing subscription.deleted for user ${subscription.userId}`
    );
      `   Scheduled downgrade: ${
        subscription.scheduledDowngrade
          ? subscription.scheduledDowngrade.targetPlan
          : "none"
      }`
    );

    // SCENARIO 1: Scheduled downgrade exists (user canceled or downgraded)
    if (subscription.scheduledDowngrade) {
      const targetPlanId = subscription.scheduledDowngrade.targetPlan;
      const targetPlan = PLANS[targetPlanId];

      if (!targetPlan) {
        console.error(`❌ Invalid target plan: ${targetPlanId}`);
        // Fallback to free tier
        targetPlanId = "free";
      }

      const fromPlan = subscription.planId;

      // Apply the scheduled downgrade
      subscription.planId = targetPlanId;
      subscription.planName = targetPlan.name;
      subscription.planPrice = targetPlan.price;
      subscription.status = targetPlanId === "free" ? "free" : "active";
      subscription.features = targetPlan.features;

      // Reset usage limits to new plan
      subscription.usage = {
        jobApplications: {
          limit: targetPlan.usage.jobApplications.limit,
          used: 0, // Reset usage on plan change
        },
        profileViews: {
          limit: targetPlan.usage.profileViews.limit,
          used: 0,
        },
        jobPostings: {
          limit: targetPlan.usage.jobPostings.limit,
          used: 0,
        },
        messageThreads: {
          limit: targetPlan.usage.messageThreads.limit,
          used: 0,
        },
        bulkOperations: {
          limit: targetPlan.usage.bulkOperations.limit,
          used: 0,
        },
      };

      // Clear scheduled downgrade
      subscription.scheduledDowngrade = null;
      subscription.willCancelAt = null;

      // Update Stripe references
      if (targetPlanId === "free") {
        subscription.stripeSubscriptionId = null; // No active Stripe subscription for free tier
      }

      await subscription.save();

        `✅ Scheduled downgrade applied: ${fromPlan} → ${targetPlanId}`
      );
      return;
    }

    // SCENARIO 2: No scheduled downgrade (unexpected cancellation or payment failure)
    // Default to free tier
    subscription.planId = "free";
    subscription.planName = "Free Tier";
    subscription.planPrice = 0;
    subscription.status = "canceled";
    subscription.canceledAt = new Date();
    subscription.stripeSubscriptionId = null;

    // Apply free tier features
    subscription.features = PLANS.free.features;
    subscription.usage = {
      jobApplications: { limit: 5, used: 0 },
      profileViews: { limit: 50, used: 0 },
      jobPostings: { limit: 3, used: 0 },
      messageThreads: { limit: 10, used: 0 },
      bulkOperations: { limit: 0, used: 0 },
    };

    await subscription.save();

      `✅ Subscription canceled and downgraded to free tier for user ${subscription.userId}`
    );
  } catch (error) {
    console.error("❌ Error handling subscription deleted:", error);
    // Don't throw - webhook should return 200 even if processing fails
    // Stripe will retry if we return error
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeCustomerId: invoice.customer,
    });

    if (!subscription) {
      console.error(`Subscription not found for customer: ${invoice.customer}`);
      return;
    }

    // Add invoice to record
    await subscription.addInvoice(invoice);

    // Update payment tracking
    subscription.lastSuccessfulPayment = new Date();
    subscription.failedPaymentCount = 0;
    subscription.consecutiveFailures = 0;

    if (subscription.status === "past_due") {
      subscription.status = "active";
    }

    await subscription.save();

      `Invoice payment succeeded for user ${subscription.userId}, invoice: ${invoice.id}`
    );
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeCustomerId: invoice.customer,
    });

    if (!subscription) {
      console.error(`Subscription not found for customer: ${invoice.customer}`);
      return;
    }

    // Add invoice to record
    await subscription.addInvoice(invoice);

    // Update payment tracking
    subscription.lastPaymentAttempt = new Date();
    subscription.failedPaymentCount += 1;
    subscription.consecutiveFailures += 1;

    if (subscription.status !== "past_due") {
      subscription.status = "past_due";
    }

    // Schedule next retry
    if (invoice.next_payment_attempt) {
      subscription.nextAttemptDate = new Date(
        invoice.next_payment_attempt * 1000
      );
    }

    // Store failure reason
    const lastInvoice = subscription.getLastInvoice();
    if (lastInvoice) {
      lastInvoice.failureReason = invoice.last_finalization_error?.message;
    }

    await subscription.save();

    // Notify user (optional)
      `Invoice payment failed for user ${subscription.userId}, invoice: ${invoice.id}`
    );
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

async function handleCustomerUpdated(customer) {
  try {
    const subscription = await Subscription.findOne({
      stripeCustomerId: customer.id,
    });

    if (!subscription) {
      return;
    }

    // Update billing info if changed
    if (customer.email) {
      subscription.billingEmail = customer.email;
    }

    if (customer.address) {
      subscription.billingAddress = {
        line1: customer.address.line1,
        line2: customer.address.line2,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postal_code,
        country: customer.address.country,
      };
    }

    await subscription.save();
  } catch (error) {
    console.error("Error handling customer updated:", error);
  }
}

async function handleChargeRefunded(charge) {
  try {
    // Find subscription related to this charge
    const subscription = await Subscription.findOne({
      stripeCustomerId: charge.customer,
    });

    if (!subscription) {
      return;
    }

    // Update invoices with refund info if applicable
    const matchingInvoice = subscription.invoices.find(
      (inv) => inv.stripeInvoiceId === charge.invoice
    );

    if (matchingInvoice) {
      matchingInvoice.status = "refunded";
    }

    await subscription.save();

  } catch (error) {
    console.error("Error handling charge refunded:", error);
  }
}
