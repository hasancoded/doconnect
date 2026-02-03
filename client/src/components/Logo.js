import React from "react";

/**
 * Doconnect Logo Component
 * A minimalistic SVG logo representing medical networking
 * Features:
 * - Medical cross symbolizing healthcare
 * - Clean, modern, scalable design
 */
const Logo = ({ className = "", size = 36, showText = true }) => {
  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      {/* SVG Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>

        {/* Main Circle Background */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />

        {/* Medical Cross - Central Element */}
        <g>
          {/* Vertical bar of cross */}
          <rect x="21" y="13" width="6" height="22" rx="2" fill="white" />
          {/* Horizontal bar of cross */}
          <rect x="13" y="21" width="22" height="6" rx="2" fill="white" />
        </g>

        {/* Subtle connection dots at corners - representing networking */}
        <circle cx="16" cy="16" r="1.5" fill="white" opacity="0.7" />
        <circle cx="32" cy="16" r="1.5" fill="white" opacity="0.7" />
        <circle cx="32" cy="32" r="1.5" fill="white" opacity="0.7" />
        <circle cx="16" cy="32" r="1.5" fill="white" opacity="0.7" />
      </svg>

      {/* Text Logo */}
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Doconnect
        </span>
      )}
    </div>
  );
};

export default Logo;
