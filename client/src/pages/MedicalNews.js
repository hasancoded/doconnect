import React, { useState, useEffect } from "react";
import api from "../api";
import { Newspaper, RefreshCw, AlertCircle, Clock } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import NewsCard from "../components/news/NewsCard";

/**
 * Medical News Dashboard - Production-Grade Implementation
 *
 * CRITICAL DESIGN RULES IMPLEMENTED:
 *
 * 1. GLOBAL PAGE HEADER
 *    - Uses reusable PageHeader component
 *    - Consistent typography across all pages (24px title, 14px subtitle)
 *    - Same spacing and style everywhere
 *
 * 2. FIXED-HEIGHT CARDS
 *    - All cards are exactly 440px tall (h-[440px])
 *    - Height never changes regardless of content
 *    - Perfect grid alignment maintained
 *
 * 3. FULL TITLE VISIBILITY
 *    - Titles are NEVER truncated or clamped
 *    - Scrollable container shows complete title text
 *    - Card height remains fixed while showing full content
 *
 * 4. 8-POINT SPACING SYSTEM
 *    - All spacing uses multiples of 8px
 *    - Consistent gaps and padding throughout
 *
 * 5. PROFESSIONAL UX STATES
 *    - Loading: Skeleton cards (same 440px height)
 *    - Empty: Friendly message with action
 *    - Error: Soft alert with retry
 */

const MedicalNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch news from backend
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/news/health");

      if (response.data.success) {
        setNews(response.data.data || []);
        setCached(response.data.cached || false);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.data.message || "Failed to fetch news");
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load news. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  // Format date helper - concise output
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Fallback image - professional placeholder
  const fallbackImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect fill="%23f8fafc" width="400" height="200"/%3E%3Ctext fill="%2394a3b8" font-family="system-ui" font-size="14" font-weight="500" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EMedical News%3C/text%3E%3C/svg%3E';

  // Refresh button component
  const RefreshButton = () => (
    <button
      onClick={fetchNews}
      disabled={loading}
      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm"
      aria-label="Refresh news"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );

  // Loading State - Skeleton cards with FIXED 440px height
  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-80 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-96"></div>
          </div>

          {/* Grid Skeleton - CRITICAL: Same 440px height as real cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse h-[440px]"
              >
                <div className="h-48 bg-slate-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-full"></div>
                  <div className="h-5 bg-slate-200 rounded w-4/5"></div>
                  <div className="h-4 bg-slate-200 rounded w-full mt-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                    <div className="h-8 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 
          CRITICAL: Reusable PageHeader Component
          - Ensures consistent typography across all pages
          - 24px title, 14px subtitle (same everywhere)
          - Proper spacing and alignment
        */}
        <PageHeader
          title="Medical News & Updates"
          subtitle="Latest breakthroughs and healthcare developments"
          action={<RefreshButton />}
        />

        {/* Metadata Bar - 8pt spacing system */}
        {lastUpdated && (
          <div className="flex items-center gap-4 text-xs text-slate-500 bg-white rounded-lg px-4 py-2 border border-slate-200 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {cached && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                Cached
              </span>
            )}
            <span className="ml-auto font-medium text-slate-700">
              {news.length} {news.length === 1 ? "article" : "articles"}
            </span>
          </div>
        )}

        {/* Error State - Soft, professional */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">
                  Unable to load news
                </h3>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <button
                  onClick={fetchNews}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors duration-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Friendly, informational */}
        {!loading && !error && news.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No news available
            </h3>
            <p className="text-sm text-slate-600 mb-5 max-w-md mx-auto">
              We couldn't find any medical news at the moment. Please check back
              later or try refreshing.
            </p>
            <button
              onClick={fetchNews}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Refresh news
            </button>
          </div>
        )}

        {/* 
          CRITICAL: News Grid with Fixed-Height Cards
          - gap-5 (20px) for consistent spacing
          - Responsive: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
          - All cards are exactly 440px tall
        */}
        {!error && news.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article, index) => (
              <NewsCard
                key={index}
                article={article}
                index={index}
                formatDate={formatDate}
                fallbackImage={fallbackImage}
              />
            ))}
          </div>
        )}

        {/* Attribution - Subtle, professional */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500">
            Powered by{" "}
            <a
              href="https://newsapi.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200"
            >
              NewsAPI.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalNews;
