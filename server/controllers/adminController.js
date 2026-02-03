// server/controllers/adminController.js - COMPLETE FIXED VERSION
const User = require("../models/User");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// ✅ ADD: ObjectId validation helper
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @desc    Get all profiles pending verification
// @route   GET /api/admin/verification/pending
// @access  Private/Admin
exports.getPendingVerifications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { type = "all", page = 1, limit = 20 } = req.query;

    // Validate type parameter
    const validTypes = [
      "all",
      "identity",
      "medical_license",
      "background_check",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification type",
        errors: [
          {
            type: "field",
            value: type,
            msg: "Type must be one of: all, identity, medical_license, background_check",
            path: "type",
            location: "query",
          },
        ],
      });
    }

    let query = {
      accountStatus: { $in: ["active", "pending"] },
      // Exclude users with any rejected verification
      "verificationStatus.identity": { $ne: "rejected" },
      "verificationStatus.medical_license": { $ne: "rejected" },
      "verificationStatus.background_check": { $ne: "rejected" },
    };

    // Filter by verification type
    if (type !== "all") {
      query[`verificationStatus.${type}`] = "pending";
    } else {
      query.$or = [
        { "verificationStatus.identity": "pending" },
        { "verificationStatus.medical_license": "pending" },
        { "verificationStatus.background_check": "pending" },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await User.find(query)
      .select(
        "firstName lastName email profilePhoto verificationStatus documents createdAt primarySpecialty medicalLicenseNumber licenseState yearsOfExperience medicalSchool accountStatus role",
      )
      .populate("documents")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending verifications",
    });
  }
};

// @desc    Get detailed profile for verification
// @route   GET /api/admin/verification/profile/:userId
// @access  Private/Admin
exports.getProfileForVerification = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ FIX: Validate ObjectId FIRST
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const profile = await User.findById(userId)
      .select("-password")
      .populate("documents")
      .populate("reviews.reviewer", "firstName lastName profilePhoto");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Include verification history if needed (future enhancement)
    const verificationData = {
      profile,
      verificationHistory: [], // Placeholder for future implementation
      riskFactors: await calculateRiskFactors(profile),
      recommendations: generateVerificationRecommendations(profile),
    };

    res.status(200).json({
      success: true,
      data: verificationData,
    });
  } catch (error) {
    console.error("Error fetching profile for verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile for verification",
    });
  }
};

// @desc    Verify user identity
// @route   PUT /api/admin/verification/identity/:userId
// @access  Private/Admin
exports.verifyIdentity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;

    // ✅ FIX: Validate ObjectId FIRST
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { status, notes, documentIds } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update verification status
    user.verificationStatus.identity = status;

    // Update document verification status
    if (documentIds && documentIds.length > 0) {
      documentIds.forEach((docId) => {
        const document = user.documents.id(docId);
        if (document) {
          document.verified = status === "verified";
          document.verifiedBy = req.user.id;
          document.verifiedAt = new Date();
          if (status === "rejected" && notes) {
            document.rejectionReason = notes;
          }
        }
      });
    }

    // Update overall verification status
    user.updateVerificationStatus();

    await user.save();

    res.status(200).json({
      success: true,
      message: `Identity verification ${status} successfully`,
      data: {
        verificationStatus: user.verificationStatus,
        overallStatus: user.verificationStatus.overall,
      },
    });
  } catch (error) {
    console.error("Error verifying identity:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying identity",
    });
  }
};

// @desc    Verify medical license
// @route   PUT /api/admin/verification/medical-license/:userId
// @access  Private/Admin
exports.verifyMedicalLicense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;

    // ✅ FIX: Validate ObjectId FIRST
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { status, notes, licenseVerified, documentIds } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update verification status
    user.verificationStatus.medical_license = status;

    // Update document verification status for medical license documents
    if (documentIds && documentIds.length > 0) {
      documentIds.forEach((docId) => {
        const document = user.documents.id(docId);
        if (document && document.type === "medical_license") {
          document.verified = status === "verified";
          document.verifiedBy = req.user.id;
          document.verifiedAt = new Date();
          if (status === "rejected" && notes) {
            document.rejectionReason = notes;
          }
        }
      });
    }

    // Update overall verification status
    user.updateVerificationStatus();

    await user.save();

    res.status(200).json({
      success: true,
      message: `Medical license verification ${status} successfully`,
      data: {
        verificationStatus: user.verificationStatus,
        overallStatus: user.verificationStatus.overall,
      },
    });
  } catch (error) {
    console.error("Error verifying medical license:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying medical license",
    });
  }
};

