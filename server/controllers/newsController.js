// newsController.js - Medical News Controller using NewsAPI.org
const axios = require("axios");

// In-memory cache for news articles
let newsCache = {
  data: null,
  timestamp: null,
  expiryMinutes: 30, // Cache expires after 30 minutes
};

/**
 * Get Health News from NewsAPI.org
 * @route GET /api/news/health
 * @access Protected (Authenticated users)
 */
exports.getHealthNews = async (req, res) => {
  try {
    const now = Date.now();
    const cacheAge = newsCache.timestamp ? now - newsCache.timestamp : Infinity;
    const cacheExpiry = newsCache.expiryMinutes * 60 * 1000; // Convert to milliseconds

    // Return cached data if still valid
    if (newsCache.data && cacheAge < cacheExpiry) {
      return res.status(200).json({
        success: true,
        data: newsCache.data,
        cached: true,
        cacheAge: Math.floor(cacheAge / 1000 / 60), // Age in minutes
      });
    }

    // Check if API key is configured
    if (!process.env.NEWSAPI_KEY) {
      console.error("❌ NewsAPI key not configured");

      // Return cached data if available, even if expired
      if (newsCache.data) {
        return res.status(200).json({
          success: true,
          data: newsCache.data,
          cached: true,
          warning: "NewsAPI key not configured, returning cached data",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "News service is not configured. Please contact administrator.",
      });
    }


    // Fetch news from NewsAPI.org
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        category: "health",
        country: "us",
        pageSize: 20,
        apiKey: process.env.NEWSAPI_KEY,
      },
      timeout: 10000, // 10 second timeout
    });


    // Check if request was successful
    if (response.data.status !== "ok") {
      throw new Error(response.data.message || "Failed to fetch news");
    }

    // Extract and format articles
    const articles = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: {
        name: article.source.name,
      },
    }));

    // Update cache
    newsCache.data = articles;
    newsCache.timestamp = now;


    return res.status(200).json({
      success: true,
      data: articles,
      cached: false,
      totalResults: response.data.totalResults,
    });
  } catch (error) {
    console.error("❌ Error fetching news:", error.message);

    // Return cached data if available as fallback
    if (newsCache.data) {
      return res.status(200).json({
        success: true,
        data: newsCache.data,
        cached: true,
        warning: "Unable to fetch fresh news, returning cached data",
      });
    }

    // Handle specific error types
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "News service request timed out. Please try again.",
      });
    }

    if (error.response) {
      // NewsAPI.org returned an error
      const status = error.response.status;
      const message = error.response.data?.message || "Failed to fetch news";

      if (status === 401) {
        return res.status(500).json({
          success: false,
          message:
            "News service authentication failed. Please contact administrator.",
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          message: "News service rate limit exceeded. Please try again later.",
        });
      }

      return res.status(500).json({
        success: false,
        message: `News service error: ${message}`,
      });
    }

    // Network or other errors
    return res.status(500).json({
      success: false,
      message: "Unable to fetch news at this time. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Clear news cache (admin utility)
 * @route POST /api/news/clear-cache
 * @access Protected (Admin only)
 */
exports.clearCache = async (req, res) => {
  try {
    newsCache.data = null;
    newsCache.timestamp = null;


    return res.status(200).json({
      success: true,
      message: "News cache cleared successfully",
    });
  } catch (error) {
    console.error("❌ Error clearing cache:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cache",
    });
  }
};
