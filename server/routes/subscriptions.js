// server/routes/subscriptions.js - Subscription Management Routes
const express = require("express");
const { body, query, param } = require("express-validator");
const { protect, requireActive, requireAdmin } = require("../middleware/auth");

const {
  createCheckoutSession,
  handleWebhook,
  getCurrentSubscription,
  cancelSubscription,
  reactivateSubscription,
  updatePaymentMethod,
  getInvoices,
  upgradePlan,
  downgradePlan,
  getPlans,
  trackUsage,
  checkFeatureAccess,
  syncSubscriptionWithStripe,
} = require("../controllers/subscriptionController");

const router = express.Router();

// Validation middleware
const validateCheckoutSession = [
  body("planId")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isIn(["free", "basic", "professional", "enterprise"])
    .withMessage("Invalid plan ID"),
  body("billingCycle")
    .optional()
    .isIn(["monthly", "annually"])
    .withMessage("Billing cycle must be monthly or annually"),
];

const validateCancellation = [
  body("reason")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters")
    .trim(),
  body("feedback")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Feedback cannot exceed 1000 characters")
    .trim(),
];

const validatePlanChange = [
  body("targetPlanId")
    .notEmpty()
    .withMessage("Target plan ID is required")
    .isIn(["free", "basic", "professional", "enterprise"])
    .withMessage("Invalid plan ID"),
];

const validateUsageTracking = [
  body("usageType")
    .notEmpty()
    .withMessage("Usage type is required")
    .isIn([
      "jobApplications",
      "profileViews",
      "jobPostings",
      "messageThreads",
      "bulkOperations",
    ])
    .withMessage("Invalid usage type"),
  body("amount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Amount must be a positive integer"),
];

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// Get subscription plans (public)
router.get("/plans", getPlans);

// ============================================================================
// WEBHOOK ROUTE (CRITICAL: Must use raw body)
// ============================================================================

// This route MUST be before other routes and use raw body parsing
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

// All routes below require authentication
router.use(protect);

// Get current subscription
router.get("/current", getCurrentSubscription);

// Create checkout session for new subscription
router.post(
  "/create-checkout-session",
  requireActive,
  validateCheckoutSession,
  createCheckoutSession
);

// Cancel subscription
router.post("/cancel", requireActive, validateCancellation, cancelSubscription);

// Reactivate canceled subscription
router.post("/reactivate", reactivateSubscription);

// Update payment method
router.post("/update-payment-method", requireActive, updatePaymentMethod);

// Get invoices
router.get("/invoices", getInvoices);

// Upgrade plan
router.post("/upgrade", requireActive, validatePlanChange, upgradePlan);

// Downgrade plan
router.post("/downgrade", requireActive, validatePlanChange, downgradePlan);

// Track usage (internal)
router.post("/track-usage", validateUsageTracking, trackUsage);

// Check feature access
router.get(
  "/feature/:featureName",
  param("featureName").notEmpty().withMessage("Feature name is required"),
  checkFeatureAccess
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Admin: Sync subscription with Stripe
router.post(
  "/admin/sync",
  requireAdmin,
  body("userId").isMongoId().withMessage("Invalid user ID"),
  syncSubscriptionWithStripe
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

router.use((error, req, res, next) => {
  console.error("Subscription routes error:", error);

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

  res.status(500).json({
    success: false,
    message: "Error processing subscription request",
  });
});

module.exports = router;
