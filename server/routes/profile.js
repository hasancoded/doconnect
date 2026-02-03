// server/routes/profile.js - Profile Management Routes
const express = require("express");
const { body, query, param } = require("express-validator");

const {
  protect,
  authorize,
  requireActive,
  requireVerifiedAccount,
  checkAccountStatus,
} = require("../middleware/auth");

const {
  getMyProfile,
  getPublicProfile,
  updateBasicProfile,
  uploadProfilePhoto,
  uploadDocuments,
  deleteDocument,
  addExperience,
  updateExperience,
  deleteExperience,
  updateSkills,
  addCertification,
  updateCertification,
  deleteCertification,
  updateAvailability,
  updatePrivacy,
  searchProfiles,
  getAnalytics,
} = require("../controllers/profileController");

const router = express.Router();

// Validation middleware (keeping your existing validation)
const validateBasicProfile = [
  body("firstName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .trim()
    .escape(),
  body("lastName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .trim()
    .escape(),
  body("bio")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Bio cannot exceed 2000 characters")
    .trim(),
  body("location.city")
    .optional()
    .isLength({ max: 100 })
    .withMessage("City name cannot exceed 100 characters")
    .trim()
    .escape(),
  body("location.state")
    .optional()
    .isLength({ max: 100 })
    .withMessage("State name cannot exceed 100 characters")
    .trim()
    .escape(),
  body("location.country")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Country name cannot exceed 100 characters")
    .trim()
    .escape(),
  body("location.timezone")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Timezone must be valid")
    .trim(),
  body("languages")
    .optional()
    .isArray()
    .withMessage("Languages must be an array"),
  body("languages.*.language")
    .if(body("languages").exists())
    .notEmpty()
    .withMessage("Language name is required")
    .trim()
    .escape(),
  body("languages.*.proficiency")
    .if(body("languages").exists())
    .isIn(["basic", "conversational", "fluent", "native"])
    .withMessage("Invalid proficiency level"),
  body("subspecialties")
    .optional()
    .isArray()
    .withMessage("Subspecialties must be an array"),
  body("subspecialties.*")
    .if(body("subspecialties").exists())
    .isLength({ min: 1, max: 100 })
    .withMessage("Subspecialty must be between 1 and 100 characters")
    .trim()
    .escape(),
  body("preferences.projectTypes")
    .optional()
    .isArray()
    .withMessage("Project types must be an array"),
  body("preferences.projectTypes.*")
    .if(body("preferences.projectTypes").exists())
    .isIn([
      "consultation",
      "second_opinion",
      "chart_review",
      "research",
      "writing",
      "teaching",
      "other",
    ])
    .withMessage("Invalid project type"),
  body("preferences.minimumRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum rate must be a positive number"),
  body("preferences.preferredProjectDuration")
    .optional()
    .isIn(["short_term", "medium_term", "long_term", "flexible"])
    .withMessage("Invalid project duration preference"),
  body("preferences.remoteOnly")
    .optional()
    .isBoolean()
    .withMessage("Remote only must be a boolean"),
  body("preferences.maxSimultaneousProjects")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Max simultaneous projects must be between 1 and 10"),
];

const validateExperience = [
  body("title")
    .notEmpty()
    .withMessage("Experience title is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("institution")
    .notEmpty()
    .withMessage("Institution name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Institution name must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .toDate(),
  body("endDate")
    .custom((value, { req }) => {
      const isCurrent =
        req.body.current === true || req.body.current === "true";
      if (!isCurrent && !value) {
        throw new Error("End date is required for past experiences");
      }
      return true;
    })
    .if((value) => value)
    .isISO8601()
    .withMessage("End date must be a valid date")
    .toDate(),
  body("current")
    .optional()
    .isBoolean()
    .withMessage("Current must be a boolean"),
  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters")
    .trim(),
  body("type")
    .notEmpty()
    .withMessage("Experience type is required")
    .isIn(["residency", "fellowship", "employment", "education"])
    .withMessage("Invalid experience type"),
];

const validateSkills = [
  body("skills")
    .isArray({ min: 1 })
    .withMessage("Skills must be an array with at least one skill"),
  body("skills.*.name")
    .notEmpty()
    .withMessage("Skill name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Skill name must be between 1 and 100 characters")
    .trim()
    .escape(),
  body("skills.*.category")
    .optional()
    .isIn(["clinical", "research", "administrative", "technical", "other"])
    .withMessage("Invalid skill category"),
  body("skills.*.proficiencyLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "expert"])
    .withMessage("Invalid proficiency level"),
  body("skills.*.yearsOfExperience")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Years of experience must be between 0 and 50"),
];

const validateCertification = [
  body("name")
    .notEmpty()
    .withMessage("Certification name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Certification name must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("issuingOrganization")
    .notEmpty()
    .withMessage("Issuing organization is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Issuing organization must be between 2 and 100 characters")
    .trim()
    .escape(),
  body("issueDate")
    .notEmpty()
    .withMessage("Issue date is required")
    .isISO8601()
    .withMessage("Issue date must be a valid date")
    .toDate(),
  body("expirationDate")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("Expiration date must be a valid date")
    .toDate(),
  body("credentialId")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Credential ID cannot exceed 100 characters")
    .trim(),
  body("credentialUrl")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Credential URL must be a valid URL"),
];

const validateAvailability = [
  body("timezone")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Timezone is required")
    .trim(),
  body("weeklySchedule")
    .optional()
    .isArray()
    .withMessage("Weekly schedule must be an array"),
  body("weeklySchedule.*.day")
    .if(body("weeklySchedule").exists())
    .isIn([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .withMessage("Invalid day of week"),
  body("weeklySchedule.*.available")
    .if(body("weeklySchedule").exists())
    .optional()
    .isBoolean()
    .withMessage("Available must be a boolean"),
  body("weeklySchedule.*.timeSlots")
    .if(body("weeklySchedule").exists())
    .optional()
    .isArray()
    .withMessage("Time slots must be an array"),
  body("hoursPerWeek")
    .optional()
    .isInt({ min: 0, max: 168 })
    .withMessage("Hours per week must be between 0 and 168"),
  body("responseTime")
    .optional()
    .isIn(["immediate", "within-hour", "within-day", "within-week"])
    .withMessage("Invalid response time"),
];

const validateSearch = [
  query("q")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters")
    .trim(),
  query("specialty")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Specialty must be between 1 and 100 characters")
    .trim(),
  query("experience")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Experience must be between 0 and 50 years"),
  query("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
  query("location")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Location must be between 1 and 100 characters")
    .trim(),
  query("verified")
    .optional()
    .isBoolean()
    .withMessage("Verified must be a boolean"),
  query("sortBy")
    .optional()
    .isIn(["relevance", "rating", "experience", "recent"])
    .withMessage("Invalid sort option"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const validatePrivacy = [
  body("profileVisibility")
    .optional()
    .isIn(["public", "members_only", "private"])
    .withMessage("Invalid profile visibility setting"),
  body("showEmail")
    .optional()
    .isBoolean()
    .withMessage("Show email must be a boolean"),
  body("showPhone")
    .optional()
    .isBoolean()
    .withMessage("Show phone must be a boolean"),
  body("allowDirectContact")
    .optional()
    .isBoolean()
    .withMessage("Allow direct contact must be a boolean"),
  body("showLastSeen")
    .optional()
    .isBoolean()
    .withMessage("Show last seen must be a boolean"),
];

// =============================================================================
// PUBLIC ROUTES - No authentication required
// =============================================================================
router.get("/search", validateSearch, searchProfiles);

// =============================================================================
// BASIC PROTECTED ROUTES - Accessible to pending + active users
// =============================================================================
router.use(protect); // All routes below require authentication

// Profile viewing and basic updates (pending users can access these)
router.get("/me", checkAccountStatus, getMyProfile);
router.put("/basic", validateBasicProfile, updateBasicProfile);

// Document management (pending users need to upload documents for verification)
router.post("/documents", uploadDocuments);
router.delete(
  "/documents/:documentId",
  param("documentId").isMongoId().withMessage("Invalid document ID"),
  deleteDocument,
);

// Basic profile photo upload (pending users should be able to do this)
router.post("/photo", uploadProfilePhoto);

// =============================================================================
// ACTIVE ACCOUNT ROUTES - Require active status
// =============================================================================

// Experience management (requires active account - this is professional info)
router.post("/experience", requireActive, validateExperience, addExperience);
router.put(
  "/experience/:experienceId",
  requireActive,
  param("experienceId").isMongoId().withMessage("Invalid experience ID"),
  validateExperience,
  updateExperience,
);
router.delete(
  "/experience/:experienceId",
  requireActive,
  param("experienceId").isMongoId().withMessage("Invalid experience ID"),
  deleteExperience,
);

// Skills management (requires active account - professional feature)
router.put("/skills", requireActive, validateSkills, updateSkills);

// Certification management (requires active account - professional credentials)
router.post(
  "/certifications",
  requireActive,
  validateCertification,
  addCertification,
);
router.put(
  "/certifications/:certificationId",
  requireActive,
  param("certificationId").isMongoId().withMessage("Invalid certification ID"),
  validateCertification,
  updateCertification,
);
router.delete(
  "/certifications/:certificationId",
  requireActive,
  param("certificationId").isMongoId().withMessage("Invalid certification ID"),
  deleteCertification,
);

// Availability management (requires active account - professional scheduling)
router.put(
  "/availability",
  requireActive,
  validateAvailability,
  updateAvailability,
);

// Privacy settings (sensitive settings, requires active account)
router.put("/privacy", requireActive, validatePrivacy, updatePrivacy);

// =============================================================================
// VERIFIED PROFESSIONAL ROUTES - Require verification
// =============================================================================

// Analytics (professional feature, requires verification)
router.get("/analytics", requireVerifiedAccount, getAnalytics);

// =============================================================================
// TEST ROUTES - For development/testing
// =============================================================================
router.get("/test", (req, res) => {
  res.json({
    message: "Profile route is working!",
    user: req.user
      ? {
          id: req.user._id,
          accountStatus: req.user.accountStatus,
        }
      : "No user",
  });
});

router.get("/test-auth", (req, res) => {
  res.json({
    success: true,
    message: "Authentication is working!",
    user: {
      id: req.user._id,
      email: req.user.email,
      name: `${req.user.firstName} ${req.user.lastName}`,
      accountStatus: req.user.accountStatus,
    },
  });
});

router.get("/:identifier", getPublicProfile);

module.exports = router;
