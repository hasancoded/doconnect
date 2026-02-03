// server/middleware/subscription.js - Subscription Authorization Middleware
const Subscription = require("../models/Subscription");

// @desc    Require active subscription
// @param   minPlanLevel - 'basic' | 'professional' | 'enterprise'
exports.requireSubscription = (minPlanLevel = "basic") => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: "Subscription required for this feature",
          requiredPlan: minPlanLevel,
        });
      }

      // Check if subscription is active
      if (!subscription.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your subscription is not active",
          currentStatus: subscription.status,
          upgrade: "Please upgrade or reactivate your subscription",
        });
      }

      // Check plan level
      const planLevels = { free: 0, basic: 1, professional: 2, enterprise: 3 };
      const requiredLevel = planLevels[minPlanLevel] || 1;
      const userLevel = planLevels[subscription.planId] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: `${minPlanLevel} plan or higher required`,
          currentPlan: subscription.planId,
          requiredPlan: minPlanLevel,
          upgradeTo: minPlanLevel,
        });
      }

      // Attach subscription to request
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error("Subscription middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking subscription status",
      });
    }
  };
};

// @desc    Check feature access
exports.requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: "Feature access requires subscription",
          feature: featureName,
        });
      }

      if (!subscription.canAccessFeature(featureName)) {
        return res.status(403).json({
          success: false,
          message: "Feature not available in your plan",
          feature: featureName,
          currentPlan: subscription.planId,
          requiredPlan: getMinPlanForFeature(featureName),
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error("Feature access error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking feature access",
      });
    }
  };
};

// @desc    Check usage limits
exports.checkUsageLimit = (usageType) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: "Subscription required",
        });
      }

      // Check usage limits - direct property access
      const usageData = subscription.usage?.[usageType];

      if (!usageData) {
        // If no usage tracking exists for this type, allow the operation
        req.subscription = subscription;
        return next();
      }

      const limit = usageData.limit || 0;
      const used = usageData.used || 0;
      const remaining = limit - used;

      if (remaining <= 0 && limit !== -1) {
        // -1 means unlimited
        return res.status(429).json({
          success: false,
          message: `${usageType} limit reached`,
          limit: limit,
          used: used,
          remaining: 0,
          upgrade: `Upgrade to ${getNextPlan(
            subscription.planId
          )} for higher limits`,
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error("Usage limit check error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking usage limit",
      });
    }
  };
};

// @desc    Track usage automatically
exports.trackUsageMiddleware = (usageType, amount = 1) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({
        userId: req.user._id,
      });

      if (subscription && subscription.usage[usageType]) {
        await subscription.trackUsage(usageType, amount);
      }

      next();
    } catch (error) {
      console.error("Usage tracking error:", error);
      // Don't block request on tracking error
      next();
    }
  };
};

// @desc    Attach subscription to request (optional)
exports.attachSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    req.subscription = subscription || null;
    next();
  } catch (error) {
    console.error("Subscription attachment error:", error);
    next();
  }
};

// @desc    Restrict to paying customers
exports.requirePaidPlan = (req, res, next) => {
  if (!req.subscription || req.subscription.planId === "free") {
    return res.status(403).json({
      success: false,
      message: "Paid plan required for this feature",
      currentPlan: "Free",
      action: "Upgrade your plan",
    });
  }
  next();
};

// @desc    Restrict to specific plans
exports.requirePlan = (...planIds) => {
  return (req, res, next) => {
    if (!req.subscription || !planIds.includes(req.subscription.planId)) {
      return res.status(403).json({
        success: false,
        message: "This feature requires specific plan",
        requiredPlans: planIds,
        currentPlan: req.subscription?.planId || "free",
      });
    }
    next();
  };
};

// @desc    Check if subscription needs renewal warning
exports.checkRenewalWarning = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
    });

    if (
      subscription &&
      subscription.isActive &&
      subscription.daysUntilRenewal <= 7
    ) {
      res.set("X-Subscription-Renewal-Days", subscription.daysUntilRenewal);
      res.set("X-Subscription-Renewal-Date", subscription.currentPeriodEnd);
    }

    next();
  } catch (error) {
    console.error("Renewal warning error:", error);
    next();
  }
};

// @desc    Rate limiting based on plan
exports.planBasedRateLimit = (req, res, next) => {
  if (!req.subscription) {
    return res.status(429).json({
      success: false,
      message: "Rate limit applied. Please upgrade your plan.",
    });
  }

  // Different limits based on plan
  const rateLimits = {
    free: 10,
    basic: 50,
    professional: 200,
    enterprise: 1000,
  };

  const limit = rateLimits[req.subscription.planId] || 10;
  res.set("X-RateLimit-Limit", limit);

  next();
};

// Helper functions
function getMinPlanForFeature(featureName) {
  const featurePlanMap = {
    unlimitedApplications: "basic",
    advancedSearch: "basic",
    featuredJobPostings: "professional",
    directMessaging: "basic",
    advancedAnalytics: "professional",
    prioritySupport: "professional",
    customBranding: "enterprise",
    apiAccess: "enterprise",
    bulkOperations: "professional",
    scheduledPosting: "professional",
  };

  return featurePlanMap[featureName] || "basic";
}

function getNextPlan(currentPlan) {
  const planSequence = {
    free: "basic",
    basic: "professional",
    professional: "enterprise",
    enterprise: "enterprise",
  };

  return planSequence[currentPlan] || "basic";
}