// @desc    Verify background check
// @route   PUT /api/admin/verification/background-check/:userId
// @access  Private/Admin
exports.verifyBackgroundCheck = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;

    // ✅ FIX: Validate ObjectId FIRST
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { status, notes, backgroundCheckPassed } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update verification status
    user.verificationStatus.background_check = status;

    // Update overall verification status
    user.updateVerificationStatus();

    await user.save();

    res.status(200).json({
      success: true,
      message: `Background check verification ${status} successfully`,
      data: {
        verificationStatus: user.verificationStatus,
        overallStatus: user.verificationStatus.overall,
      },
    });
  } catch (error) {
    console.error("Error verifying background check:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying background check",
    });
  }
};

// @desc    Revoke verification status (set back to pending)
// @route   PUT /api/admin/verification/revoke/:userId
// @access  Private/Admin
exports.revokeVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { userId } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { verificationType, notes } = req.body;

    if (
      !["identity", "medical_license", "background_check"].includes(
        verificationType,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid verification type. Must be: identity, medical_license, or background_check",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Revoke the verification (set to pending)
    user.verificationStatus[verificationType] = "pending";

    // Update overall verification status
    user.updateVerificationStatus();

    await user.save();

    res.status(200).json({
      success: true,
      message: `${verificationType.replace("_", " ")} verification revoked successfully`,
      data: {
        verificationStatus: user.verificationStatus,
        overallStatus: user.verificationStatus.overall,
      },
    });
  } catch (error) {
    console.error("Error revoking verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while revoking verification",
    });
  }
};

// @desc    Get all verified/approved doctors
// @route   GET /api/admin/verification/approved
// @access  Private/Admin
exports.getVerifiedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    // Query for users with identity verified (approved doctors)
    let query = {
      "verificationStatus.identity": "verified",
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await User.find(query)
      .select(
        "firstName lastName email profilePhoto verificationStatus documents createdAt primarySpecialty medicalLicenseNumber licenseState yearsOfExperience medicalSchool accountStatus role",
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching verified users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verified users",
    });
  }
};

