// client/src/components/applications/MatchScoreModal.js
import React from "react";
import { X, Award, TrendingUp } from "lucide-react";

const MatchScoreModal = ({ matchScore, onClose }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return "Excellent Match!";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Low Match";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Application Submitted!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Your application has been successfully submitted!
            </p>

            {/* Match Score Display */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Your Match Score
                </span>
              </div>

              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreColor(
                  matchScore
                )} mb-3`}
              >
                <span className="text-4xl font-bold">{matchScore}</span>
              </div>

              <p className="text-lg font-semibold text-gray-900">
                {getScoreMessage(matchScore)}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <p>
                The employer will review your application and may contact you
                for an interview.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreModal;
