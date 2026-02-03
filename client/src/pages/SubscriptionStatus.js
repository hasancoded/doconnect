// client/src/pages/SubscriptionStatus.js - Current Subscription Display
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  CreditCard,
  Calendar,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

const SubscriptionStatus = () => {
  const navigate = useNavigate();
  const { subscription, subscriptionLoading, subscriptionError } = useAuth();

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-900 mb-1">
                Error Loading Subscription
              </h2>
              <p className="text-red-800">{subscriptionError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No Subscription Found
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have an active subscription yet.
            </p>
            <button
              onClick={() => navigate("/subscription/plans")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilRenewal = subscription.daysUntilRenewal || 0;
  const renewalDate = new Date(
    subscription.currentPeriodEnd
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getStatusColor = (status) => {
    const colors = {
      active: "text-green-700 bg-green-50 border-green-200",
      trialing: "text-blue-700 bg-blue-50 border-blue-200",
      past_due: "text-red-700 bg-red-50 border-red-200",
      canceled: "text-gray-700 bg-gray-50 border-gray-200",
    };
    return colors[status] || colors.active;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Status
        </h1>
        <p className="text-gray-600 mb-8">
          Manage your subscription and billing information
        </p>

        {/* Current Plan Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Plan</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {subscription.planName}
              </h2>
            </div>
            <span
              className={`px-4 py-2 rounded-full font-semibold text-sm border ${getStatusColor(
                subscription.status
              )}`}
            >
              {subscription.status === "trialing"
                ? "Trial"
                : subscription.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Renewal Date</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {renewalDate}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {daysUntilRenewal} days remaining
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Monthly Price</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                ${(subscription.planPrice / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">/month</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">Payment Method</p>
              </div>
              {subscription.paymentMethod ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.paymentMethod.brand?.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    •••• {subscription.paymentMethod.last4}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No payment method</p>
              )}
            </div>
          </div>

          {subscription.isTrialing && subscription.trialEnd && (
            <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Free Trial Active:</span> Your
                trial ends on{" "}
                <span className="font-semibold">
                  {new Date(subscription.trialEnd).toLocaleDateString()}
                </span>
                . You won't be charged until the trial ends.
              </p>
            </div>
          )}
        </div>

        {/* Features & Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Your Features & Usage
          </h3>

          {/* Features Grid */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-4">
              INCLUDED FEATURES:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Unlimited Applications",
                  key: "unlimitedApplications",
                },
                { name: "Advanced Search", key: "advancedSearch" },
                { name: "Featured Job Postings", key: "featuredJobPostings" },
                { name: "Direct Messaging", key: "directMessaging" },
                { name: "Advanced Analytics", key: "advancedAnalytics" },
                { name: "Priority Support", key: "prioritySupport" },
                { name: "Bulk Operations", key: "bulkOperations" },
                { name: "Scheduled Posting", key: "scheduledPosting" },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  {subscription.features[feature.key] ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                  )}
                  <span
                    className={
                      subscription.features[feature.key]
                        ? "text-sm text-gray-900"
                        : "text-sm text-gray-500 line-through"
                    }
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Limits */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-4">
              MONTHLY USAGE LIMITS:
            </p>
            <div className="space-y-4">
              {subscription.usage && (
                <>
                  {subscription.usage.jobApplications && (
                    <UsageBar
                      label="Job Applications"
                      used={subscription.usage.jobApplications.used || 0}
                      limit={subscription.usage.jobApplications.limit}
                    />
                  )}
                  {subscription.usage.jobPostings && (
                    <UsageBar
                      label="Job Postings"
                      used={subscription.usage.jobPostings.used || 0}
                      limit={subscription.usage.jobPostings.limit}
                    />
                  )}
                  {subscription.usage.profileViews && (
                    <UsageBar
                      label="Profile Views"
                      used={subscription.usage.profileViews.used || 0}
                      limit={subscription.usage.profileViews.limit}
                    />
                  )}
                  {subscription.usage.messageThreads && (
                    <UsageBar
                      label="Message Threads"
                      used={subscription.usage.messageThreads.used || 0}
                      limit={subscription.usage.messageThreads.limit}
                    />
                  )}
                  {subscription.usage.bulkOperations && (
                    <UsageBar
                      label="Bulk Operations"
                      used={subscription.usage.bulkOperations.used || 0}
                      limit={subscription.usage.bulkOperations.limit}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/subscription/manage")}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Manage Subscription
          </button>
          <button
            onClick={() => navigate("/subscription/plans")}
            className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
          >
            View All Plans
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE BAR COMPONENT
// ============================================================================

const UsageBar = ({ label, used, limit }) => {
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
  const isUnlimited = limit === null;

  let barColor = "bg-green-500";
  if (!isUnlimited && percentage > 80) {
    barColor = "bg-red-500";
  } else if (!isUnlimited && percentage > 50) {
    barColor = "bg-yellow-500";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm font-semibold text-gray-600">
          {used} / {isUnlimited ? "∞" : limit}
        </p>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="w-full bg-green-100 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-green-500 w-full" />
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
