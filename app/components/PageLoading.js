"use client";

import React from "react";

// Loading spinner variants
const SpinnerVariants = {
  // Classic spinner
  spinner: (size, color) => (
    <div
      className={`${size} border-4 border-gray-200 rounded-full animate-spin`}
      style={{ borderTopColor: color }}
    />
  ),
  
  // Bouncing dots
  dots: (size, color) => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === "w-16 h-16" ? "w-4 h-4" : size === "w-12 h-12" ? "w-3 h-3" : "w-2 h-2"} rounded-full animate-bounce`}
          style={{ 
            backgroundColor: color,
            animationDelay: `${i * 0.15}s` 
          }}
        />
      ))}
    </div>
  ),
  
  // Pulse circle
  pulse: (size, color) => (
    <div className="relative">
      <div
        className={`${size} rounded-full animate-ping absolute opacity-75`}
        style={{ backgroundColor: color }}
      />
      <div
        className={`${size} rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  ),
  
  // Bilsnack custom - snack icon
  snack: (size, color) => (
    <div className="relative">
      <div className={`${size} flex items-center justify-center`}>
        <svg
          className="animate-bounce"
          width={size === "w-16 h-16" ? 48 : size === "w-12 h-12" ? 36 : 24}
          height={size === "w-16 h-16" ? 48 : size === "w-12 h-12" ? 36 : 24}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cookie/Snack icon */}
          <circle cx="12" cy="12" r="10" fill={color} />
          <circle cx="8" cy="10" r="1.5" fill="#fff" />
          <circle cx="14" cy="8" r="1" fill="#fff" />
          <circle cx="10" cy="14" r="1.2" fill="#fff" />
          <circle cx="15" cy="13" r="1.5" fill="#fff" />
          <circle cx="12" cy="11" r="0.8" fill="#fff" />
        </svg>
      </div>
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ backgroundColor: color }}
      />
    </div>
  ),
  
  // Wave bars
  bars: (size, color) => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${size === "w-16 h-16" ? "w-2" : size === "w-12 h-12" ? "w-1.5" : "w-1"} rounded-full animate-pulse`}
          style={{
            backgroundColor: color,
            height: `${(i % 3 + 1) * (size === "w-16 h-16" ? 12 : size === "w-12 h-12" ? 8 : 6)}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  ),
};

/**
 * PageLoading Component
 * 
 * @param {Object} props
 * @param {string} props.text - Loading text to display
 * @param {string} props.subText - Sub text below main text
 * @param {string} props.variant - Animation variant: 'spinner' | 'dots' | 'pulse' | 'snack' | 'bars'
 * @param {string} props.size - Size: 'sm' | 'md' | 'lg'
 * @param {string} props.color - Custom color (default: yellow-500)
 * @param {boolean} props.fullScreen - Whether to take full screen
 * @param {boolean} props.overlay - Show with overlay background
 * @param {string} props.className - Additional classes
 */
const PageLoading = ({
  text = "Memuat...",
  subText = "",
  variant = "snack",
  size = "lg",
  color = "#eab308", // yellow-500
  fullScreen = true,
  overlay = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const renderSpinner = () => {
    const spinnerFn = SpinnerVariants[variant] || SpinnerVariants.spinner;
    return spinnerFn(sizeClasses[size], color);
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50"
    : "w-full h-full min-h-[200px]";

  const bgClasses = overlay
    ? "bg-black/50 backdrop-blur-sm"
    : "bg-surface dark:bg-[rgb(var(--bg))]";

  return (
    <div
      className={`${containerClasses} ${bgClasses} flex flex-col items-center justify-center ${className}`}
    >
      {/* Decorative background elements */}
      {fullScreen && !overlay && (
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[rgb(var(--accent))] rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-[rgb(var(--accent))] rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-40 left-1/3 w-20 h-20 bg-[rgb(var(--accent))] rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-[rgb(var(--accent))] rounded-full blur-lg animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>
      )}

      {/* Loading animation */}
      <div className="relative z-10 flex flex-col items-center">
        {renderSpinner()}
        
        {/* Text */}
        {text && (
          <p
            className={`mt-4 font-semibold text-[rgb(var(--text))] ${
              size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm"
            }`}
          >
            {text}
          </p>
        )}
        
        {/* Sub text */}
        {subText && (
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            {subText}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Loading - for smaller sections
 */
export const InlineLoading = ({
  text = "Memuat...",
  variant = "dots",
  size = "sm",
  color = "#eab308",
}) => {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {SpinnerVariants[variant]?.(
        size === "sm" ? "w-8 h-8" : size === "md" ? "w-12 h-12" : "w-16 h-16",
        color
      )}
      {text && <span className="text-sm text-[rgb(var(--text-muted))]">{text}</span>}
    </div>
  );
};

/**
 * Button Loading Spinner - for inside buttons
 */
export const ButtonSpinner = ({ className = "" }) => (
  <svg
    className={`animate-spin h-4 w-4 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Skeleton Loading - for content placeholders
 */
export const SkeletonLine = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div
    className={`${width} ${height} bg-[rgb(var(--border))] rounded animate-pulse ${className}`}
  />
);

export const SkeletonCircle = ({ size = "w-12 h-12", className = "" }) => (
  <div
    className={`${size} bg-[rgb(var(--border))] rounded-full animate-pulse ${className}`}
  />
);

export const SkeletonBox = ({ width = "w-full", height = "h-32", className = "" }) => (
  <div
    className={`${width} ${height} bg-[rgb(var(--border))] rounded-lg animate-pulse ${className}`}
  />
);

export default PageLoading;
