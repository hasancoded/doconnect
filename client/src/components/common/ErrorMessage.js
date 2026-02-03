import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  ArrowLeft,
  Info,
  FileX,
} from "lucide-react";

const ErrorMessage = ({
  variant = "inline",
  message = "An error occurred",
  errors = [],
  onRetry,
  onDismiss,
  onGoBack,
  dismissible = true,
  autoClose = 0,
  title = "",
  className = "",
  severity = "error",
}) => {
  const [visible, setVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (variant === "toast" && autoClose > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [variant, autoClose]);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!visible) return null;

  // Updated severity colors to match medical theme
  const severityConfig = {
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-[#EF4444]",
      button: "bg-red-100 hover:bg-red-200 text-red-700",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: "text-amber-500",
      button: "bg-amber-100 hover:bg-amber-200 text-amber-700",
    },
    info: {
      bg: "bg-[#EBF5FF]",
      border: "border-blue-200",
      text: "text-[#1E40AF]",
      icon: "text-[#3B82F6]",
      button: "bg-blue-100 hover:bg-blue-200 text-blue-700",
    },
  };

  const config = severityConfig[severity] || severityConfig.error;

  const IconComponent =
    severity === "warning"
      ? AlertTriangle
      : severity === "info"
      ? Info
      : XCircle;

  if (variant === "inline") {
    return (
      <div
        className={`${config.bg} ${
          config.border
        } border rounded-lg p-4 ${className} ${
          isAnimating ? "animate-fade-out" : "animate-fade-in"
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <IconComponent
            className={`${config.icon} flex-shrink-0 mt-0.5`}
            size={20}
          />

          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-semibold ${config.text} mb-1`}>{title}</h4>
            )}

            <p className={`${config.text} text-sm`}>{message}</p>

            {errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {errors.map((error, index) => (
                  <li
                    key={index}
                    className={`text-sm ${config.text} flex items-start gap-2`}
                  >
                    <span className="text-xs">•</span>
                    <span>
                      {error.field && (
                        <strong className="font-medium">{error.field}:</strong>
                      )}{" "}
                      {error.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {(onRetry || onGoBack) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className={`${config.button} px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors`}
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                )}
                {onGoBack && (
                  <button
                    onClick={onGoBack}
                    className={`${config.button} px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors`}
                  >
                    <ArrowLeft size={14} />
                    Go Back
                  </button>
                )}
              </div>
            )}
          </div>

          {dismissible && (
            <button
              onClick={handleDismiss}
              className={`${config.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`${config.bg} ${config.border} border-b ${className} ${
          isAnimating ? "animate-slide-up" : "animate-slide-down"
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <IconComponent
                className={`${config.icon} flex-shrink-0`}
                size={24}
              />
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className={`font-semibold ${config.text} mb-1`}>
                    {title}
                  </h3>
                )}
                <p className={`${config.text} text-sm`}>{message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`${config.button} px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}
                >
                  <RefreshCw size={16} />
                  Retry
                </button>
              )}

              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className={`${config.icon} hover:opacity-70 transition-opacity p-1`}
                  aria-label="Dismiss"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "toast") {
    return (
      <div
        className={`fixed top-4 right-4 z-50 max-w-md ${className} ${
          isAnimating ? "animate-toast-out" : "animate-toast-in"
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div
          className={`${config.bg} ${config.border} border rounded-lg shadow-lg p-4`}
        >
          <div className="flex items-start gap-3">
            <IconComponent
              className={`${config.icon} flex-shrink-0`}
              size={20}
            />

            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={`font-semibold ${config.text} mb-1`}>{title}</h4>
              )}
              <p className={`${config.text} text-sm`}>{message}</p>

              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`${config.button} mt-2 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors`}
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              )}
            </div>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className={`${config.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {autoClose > 0 && (
            <div
              className={`mt-3 h-1 ${config.border} rounded-full overflow-hidden`}
            >
              <div
                className={`h-full ${config.icon.replace(
                  "text-",
                  "bg-"
                )} animate-progress`}
                style={{ animationDuration: `${autoClose}ms` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "empty-state") {
    return (
      <div
        className={`${config.bg} rounded-lg p-12 text-center ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex justify-center mb-4">
          <div
            className={`${config.bg} ${config.border} border-2 rounded-full p-6`}
          >
            <FileX className={config.icon} size={48} />
          </div>
        </div>

        <h3 className={`text-xl font-semibold ${config.text} mb-2`}>
          {title || "No Results Found"}
        </h3>

        <p className={`${config.text} text-sm max-w-md mx-auto mb-6`}>
          {message}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-[#3B82F6] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className={`${config.button} px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2`}
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const FieldError = ({ message, className = "" }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-1.5 mt-1 ${className}`} role="alert">
      <AlertCircle className="text-[#EF4444] flex-shrink-0" size={14} />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
};

export const NetworkError = ({ onRetry, className = "" }) => (
  <ErrorMessage
    variant="inline"
    severity="error"
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection."
    onRetry={onRetry}
    className={className}
  />
);

export const NotFoundError = ({
  resourceName = "Resource",
  onGoBack,
  className = "",
}) => (
  <ErrorMessage
    variant="empty-state"
    severity="error"
    title={`${resourceName} Not Found`}
    message={`The ${resourceName.toLowerCase()} you're looking for doesn't exist or may have been removed.`}
    onGoBack={onGoBack}
    className={className}
  />
);

export const PermissionError = ({ onGoBack, className = "" }) => (
  <ErrorMessage
    variant="inline"
    severity="error"
    title="Access Denied"
    message="You don't have permission to access this resource. Please contact an administrator if you believe this is a mistake."
    onGoBack={onGoBack}
    className={className}
  />
);

export default ErrorMessage;
