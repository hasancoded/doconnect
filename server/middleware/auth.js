const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Subscription = require("../models/Subscription");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "No user found with this token",
      });
    }

    // Check if user account is accessible

    // ✅ FIXED: Allow both 'active' and 'pending' accounts
    // Only reject 'inactive' and 'suspended' accounts
    if (!["active", "pending"].includes(user.accountStatus)) {
      return res.status(401).json({
        success: false,
        message: "User account has been deactivated or suspended",
      });
    }

    // ✅ NEW: Attach subscription data to user object
    try {
      const subscription = await Subscription.findOne({ userId: user._id });

      // If no subscription exists, create a free tier subscription
      if (!subscription) {
        const newSubscription = await Subscription.findOneAndUpdate(
          { userId: user._id },
          {
            $setOnInsert: {
              userId: user._id,
              stripeCustomerId: `temp_${user._id}`,
              planId: "free",
              planName: "Free Tier",
              status: "free",
              billingEmail: user.email,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000,
              ),
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
                jobApplications: { limit: 5, used: 0 },
                profileViews: { limit: 50, used: 0 },
                jobPostings: { limit: 3, used: 0 },
                messageThreads: { limit: 10, used: 0 },
                bulkOperations: { limit: 0, used: 0 },
              },
              invoices: [],
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );
        user.subscription = newSubscription;
      } else {
        user.subscription = subscription;
      }
    } catch (subError) {
      console.error("Error loading subscription:", subError);
      // Don't fail auth if subscription loading fails, just set to null
      user.subscription = null;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is verified
exports.requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Account verification required to access this resource",
    });
  }
  next();
};

// Check if user has active subscription
exports.requireSubscription = (req, res, next) => {
  if (req.user.subscriptionStatus !== "active") {
    return res.status(403).json({
      success: false,
      message: "Active subscription required to access this resource",
    });
  }
  next();
};

// ✅ NEW: Allow only active accounts (for sensitive operations)
exports.requireActive = (req, res, next) => {
  if (req.user.accountStatus !== "active") {
    return res.status(403).json({
      success: false,
      message:
        "Active account status required for this operation. Please complete your account verification.",
    });
  }
  next();
};

// ✅ NEW: Allow only verified accounts (for professional features)
exports.requireVerifiedAccount = (req, res, next) => {
  // Check if user has overall verification status
  const hasVerificationStatus =
    req.user.verificationStatus && req.user.verificationStatus.overall;

  if (
    !hasVerificationStatus ||
    req.user.verificationStatus.overall !== "verified"
  ) {
    return res.status(403).json({
      success: false,
      message: "Account verification required for this professional feature",
    });
  }
  next();
};

// ✅ NEW: Check if user is admin (alternative to authorize for cleaner usage)
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// ✅ NEW: Check account status and provide appropriate guidance
exports.checkAccountStatus = (req, res, next) => {
  const status = req.user.accountStatus;

  // Add status info to request for controllers to use
  req.accountStatusInfo = {
    status: status,
    isPending: status === "pending",
    isActive: status === "active",
    canAccessBasicFeatures: ["active", "pending"].includes(status),
    canAccessProfessionalFeatures: status === "active",
  };

  next();
};
