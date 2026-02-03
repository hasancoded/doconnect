import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * NewsCard Component - Fixed-height card with scrollable title
 *
 * Critical Design Rules:
 * 1. FIXED HEIGHT: Card is always 440px tall (h-[440px])
 * 2. FULL TITLE VISIBILITY: Title container is scrollable, shows complete text
 * 3. CONSISTENT LAYOUT: Image (192px) + Content (248px) = 440px total
 *
 * Layout Structure:
 * ┌─────────────────────────┐
 * │  Image (h-48 = 192px)   │ ← Fixed
 * ├─────────────────────────┤
 * │  Title (scrollable)     │ ← Auto height, scrollable
 * │  Description (clamped)  │ ← Fixed 3 lines
 * │  ─────────────────────  │
 * │  Footer (metadata+btn)  │ ← Fixed at bottom
 * └─────────────────────────┘
 *
 * Title Handling:
 * - Container has max-height with overflow-y-auto
 * - Shows full title with custom scrollbar
 * - Prevents card height changes
 *
 * @param {Object} article - News article data
 * @param {number} index - Card index for accessibility
 * @param {Function} formatDate - Date formatting function
 * @param {string} fallbackImage - Fallback image URL
 */

const NewsCard = ({ article, index, formatDate, fallbackImage }) => {
  return (
    <article
      className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col h-[440px] group"
      aria-labelledby={`article-title-${index}`}
    >
      {/* Fixed-height Image - 192px */}
      <div className="relative h-48 overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={article.urlToImage || fallbackImage}
          alt=""
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
          loading="lazy"
        />
      </div>

      {/* Content Area - Flexible with internal structure */}
      <div className="p-5 flex flex-col flex-1 overflow-hidden">
        {/* 
          CRITICAL: Scrollable Title Container
          - max-h-20 (80px) allows ~4 lines of 16px text
          - overflow-y-auto enables scrolling for long titles
          - Custom scrollbar styling for clean appearance
          - mb-3 provides spacing before description
        */}
        <div className="max-h-20 overflow-y-auto mb-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
          <h3
            id={`article-title-${index}`}
            className="text-base font-semibold text-slate-900 leading-snug"
          >
            {article.title}
          </h3>
        </div>

        {/* Description - Clamped to preserve layout */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed flex-1">
          {article.description || "No description available."}
        </p>

        {/* Footer - Fixed at bottom with metadata + button */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
          {/* Metadata - Source and date */}
          <div className="flex flex-col gap-1 text-xs text-slate-500 flex-1 min-w-0">
            <span className="font-medium text-slate-700 truncate">
              {article.source?.name || "Unknown"}
            </span>
            <span className="text-slate-500">
              {formatDate(article.publishedAt)}
            </span>
          </div>

          {/* Read Button - Ghost style */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 flex-shrink-0 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 hover:text-blue-700 active:bg-blue-200 transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Read article: ${article.title}`}
          >
            Read
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
