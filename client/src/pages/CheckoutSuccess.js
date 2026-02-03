// client/src/pages/CheckoutSuccess.js - Successful Checkout Page
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Check, Loader, AlertCircle } from "lucide-react";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription, subscription, subscriptionLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        setLoading(true);
        setError("");

        // Refresh subscription data
        const result = await refreshSubscription();

        if (!result) {
          setError(
            "Failed to confirm subscription. Please check your account."
          );
          setLoading(false);
          return;
        }

        setLoading(false);

        // Auto-redirect after 3 seconds
        const interval = setInterval(() => {
          setRedirectCountdown((count) => {
            if (count <= 1) {
              clearInterval(interval);
              navigate("/dashboard");
              return 0;
            }
            return count - 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error processing checkout success:", err);
        setError(
          err.response?.data?.message || "Failed to process your subscription"
        );
        setLoading(false);
      }
    };

    handleSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/subscription/plans")}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Back to Plans
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        ) : loading ? (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Processing Payment
            </h1>
            <p className="text-gray-600">
              We're confirming your subscription. Please wait...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              Welcome to your new plan:{" "}
              <span className="font-semibold capitalize">
                {subscription?.planName}
              </span>
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-green-800 mb-3">
                Your subscription is now active. You have full access to all
                premium features.
              </p>
              {subscription?.isTrialing && (
                <p className="text-sm text-green-800 font-semibold">
                  Enjoy your 7-day free trial!
                </p>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Redirecting to dashboard in {redirectCountdown} seconds...
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Go to Dashboard Now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
