// client/src/pages/SubscriptionPlans.js - Subscription Plans Display
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Check,
  X,
  Loader,
  AlertCircle,
  Zap,
  Award,
  Crown,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const {
    getSubscriptionPlans,
    createCheckoutSession,
    cancelSubscription,
    subscription,
  } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const plansData = await getSubscriptionPlans();
        setPlans(plansData);
        setError("");
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load subscription plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [getSubscriptionPlans]);

  const handleSelectPlan = async (planId) => {
    // Handle downgrade to free tier
    if (planId === "free") {
      // Show confirmation dialog
      const confirmed = window.confirm(
        "⚠️ Downgrade to Free Tier?\n\n" +
          "You will lose access to:\n" +
          "• Unlimited job applications\n" +
          "• Advanced search features\n" +
          "• Direct messaging\n" +
          "• Priority support\n" +
          "• All premium features\n\n" +
          "Your usage limits will be reset to:\n" +
          "• 5 job applications/month\n" +
          "• 3 job postings/month\n\n" +
          "Are you sure you want to continue?"
      );

      if (!confirmed) {
        return;
      }

      try {
        setCheckoutLoading(true);
        setSelectedPlan(planId);

        const response = await cancelSubscription(
          "Downgrading to free tier",
          ""
        );
        setError("");

        // Show appropriate success message based on response
        const successMessage = response.willCancelAt
          ? `✅ Subscription Scheduled for Cancellation!\n\nYou'll retain ${
              subscription.planName
            } access until ${new Date(
              response.willCancelAt
            ).toLocaleDateString()}.\n\nAfter that date, you'll be automatically downgraded to the Free Tier.`
          : "✅ Successfully downgraded to Free Tier!\n\nYour subscription has been canceled and you now have access to free tier features.";

        alert(successMessage);

        // Navigate to dashboard after successful cancellation
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } catch (err) {
        console.error("Error downgrading to free:", err);
        setError(
          err.response?.data?.message || "Failed to downgrade to free tier"
        );
      } finally {
        setCheckoutLoading(false);
        setSelectedPlan(null);
      }
      return;
    }

    try {
      setCheckoutLoading(true);
      setSelectedPlan(planId);

      const session = await createCheckoutSession(planId, "monthly");

      if (session && session.url) {
        window.location.href = session.url;
      } else {
        setError("Failed to create checkout session. Please try again.");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(
        err.response?.data?.message || "Failed to create checkout session"
      );
    } finally {
      setCheckoutLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId) => {
    const icons = {
      free: <Sparkles className="w-8 h-8" />,
      basic: <Zap className="w-8 h-8" />,
      professional: <Award className="w-8 h-8" />,
      enterprise: <Crown className="w-8 h-8" />,
    };
    return icons[planId] || <Sparkles className="w-8 h-8" />;
  };

  const getPlanBadge = (planId) => {
    if (planId === "professional") {
      return (
        <div className="absolute -top-3 -right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          POPULAR
        </div>
      );
    }
    if (planId === "enterprise") {
      return (
        <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          BEST VALUE
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-6 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Select the perfect plan for your medical career
          </p>
          {subscription && (
            <p className="text-sm text-blue-600 font-medium">
              Current Plan:{" "}
              <span className="capitalize font-bold">
                {subscription.planId}
              </span>
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-8 flex flex-col"
            >
              {getPlanBadge(plan.id)}

              {/* Plan Header */}
              <div className="mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    plan.id === "professional"
                      ? "bg-blue-100 text-blue-600"
                      : plan.id === "enterprise"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {getPlanIcon(plan.id)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">/month</span>
                  )}
                </div>
                {plan.id === "free" && (
                  <p className="text-sm text-gray-600 mt-2">Forever free</p>
                )}
              </div>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={
                  checkoutLoading ||
                  (subscription && subscription.planId === plan.id)
                }
                className={`w-full py-3 rounded-lg font-semibold transition-all mb-6 ${
                  plan.id === "professional"
                    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    : plan.id === "enterprise"
                    ? "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    : "border-2 border-gray-300 text-gray-900 hover:border-gray-400 disabled:opacity-50"
                } ${
                  checkoutLoading && selectedPlan === plan.id
                    ? "opacity-75"
                    : ""
                }`}
              >
                {checkoutLoading && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : subscription && subscription.planId === plan.id ? (
                  "Current Plan"
                ) : plan.id === "free" ? (
                  "Go Free"
                ) : (
                  "Select Plan"
                )}
              </button>

              {/* Features */}
              <div className="space-y-3 flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Included Features:
                </p>
                {[
                  {
                    name: "Unlimited Applications",
                    key: "unlimitedApplications",
                  },
                  { name: "Advanced Search", key: "advancedSearch" },
                  {
                    name: "Featured Job Postings",
                    key: "featuredJobPostings",
                  },
                  { name: "Direct Messaging", key: "directMessaging" },
                  { name: "Advanced Analytics", key: "advancedAnalytics" },
                  { name: "Priority Support", key: "prioritySupport" },
                  { name: "Bulk Operations", key: "bulkOperations" },
                  { name: "Scheduled Posting", key: "scheduledPosting" },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center gap-3">
                    {plan.features[feature.key] ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={
                        plan.features[feature.key]
                          ? "text-sm text-gray-900"
                          : "text-sm text-gray-400"
                      }
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Usage Limits */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-3">
                  MONTHLY LIMITS:
                </p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Applications:</span>
                    <span className="font-semibold">
                      {plan.usage.jobApplications.limit === null
                        ? "Unlimited"
                        : plan.usage.jobApplications.limit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Job Postings:</span>
                    <span className="font-semibold">
                      {plan.usage.jobPostings.limit === null
                        ? "Unlimited"
                        : plan.usage.jobPostings.limit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profile Views:</span>
                    <span className="font-semibold">
                      {plan.usage.profileViews.limit === null
                        ? "Unlimited"
                        : plan.usage.profileViews.limit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bulk Operations:</span>
                    <span className="font-semibold">
                      {plan.usage.bulkOperations.limit === null
                        ? "Unlimited"
                        : plan.usage.bulkOperations.limit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately for upgrades or at the next billing
                cycle for downgrades.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do I get a trial period?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, new subscribers get a 7-day free trial when purchasing any
                paid plan. You won't be charged until the trial ends.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit and debit cards (Visa, Mastercard,
                American Express, Discover) through Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription anytime. You'll retain
                access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
