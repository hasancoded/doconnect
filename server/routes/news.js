// news.js - News Routes
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getHealthNews, clearCache } = require("../controllers/newsController");

/**
 * @route   GET /api/news/health
 * @desc    Get health and medical news
 * @access  Protected (Authenticated users)
 */
router.get("/health", protect, getHealthNews);

/**
 * @route   POST /api/news/clear-cache
 * @desc    Clear news cache (admin utility)
 * @access  Protected (Admin only)
 */
router.post("/clear-cache", protect, authorize("admin"), clearCache);

module.exports = router;
