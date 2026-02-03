// client/src/pages/ManageSubscription.js - Subscription Management Hub
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  Download,
  MoreVertical,
  X,
  Check,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const ManageSubscription = () => {
  const navigate = useNavigate();
  const {
    subscription,
    subscriptionLoading,
    getInvoices,
    cancelSubscription,
    downgradePlan,
    updatePaymentMethod,
  } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [targetDowngradePlan, setTargetDowngradePlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reasons = [
    "Too expensive",
    "Not using features",
    "Found better alternative",
    "Temporary cancellation",
    "Other",
  ];

  const downgradePlans = {
    enterprise: ["professional", "basic"],
    professional: ["basic"],
    basic: [],
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!subscription) return;
      try {
        setInvoicesLoading(true);
        const data = await getInvoices(1, 10);
        setInvoices(data.data || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [subscription, getInvoices]);

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError("");
      await cancelSubscription(cancelReason, cancelFeedback);
      setSuccess("Subscription cancelled successfully");
      setShowCancelModal(false);
      setCancelReason("");
      setCancelFeedback("");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setError(err.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradePlan = async () => {
    try {
      setLoading(true);
      setError("");
      await downgradePlan(targetDowngradePlan);
      setSuccess("Plan downgrade scheduled for next billing cycle");
      setShowDowngradeModal(false);
      setTargetDowngradePlan("");
      setTimeout(() => navigate("/subscription/status"), 2000);
    } catch (err) {
      console.error("Error downgrading plan:", err);
      setError(err.response?.data?.message || "Failed to downgrade plan");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate("/subscription/plans");
  };

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription...</p>
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
              No Active Subscription
            </h2>
            <p className="text-gray-600 mb-6">
              Get started with a plan to unlock premium features.
            </p>
            <button
              onClick={() => navigate("/subscription/plans")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Choose a Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manage Subscription
        </h1>
        <p className="text-gray-600 mb-8">
          Update your subscription and billing settings
        </p>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Current Subscription */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Current Subscription
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-600 mb-2">Plan</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscription.planName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    subscription.isActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="font-semibold text-gray-900 capitalize">
                  {subscription.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Renewal Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Monthly Price</p>
              <p className="text-lg font-semibold text-gray-900">
                ${(subscription.planPrice / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Manage Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscription.planId !== "enterprise" && (
              <button
                onClick={handleUpgrade}
                className="p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Upgrade Plan
              </button>
            )}

            {downgradePlans[subscription.planId]?.length > 0 && (
              <button
                onClick={() => setShowDowngradeModal(true)}
                className="p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <MoreVertical className="w-5 h-5" />
                Downgrade Plan
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  setError("");

                  // Get Stripe Customer Portal URL
                  const data = await updatePaymentMethod();

                  // Redirect to Stripe Customer Portal
                  if (data.url) {
                    window.location.href = data.url;
                  }
                } catch (err) {
                  console.error("Error updating payment method:", err);
                  setError(
                    err.response?.data?.message ||
                      "Failed to open payment portal. Please try again."
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || subscription.planId === "free"}
              className="p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-5 h-5" />
              Update Payment Method
            </button>

            <button
              onClick={() => setShowCancelModal(true)}
              className="p-4 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Cancel Subscription
            </button>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Payment History
          </h2>

          {invoicesLoading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading invoices...</p>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {invoice.description || "Subscription Payment"}
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        ${(invoice.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "open"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {invoice.invoiceUrl ? (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No invoices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setError("");
          }}
          title="Cancel Subscription"
          isDangerous={true}
        >
          <p className="text-gray-600 mb-6">
            We're sorry to see you go. Please tell us why you're canceling so we
            can improve.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reason for cancellation *
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason</option>
              {reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Additional feedback (optional)
            </label>
            <textarea
              value={cancelFeedback}
              onChange={(e) => setCancelFeedback(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Tell us how we can improve..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              Your subscription will be canceled immediately. You'll lose access
              to premium features.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancelSubscription}
              disabled={loading || !cancelReason}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Cancel Subscription
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowCancelModal(false);
                setError("");
              }}
              disabled={loading}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
            >
              Keep Subscription
            </button>
          </div>
        </Modal>
      )}

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <Modal
          isOpen={showDowngradeModal}
          onClose={() => {
            setShowDowngradeModal(false);
            setTargetDowngradePlan("");
            setError("");
          }}
          title="Downgrade Plan"
        >
          <p className="text-gray-600 mb-6">
            Select which plan you'd like to downgrade to. Changes will take
            effect at your next billing date.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              New plan *
            </label>
            <select
              value={targetDowngradePlan}
              onChange={(e) => setTargetDowngradePlan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a plan</option>
              {downgradePlans[subscription.planId]?.map((plan) => (
                <option key={plan} value={plan}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> You'll be refunded
              any unused portion of your current plan.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDowngradePlan}
              disabled={loading || !targetDowngradePlan}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Downgrade
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowDowngradeModal(false);
                setTargetDowngradePlan("");
                setError("");
              }}
              disabled={loading}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================

const Modal = ({ isOpen, onClose, title, children, isDangerous = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDangerous ? "border-red-200" : "border-gray-200"
          }`}
        >
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default ManageSubscription;
