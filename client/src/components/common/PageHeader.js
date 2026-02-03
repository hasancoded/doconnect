import React from "react";

/**
 * PageHeader Component - Reusable across all dashboard pages
 *
 * Design Rules:
 * - Title: 24px (text-2xl), semibold, slate-900
 * - Subtitle: 14px (text-sm), regular, slate-600
 * - Consistent spacing: mb-1 between title/subtitle
 * - Action slot for buttons (right-aligned)
 *
 * Usage:
 * <PageHeader
 *   title="Page Title"
 *   subtitle="Page description"
 *   action={<button>Action</button>}
 * />
 */

const PageHeader = ({ title, subtitle, action, className = "" }) => {
  return (
    <div className={`flex items-start justify-between mb-8 ${className}`}>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
