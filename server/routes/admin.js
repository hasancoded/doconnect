// server/routes/admin.js - Admin Verification Routes
const express = require("express");
const { body, query, param } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const {
  getPendingVerifications,
  getProfileForVerification,
  verifyIdentity,
  verifyMedicalLicense,
  verifyBackgroundCheck,
  revokeVerification,
  getVerifiedUsers,
  getRejectedUsers,
  bulkVerification,
  getVerificationStats,
  getLiveMetrics,
  getAdminDashboard,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Validation middleware
const validateVerificationStatus = [
  body("status")
    .isIn(["pending", "verified", "rejected"])
    .withMessage("Status must be pending, verified, or rejected"),
  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters")
    .trim(),
  body("documentIds")
    .optional()
    .isArray()
    .withMessage("Document IDs must be an array"),
  body("documentIds.*")
    .if(body("documentIds").exists())
    .isMongoId()
    .withMessage("Invalid document ID"),
];

const validateBulkVerification = [
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("User IDs array is required and must contain at least one ID"),
  body("userIds.*").isMongoId().withMessage("Invalid user ID"),
  body("verificationType")
    .isIn(["identity", "medical_license", "background_check"])
    .withMessage("Invalid verification type"),
  body("status")
    .isIn(["pending", "verified", "rejected"])
    .withMessage("Status must be pending, verified, or rejected"),
  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters")
    .trim(),
];

const validateGetPending = [
  query("type")
    .optional()
    .isIn(["all", "identity", "medical_license", "background_check"])
    .withMessage("Invalid verification type"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const validateGetStats = [
  query("timeframe")
    .optional()
    .isIn(["7d", "30d", "90d", "all"])
    .withMessage("Invalid timeframe"),
];

// Dashboard and overview routes
router.get("/dashboard", getAdminDashboard);
router.get("/metrics/live", getLiveMetrics);
router.get("/verification/stats", validateGetStats, getVerificationStats);

// Verification management routes
router.get(
  "/verification/pending",
  validateGetPending,
  getPendingVerifications,
);
router.get(
  "/verification/profile/:userId",
  param("userId").isMongoId().withMessage("Invalid user ID"),
  getProfileForVerification,
);

// Individual verification routes
router.put(
  "/verification/identity/:userId",
  param("userId").isMongoId().withMessage("Invalid user ID"),
  validateVerificationStatus,
  verifyIdentity,
);

router.put(
  "/verification/medical-license/:userId",
  param("userId").isMongoId().withMessage("Invalid user ID"),
  [
    ...validateVerificationStatus,
    body("licenseVerified")
      .optional()
      .isBoolean()
      .withMessage("License verified must be a boolean"),
  ],
  verifyMedicalLicense,
);

router.put(
  "/verification/background-check/:userId",
  param("userId").isMongoId().withMessage("Invalid user ID"),
  [
    ...validateVerificationStatus,
    body("backgroundCheckPassed")
      .optional()
      .isBoolean()
      .withMessage("Background check passed must be a boolean"),
  ],
  verifyBackgroundCheck,
);

// Get verified/approved doctors
router.get("/verification/approved", getVerifiedUsers);

// Get rejected users
router.get("/verification/rejected", getRejectedUsers);

// Revoke verification
router.put(
  "/verification/revoke/:userId",
  param("userId").isMongoId().withMessage("Invalid user ID"),
  [
    body("verificationType")
      .isIn(["identity", "medical_license", "background_check"])
      .withMessage("Invalid verification type"),
    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes cannot exceed 1000 characters")
      .trim(),
  ],
  revokeVerification,
);

// Bulk operations
router.put("/verification/bulk", validateBulkVerification, bulkVerification);

module.exports = router;