// @desc    Get all rejected users (any verification type rejected)
// @route   GET /api/admin/verification/rejected
// @access  Private/Admin
exports.getRejectedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    let query = {
      $or: [
        { "verificationStatus.identity": "rejected" },
        { "verificationStatus.medical_license": "rejected" },
        { "verificationStatus.background_check": "rejected" },
      ],
    };

    // Add search filter if provided
    if (search) {
      query = {
        $and: [
          query,
          {
            $or: [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const profiles = await User.find(query)
      .select(
        "firstName lastName email profilePhoto verificationStatus documents createdAt primarySpecialty medicalLicenseNumber licenseState yearsOfExperience medicalSchool accountStatus role",
      )
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching rejected users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching rejected users",
    });
  }
};

// @desc    Bulk verification action
// @route   PUT /api/admin/verification/bulk
// @access  Private/Admin
exports.bulkVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { userIds, verificationType, status, notes } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    // ✅ FIX: Validate all ObjectIds
    const invalidIds = userIds.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        invalidIds: invalidIds,
      });
    }

    const updateQuery = {};
    updateQuery[`verificationStatus.${verificationType}`] = status;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateQuery,
    );

    // Update overall verification status for each user
    const users = await User.find({ _id: { $in: userIds } });
    const updatePromises = users.map(async (user) => {
      user.updateVerificationStatus();
      return user.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Bulk verification completed for ${result.modifiedCount} users`,
      data: {
        modifiedCount: result.modifiedCount,
        requestedCount: userIds.length,
      },
    });
  } catch (error) {
    console.error("Error performing bulk verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while performing bulk verification",
    });
  }
};

// @desc    Get verification statistics
// @route   GET /api/admin/verification/stats
// @access  Private/Admin
exports.getVerificationStats = async (req, res) => {
  try {
    const { timeframe = "30d" } = req.query;

    // ✅ FIX: Validate timeframe parameter
    const validTimeframes = ["7d", "30d", "90d", "all"];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timeframe",
        validTimeframes: validTimeframes,
      });
    }

    let dateFilter = {};
    if (timeframe === "7d") {
      dateFilter = {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      };
    } else if (timeframe === "30d") {
      dateFilter = {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      };
    } else if (timeframe === "90d") {
      dateFilter = {
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      };
    }

    // Overall statistics
    const totalUsers = await User.countDocuments({
      accountStatus: { $in: ["active", "pending"] },
    });

    // Fully Verified: All 3 verifications approved
    const verifiedUsers = await User.countDocuments({
      "verificationStatus.identity": "verified",
      "verificationStatus.medical_license": "verified",
      "verificationStatus.background_check": "verified",
    });

    // Partially Verified: At least one verified but not all three
    // (has at least one pending or mix of verified/pending)
    const partiallyVerified = await User.countDocuments({
      $and: [
        // At least one is verified
        {
          $or: [
            { "verificationStatus.identity": "verified" },
            { "verificationStatus.medical_license": "verified" },
            { "verificationStatus.background_check": "verified" },
          ],
        },
        // But NOT all three are verified
        {
          $or: [
            { "verificationStatus.identity": { $ne: "verified" } },
            { "verificationStatus.medical_license": { $ne: "verified" } },
            { "verificationStatus.background_check": { $ne: "verified" } },
          ],
        },
      ],
    });

    // Unverified: None are verified (all pending or unverified)
    const unverified = await User.countDocuments({
      "verificationStatus.identity": { $ne: "verified" },
      "verificationStatus.medical_license": { $ne: "verified" },
      "verificationStatus.background_check": { $ne: "verified" },
    });

    // Pending verifications (excluding users with any rejected verification)
    // Using $and to avoid MongoDB query key conflicts
    const pendingIdentity = await User.countDocuments({
      "verificationStatus.identity": "pending",
      "verificationStatus.medical_license": { $ne: "rejected" },
      "verificationStatus.background_check": { $ne: "rejected" },
    });
    const pendingMedicalLicense = await User.countDocuments({
      "verificationStatus.medical_license": "pending",
      "verificationStatus.identity": { $ne: "rejected" },
      "verificationStatus.background_check": { $ne: "rejected" },
    });
    const pendingBackgroundCheck = await User.countDocuments({
      "verificationStatus.background_check": "pending",
      "verificationStatus.identity": { $ne: "rejected" },
      "verificationStatus.medical_license": { $ne: "rejected" },
    });

    // Count unique users with ANY pending verification (matching Verification Queue)
    const pendingUsersTotal = await User.countDocuments({
      "verificationStatus.identity": { $ne: "rejected" },
      "verificationStatus.medical_license": { $ne: "rejected" },
      "verificationStatus.background_check": { $ne: "rejected" },
      $or: [
        { "verificationStatus.identity": "pending" },
        { "verificationStatus.medical_license": "pending" },
        { "verificationStatus.background_check": "pending" },
      ],
    });

    // Recent activity
    const recentUsers = await User.countDocuments(dateFilter);
    const recentVerified = await User.countDocuments({
      ...dateFilter,
      "verificationStatus.overall": "verified",
    });

    // Specialties breakdown
    const specialtiesData = await User.aggregate([
      { $match: { accountStatus: { $in: ["active", "pending"] } } },
      { $group: { _id: "$primarySpecialty", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const stats = {
      overview: {
        totalUsers,
        verifiedUsers,
        partiallyVerified,
        unverified,
        verificationRate:
          totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0,
      },
      pending: {
        identity: pendingIdentity,
        medicalLicense: pendingMedicalLicense,
        backgroundCheck: pendingBackgroundCheck,
        total: pendingUsersTotal, // Unique users with any pending verification
      },
      recent: {
        newUsers: recentUsers,
        newVerified: recentVerified,
        timeframe,
      },
      specialties: specialtiesData,
      averageVerificationTime: "2.5 days", // Placeholder for future calculation
      topRejectionReasons: [
        // Placeholder for future implementation
        "Incomplete documentation",
        "License verification failed",
        "Identity mismatch",
      ],
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verification stats",
    });
  }
};

// @desc    Get live metrics (lightweight for polling)
// @route   GET /api/admin/metrics/live
// @access  Private/Admin
exports.getLiveMetrics = async (req, res) => {
  try {
    // Get only essential metrics for real-time updates
    const [
      totalUsers,
      activeUsers,
      pendingVerification,
      activeJobs,
      pendingIdentity,
      pendingMedicalLicense,
      pendingBackgroundCheck,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: "active" }),
      User.countDocuments({
        "verificationStatus.overall": { $in: ["unverified", "partial"] },
      }),
      require("../models/Job").countDocuments({ status: "active" }),
      User.countDocuments({ "verificationStatus.identity": "pending" }),
      User.countDocuments({ "verificationStatus.medical_license": "pending" }),
      User.countDocuments({
        "verificationStatus.background_check": "pending",
      }),
    ]);

    const metrics = {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      verification: {
        pending: pendingVerification,
        pendingByType: {
          identity: pendingIdentity,
          medicalLicense: pendingMedicalLicense,
          backgroundCheck: pendingBackgroundCheck,
        },
      },
      jobs: {
        active: activeJobs,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching live metrics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching live metrics",
    });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Get key metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ accountStatus: "active" });
    const pendingUsers = await User.countDocuments({
      accountStatus: "pending",
    });

    const seniorDoctors = await User.countDocuments({
      role: "senior",
      accountStatus: "active",
    });
    const juniorDoctors = await User.countDocuments({
      role: "junior",
      accountStatus: "active",
    });

    const fullyVerified = await User.countDocuments({
      "verificationStatus.overall": "verified",
    });
    const pendingVerification = await User.countDocuments({
      "verificationStatus.overall": { $in: ["unverified", "partial"] },
    });

    // Recent activity (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: last7Days },
    });
    const recentlyVerified = await User.countDocuments({
      "verificationStatus.overall": "verified",
      updatedAt: { $gte: last7Days },
    });

    // Top specialties
    const topSpecialties = await User.aggregate([
      { $match: { accountStatus: "active" } },
      { $group: { _id: "$primarySpecialty", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Users requiring attention
    const usersNeedingAttention = await User.find({
      $or: [
        { "verificationStatus.identity": "pending" },
        { "verificationStatus.medical_license": "pending" },
        { "verificationStatus.background_check": "pending" },
        { accountStatus: "pending" },
      ],
    })
      .select(
        "firstName lastName email verificationStatus accountStatus createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(10);

    const dashboardData = {
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
        },
        doctors: {
          senior: seniorDoctors,
          junior: juniorDoctors,
        },
        verification: {
          verified: fullyVerified,
          pending: pendingVerification,
          rate:
            totalUsers > 0
              ? ((fullyVerified / totalUsers) * 100).toFixed(1)
              : 0,
        },
        activity: {
          newUsers,
          recentlyVerified,
        },
      },
      topSpecialties,
      usersNeedingAttention,
      quickActions: [
        {
          label: "Pending Identity Verification",
          count: await User.countDocuments({
            "verificationStatus.identity": "pending",
          }),
          url: "/admin/verification?type=identity",
        },
        {
          label: "Pending License Verification",
          count: await User.countDocuments({
            "verificationStatus.medical_license": "pending",
          }),
          url: "/admin/verification?type=medical_license",
        },
        {
          label: "Pending Background Check",
          count: await User.countDocuments({
            "verificationStatus.background_check": "pending",
          }),
          url: "/admin/verification?type=background_check",
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin dashboard",
    });
  }
};

// Helper function to calculate risk factors
const calculateRiskFactors = async (profile) => {
  const riskFactors = [];

  // Check for incomplete profile
  if (profile.profileCompletion?.percentage < 50) {
    riskFactors.push({
      type: "incomplete_profile",
      severity: "medium",
      description: "Profile is less than 50% complete",
    });
  }

  // Check for missing documents
  if (!profile.documents || profile.documents.length === 0) {
    riskFactors.push({
      type: "no_documents",
      severity: "high",
      description: "No verification documents uploaded",
    });
  }

  // Check for suspicious activity patterns
  if (profile.loginAttempts > 5) {
    riskFactors.push({
      type: "high_failed_logins",
      severity: "high",
      description: "High number of failed login attempts",
    });
  }

  // Check account age
  const accountAge = Date.now() - profile.createdAt.getTime();
  const daysOld = accountAge / (24 * 60 * 60 * 1000);

  if (daysOld < 1) {
    riskFactors.push({
      type: "new_account",
      severity: "low",
      description: "Account created very recently",
    });
  }

  return riskFactors;
};

// Helper function to generate verification recommendations
const generateVerificationRecommendations = (profile) => {
  const recommendations = [];

  // Document-based recommendations
  const licenseDoc = profile.documents?.find(
    (doc) => doc.type === "medical_license",
  );
  if (!licenseDoc) {
    recommendations.push("Request medical license documentation");
  } else if (!licenseDoc.verified) {
    recommendations.push(
      "Verify medical license document against state registry",
    );
  }

  const idDoc = profile.documents?.find((doc) => doc.type === "identification");
  if (!idDoc) {
    recommendations.push("Request government-issued identification");
  }

  // Profile completeness recommendations
  if (profile.profileCompletion?.percentage < 70) {
    recommendations.push("Encourage profile completion before verification");
  }

  // Experience verification
  if (!profile.experiences || profile.experiences.length === 0) {
    recommendations.push("Request professional experience documentation");
  }

  return recommendations;
};

module.exports = {
  getPendingVerifications: exports.getPendingVerifications,
  getProfileForVerification: exports.getProfileForVerification,
  verifyIdentity: exports.verifyIdentity,
  verifyMedicalLicense: exports.verifyMedicalLicense,
  verifyBackgroundCheck: exports.verifyBackgroundCheck,
  revokeVerification: exports.revokeVerification,
  getVerifiedUsers: exports.getVerifiedUsers,
  getRejectedUsers: exports.getRejectedUsers,
  bulkVerification: exports.bulkVerification,
  getVerificationStats: exports.getVerificationStats,
  getLiveMetrics: exports.getLiveMetrics,
  getAdminDashboard: exports.getAdminDashboard,
};
