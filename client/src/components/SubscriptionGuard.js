// client/src/components/SubscriptionGuard.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiLock, FiArrowRight } from 'react-icons/fi';

/**
 * SubscriptionGuard Component
 * 
 * Wraps premium features and displays upgrade prompts for users
 * without the required subscription plan or feature access.
 * 
 * @param {Object} props
 * @param {string} props.requiredPlan - Minimum plan required ('basic', 'professional', 'enterprise')
 * @param {string} props.requiredFeature - Specific feature required (e.g., 'directMessaging', 'bulkOperations')
 * @param {React.ReactNode} props.children - Content to show if user has access
 * @param {React.ReactNode} props.fallback - Custom fallback component (optional)
 * @param {string} props.featureName - Display name of the feature for upgrade prompt
 */
const SubscriptionGuard = ({
  requiredPlan,
  requiredFeature,
  children,
  fallback,
  featureName = 'this feature',
}) => {
  const { subscription, subscriptionLoading } = useAuth();

  // Show loading state
  if (subscriptionLoading) {
    return (
      <div className=\"flex items-center justify-center p-8\">
        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
      </div>
    );
  }

  // Check if user has required plan
  const hasRequiredPlan = () => {
    if (!requiredPlan) return true;
    
    const planLevels = { free: 0, basic: 1, professional: 2, enterprise: 3 };
    const userLevel = planLevels[subscription?.planId] || 0;
    const requiredLevel = planLevels[requiredPlan] || 1;
    
    return userLevel >= requiredLevel;
  };

  // Check if user has required feature
  const hasRequiredFeature = () => {
    if (!requiredFeature) return true;
    return subscription?.features?.[requiredFeature] === true;
  };

  // Determine if user has access
  const hasAccess = hasRequiredPlan() && hasRequiredFeature();

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  const getRecommendedPlan = () => {
    if (requiredPlan) return requiredPlan;
    
    // Map features to minimum required plans
    const featurePlanMap = {
      unlimitedApplications: 'basic',
      advancedSearch: 'basic',
      directMessaging: 'basic',
      featuredJobPostings: 'professional',
      advancedAnalytics: 'professional',
      prioritySupport: 'professional',
      bulkOperations: 'professional',
      scheduledPosting: 'professional',
      customBranding: 'enterprise',
      apiAccess: 'enterprise',
    };
    
    return featurePlanMap[requiredFeature] || 'basic';
  };

  const recommendedPlan = getRecommendedPlan();
  const currentPlan = subscription?.planId || 'free';

  return (
    <div className=\"bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center\">
      <div className=\"inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4\">
        <FiLock className=\"w-8 h-8 text-blue-600\" />
      </div>
      
      <h3 className=\"text-2xl font-bold text-gray-900 mb-2\">
        Premium Feature
      </h3>
      
      <p className=\"text-gray-600 mb-6 max-w-md mx-auto\">
        Upgrade to <span className=\"font-semibold text-blue-600 capitalize\">{recommendedPlan}</span> plan
        to unlock {featureName} and boost your productivity.
      </p>

      <div className=\"bg-white rounded-lg p-4 mb-6 max-w-sm mx-auto\">
        <div className=\"flex items-center justify-between mb-2\">
          <span className=\"text-sm text-gray-500\">Current Plan</span>
          <span className=\"font-semibold text-gray-900 capitalize\">{currentPlan}</span>
        </div>
        <div className=\"flex items-center justify-between\">
          <span className=\"text-sm text-gray-500\">Required Plan</span>
          <span className=\"font-semibold text-blue-600 capitalize\">{recommendedPlan}</span>
        </div>
      </div>

      <Link
        to=\"/subscription/plans\"
        className=\"inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl\"
      >
        View Plans & Upgrade
        <FiArrowRight className=\"w-5 h-5\" />
      </Link>

      <p className=\"text-sm text-gray-500 mt-4\">
        Already upgraded?{' '}
        <button
          onClick={() => window.location.reload()}
          className=\"text-blue-600 hover:text-blue-700 font-medium\"
        >
          Refresh page
        </button>
      </p>
    </div>
  );
};

export default SubscriptionGuard;
