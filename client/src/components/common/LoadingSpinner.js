import React from "react";

/**
 * LoadingSpinner Component
 *
 * Reusable loading component with multiple variants for different contexts
 *
 * @param {Object} props
 * @param {string} props.variant - 'full-page' | 'inline' | 'button' | 'skeleton' (default: 'full-page')
 * @param {string} props.size - 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {string} props.message - Optional loading message
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.color - Override color (default: medical blue #3B82F6)
 */
const LoadingSpinner = ({
  variant = "full-page",
  size = "md",
  message = "",
  className = "",
  color = "#3B82F6",
}) => {
  const sizeClasses = {
    xs: { spinner: "w-4 h-4", text: "text-xs" },
    sm: { spinner: "w-6 h-6", text: "text-sm" },
    md: { spinner: "w-10 h-10", text: "text-base" },
    lg: { spinner: "w-16 h-16", text: "text-lg" },
    xl: { spinner: "w-24 h-24", text: "text-xl" },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const SpinnerIcon = () => (
    <div
      className={`${currentSize.spinner} relative`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
        style={{
          borderColor: `${color}40`,
          borderTopColor: "transparent",
        }}
      />
      <div
        className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
        style={{
          borderColor: color,
          borderTopColor: "transparent",
          animationDuration: "1.5s",
          animationDirection: "reverse",
        }}
      />
      <div
        className="absolute inset-2 rounded-full animate-pulse"
        style={{ backgroundColor: `${color}20` }}
      />
    </div>
  );

  if (variant === "full-page") {
    return (
      <div
        className={`fixed inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 ${className}`}
        role="alert"
        aria-busy="true"
      >
        <SpinnerIcon />
        {message && (
          <p
            className={`mt-6 ${currentSize.text} text-[#1E40AF] font-medium animate-pulse`}
          >
            {message}
          </p>
        )}
        <div className="mt-4 flex gap-1">
          <div
            className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center justify-center gap-3 py-4 ${className}`}
        role="status"
        aria-busy="true"
      >
        <SpinnerIcon />
        {message && (
          <span className={`${currentSize.text} text-gray-700`}>{message}</span>
        )}
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div
        className={`inline-flex items-center gap-2 ${className}`}
        role="status"
        aria-label="Loading"
      >
        <div className="w-4 h-4 relative">
          <div
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "currentColor",
              borderTopColor: "transparent",
              opacity: 0.3,
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "currentColor",
              borderTopColor: "transparent",
              animationDuration: "1s",
            }}
          />
        </div>
        {message && <span className="text-sm">{message}</span>}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div
        className={`animate-pulse space-y-4 ${className}`}
        role="status"
        aria-label="Loading content"
      >
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-4/6" />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="h-8 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-32" />
          </div>
        </div>

        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  return <SpinnerIcon />;
};

export const JobCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>

    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>

    <div className="flex flex-wrap gap-2 mb-4">
      <div className="h-6 w-24 bg-gray-200 rounded-full" />
      <div className="h-6 w-32 bg-gray-200 rounded-full" />
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-9 bg-gray-200 rounded w-28" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
            <div className="h-6 w-28 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array(count)
      .fill(0)
      .map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
  </div>
);

export default LoadingSpinner;
