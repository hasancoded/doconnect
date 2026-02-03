// client/src/components/ProtectedRoute.js (Optional Feature Gating)
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./common/LoadingSpinner";

const AccessDenied = ({ reason, requiredLevel, currentStatus }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-[#EF4444]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Access Denied
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {reason || "You don't have permission to access this page."}
        </p>

        {requiredLevel && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-[#1E40AF]">
              <span className="font-medium">Required:</span> {requiredLevel}
            </p>
            {currentStatus && (
              <p className="text-sm text-[#1E40AF] mt-1">
                <span className="font-medium">Current:</span> {currentStatus}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <a
            href="/dashboard"
            className="block w-full px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            Go to Dashboard
          </a>

          <a
            href="/subscription/plans"
            className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            View Plans
          </a>
        </div>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({
  children,
  roles = null,
  requiredPermission = null,
  requireVerified = false,
  requireActive = false,
  featureRequired = null,
  redirectTo = "/login",
}) => {
  const location = useLocation();
  const auth = useAuth();
  const [featureLoading, setFeatureLoading] = React.useState(
    featureRequired ? true : false
  );
  const [featureGranted, setFeatureGranted] = React.useState(true);

  // Check feature access if required
  React.useEffect(() => {
    if (!featureRequired) return;

    const checkFeature = async () => {
      try {
        setFeatureLoading(true);
        const result = await auth.checkFeatureAccess(featureRequired);
        setFeatureGranted(result.hasAccess);
      } catch (err) {
        console.error("Error checking feature access:", err);
        setFeatureGranted(false);
      } finally {
        setFeatureLoading(false);
      }
    };

    checkFeature();
  }, [featureRequired, auth]);

  if (auth.loading || (featureRequired && featureLoading)) {
    return <LoadingSpinner message="Checking credentials..." />;
  }

  // Check 1: Must be authenticated
  if (!auth.isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check 2: Role-based access control
  if (roles && roles.length > 0) {
    if (!roles.includes(auth.role)) {
      return (
        <AccessDenied
          reason={`This page is only accessible to ${roles.join(
            " or "
          )} users.`}
          requiredLevel={roles.join(", ")}
          currentStatus={auth.role}
        />
      );
    }
  }

  // Check 3: Account status requirements
  if (requireActive && !auth.isAccountActive()) {
    let reason = "An active account is required to access this page.";
    if (auth.isAccountPending()) {
      reason =
        "Please complete your profile verification to access this feature.";
    } else if (auth.isAccountSuspended()) {
      reason = "Your account has been suspended. Please contact support.";
    } else if (auth.isAccountInactive()) {
      reason =
        "Your account is inactive. Please contact support to reactivate.";
    }

    return (
      <AccessDenied
        reason={reason}
        requiredLevel="Active Account"
        currentStatus={auth.accountStatus}
      />
    );
  }

  // Check 4: Verification requirements
  if (requireVerified && !auth.isFullyVerified()) {
    const missingVerifications = [];
    if (!auth.isIdentityVerified())
      missingVerifications.push("Identity Verification");
    if (!auth.isMedicalLicenseVerified())
      missingVerifications.push("Medical License");
    if (!auth.isBackgroundCheckVerified())
      missingVerifications.push("Background Check");

    return (
      <AccessDenied
        reason={`This feature requires a verified account. Missing: ${missingVerifications.join(
          ", "
        )}`}
        requiredLevel="Fully Verified Account"
        currentStatus={auth.verificationStatus.overall}
      />
    );
  }

  // Check 5: Feature access
  if (featureRequired && !featureGranted) {
    return (
      <AccessDenied
        reason={`This feature is not available in your plan. Upgrade to access it.`}
        requiredLevel={`${featureRequired} feature`}
        currentStatus={auth.subscription?.planName || "Free"}
      />
    );
  }

  // Check 6: Permission-based access control
  if (requiredPermission && !auth.canAccessRoute(requiredPermission)) {
    let reason = `This feature requires ${requiredPermission} level access.`;
    let suggestions = [];

    switch (requiredPermission) {
      case "active":
        reason = "Your account must be active to access this feature.";
        suggestions = [
          "Complete your profile",
          "Upload verification documents",
        ];
        break;
      case "professional":
        reason =
          "This is a professional feature requiring account verification.";
        suggestions = [
          "Upload your medical license",
          "Complete identity verification",
        ];
        break;
      case "premium":
        reason = "This is a premium feature requiring an active subscription.";
        suggestions = ["Upgrade to Professional plan", "Contact sales"];
        break;
      case "admin":
        reason = "This feature is only accessible to administrators.";
        break;
      default:
        break;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Upgrade Required
            </h3>

            <p className="mt-2 text-sm text-gray-600">{reason}</p>

            {suggestions.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  To gain access:
                </p>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-start"
                    >
                      <span className="text-[#3B82F6] mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {requiredPermission === "premium" ? (
                <a
                  href="/subscription/plans"
                  className="block w-full px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                >
                  View Pricing Plans
                </a>
              ) : (
                <a
                  href="/profile"
                  className="block w-full px-4 py-2 bg-[#3B82F6] text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                >
                  Complete Profile
                </a>
              )}

              <a
                href="/dashboard"
                className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed - render the protected content
  return <>{children}</>;
};

export const withProtection = (Component, protectionConfig = {}) => {
  return (props) => (
    <ProtectedRoute {...protectionConfig}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

export const RequirePermission = ({
  permission,
  children,
  fallback = null,
}) => {
  const auth = useAuth();
  if (!auth.canAccessRoute(permission)) {
    return fallback;
  }
  return <>{children}</>;
};

export const RequireRole = ({ roles, children, fallback = null }) => {
  const auth = useAuth();
  if (!roles.includes(auth.role)) {
    return fallback;
  }
  return <>{children}</>;
};

export const RequireFeature = ({ feature, children, fallback = null }) => {
  const auth = useAuth();
  const [hasAccess, setHasAccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const result = await auth.checkFeatureAccess(feature);
        setHasAccess(result.hasAccess);
      } catch (err) {
        console.error("Error checking feature access:", err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature, auth]);

  if (loading) return null;
  if (!hasAccess) return fallback;
  return <>{children}</>;
};

export default ProtectedRoute;
