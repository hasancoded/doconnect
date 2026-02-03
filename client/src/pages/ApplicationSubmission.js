// client/src/pages/ApplicationSubmission.js - Enhanced with Cached Match Score
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import MatchScoreModal from "../components/applications/MatchScoreModal";
import { applicationAPI, jobAPI, handleApiError } from "../api";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  Send,
  Save,
  Briefcase,
  DollarSign,
  Calendar,
  User,
  Award,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

const ApplicationSubmission = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [showMatchScore, setShowMatchScore] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedMatchScore, setSubmittedMatchScore] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    cover_letter: "",
    approach: "",
    timeline_days: "",
    proposed_budget: "",
    start_date: "",
    hours_per_week: "",
    relevant_experience: "",
    questions: "",
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Load job data
  useEffect(() => {
    loadJobData();
    loadDraft();
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await jobAPI.getById(jobId);
      setJob(response.data.data);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch cached match score from backend
  const { data: cachedMatchScore, isLoading: matchLoading } = useQuery({
    queryKey: ["matchScore", jobId, user?.id],
    queryFn: async () => {
      try {
        const response = await applicationAPI.getMatchScore(jobId);
        return response?.data?.data?.matchScore || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!user && user?.role === "junior" && !!jobId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Check if user has already applied
  const { data: existingApplicationData, isLoading: checkingApplication } =
    useQuery({
      queryKey: ["existing-application", jobId, user?.id],
      queryFn: async () => {
        try {
          const response = await applicationAPI.getMyApplications({
            job_id: jobId,
          });
          const applications = response?.data?.data || [];
          // Filter out withdrawn applications - users can reapply after withdrawing
          const activeApplications = applications.filter(
            (app) => app.status !== "withdrawn"
          );
          return activeApplications.length > 0 ? activeApplications[0] : null;
        } catch (error) {
          return null;
        }
      },
      enabled: !!user && !!jobId,
      retry: 1,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: "always",
    });

  const existingApplication = existingApplicationData;

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`application_draft_${jobId}`);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  };

  // Debounced auto-save function
  const saveDraftDebounced = useCallback(() => {
    try {
      localStorage.setItem(
        `application_draft_${jobId}`,
        JSON.stringify(formData)
      );
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  }, [formData, jobId]);

  // Manual save for button
  const saveDraft = () => {
    try {
      localStorage.setItem(
        `application_draft_${jobId}`,
        JSON.stringify(formData)
      );
      toast.success("Draft saved", { duration: 2000 });
    } catch (err) {
      console.error("Failed to save draft:", err);
    }
  };

  // Auto-save effect (every 30 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.cover_letter || formData.approach) {
        saveDraftDebounced();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [formData, saveDraftDebounced]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.cover_letter.trim()) {
      errors.cover_letter = "Cover letter is required";
    } else if (formData.cover_letter.length < 100) {
      errors.cover_letter = "Cover letter must be at least 100 characters";
    } else if (formData.cover_letter.length > 1000) {
      errors.cover_letter = "Cover letter cannot exceed 1000 characters";
    }

    if (!formData.approach.trim()) {
      errors.approach = "Project approach is required";
    } else if (formData.approach.length < 50) {
      errors.approach = "Project approach must be at least 50 characters";
    } else if (formData.approach.length > 1500) {
      errors.approach = "Project approach cannot exceed 1500 characters";
    }

    if (!formData.timeline_days) {
      errors.timeline_days = "Timeline is required";
    } else if (
      parseInt(formData.timeline_days) < 1 ||
      parseInt(formData.timeline_days) > 365
    ) {
      errors.timeline_days = "Timeline must be between 1 and 365 days";
    }

    if (!formData.proposed_budget) {
      errors.proposed_budget = "Proposed budget is required";
    } else if (parseFloat(formData.proposed_budget) < 0) {
      errors.proposed_budget = "Budget cannot be negative";
    }

    if (!formData.start_date) {
      errors.start_date = "Availability start date is required";
    } else if (new Date(formData.start_date) < new Date()) {
      errors.start_date = "Start date must be in the future";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!validateForm()) {
      setError("Please fix the validation errors");
      return;
    }


    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  // New function to handle actual submission after confirmation
  const handleConfirmedSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");
      setShowConfirmModal(false);


      const applicationData = {
        job_id: jobId,
        proposal: {
          cover_letter: formData.cover_letter.trim(),
          approach: formData.approach.trim(),
          timeline_days: parseInt(formData.timeline_days),
          proposed_budget: parseFloat(formData.proposed_budget),
          availability: {
            start_date: formData.start_date,
            hours_per_week: formData.hours_per_week
              ? parseInt(formData.hours_per_week)
              : undefined,
          },
          relevant_experience: formData.relevant_experience.trim() || undefined,
          questions_for_employer: formData.questions.trim() || undefined,
        },
        source: "search",
      };


      const response = await applicationAPI.submit(applicationData);

      // Show match score modal
      const score = response?.data?.data?.match_score || 0;
      setMatchScore(score);
      setShowMatchScore(true);


      // Use the score already set for match score modal
      setSubmittedMatchScore(matchScore);

      // Clear draft
      localStorage.removeItem(`application_draft_${jobId}`);

      // Show success modal
      setShowSuccessModal(true);
      setSubmitting(false);
    } catch (err) {
      const apiError = handleApiError(err);

      // Check for specific error types
      if (
        apiError.message?.includes("already applied") ||
        apiError.message?.includes("not eligible")
      ) {
        toast.error("You have already applied to this job");
        // Refresh to show "already applied" state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      // Show error toast
      toast.error(apiError.message || "Failed to submit application");

      setError(
        apiError.message || "Failed to submit application. Please try again."
      );

      // Show validation errors if provided by API
      if (apiError.errors && Array.isArray(apiError.errors)) {
        const backendErrors = {};
        apiError.errors.forEach((error) => {
          if (error.field) {
            backendErrors[error.field] = error.message;
          }
        });
        setValidationErrors((prev) => ({ ...prev, ...backendErrors }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Format budget display
  const formatBudget = () => {
    if (!job?.budget) return "Not specified";
    const { amount, type } = job.budget;
    if (type === "negotiable") return "Negotiable";
    if (type === "hourly") return `$${amount}/hour`;
    return `$${amount?.toLocaleString()} fixed`;
  };

  if (loading || checkingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">
            {loading
              ? "Loading job details..."
              : "Checking application status..."}
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The job you're trying to apply for doesn't exist or is no longer
            available.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Show "Already Applied" state
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Job Details
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You've Already Applied
            </h2>
            <p className="text-gray-600 mb-6">
              You submitted an application for this position on{" "}
              {new Date(existingApplication.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to={`/applications/${existingApplication._id}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Your Application
              </Link>
              <Link
                to="/applications"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                View All Applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Job Details
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Apply for Position
          </h1>
          <p className="text-gray-600 mt-1">
            Submit your application for: {job.title}
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Letter */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Cover Letter *
                </h2>
                <div>
                  <textarea
                    value={formData.cover_letter}
                    onChange={(e) =>
                      handleChange("cover_letter", e.target.value)
                    }
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.cover_letter
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my strong interest in this position...&#10;&#10;• Highlight your relevant experience&#10;• Explain your interest in this role&#10;• Mention specific qualifications"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-sm ${
                        formData.cover_letter.length < 100
                          ? "text-red-500"
                          : formData.cover_letter.length > 1000
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.cover_letter.length} / 1000 characters (min:
                      100)
                    </span>
                  </div>
                  {validationErrors.cover_letter && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.cover_letter}
                    </p>
                  )}
                </div>
              </div>

              {/* Project Approach */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Project Approach *
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you approach this project?
                  </label>
                  <textarea
                    value={formData.approach}
                    onChange={(e) => handleChange("approach", e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.approach
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Describe your methodology:&#10;&#10;• Initial assessment phase&#10;• Key deliverables&#10;• Timeline breakdown&#10;• Quality assurance measures"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-sm ${
                        formData.approach.length < 50
                          ? "text-red-500"
                          : formData.approach.length > 1500
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.approach.length} / 1500 characters (min: 50)
                    </span>
                  </div>
                  {validationErrors.approach && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.approach}
                    </p>
                  )}
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Budget & Timeline *
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Budget ($)
                    </label>
                    <input
                      type="number"
                      value={formData.proposed_budget}
                      onChange={(e) =>
                        handleChange("proposed_budget", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.proposed_budget
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Job budget: {formatBudget()}
                    </p>
                    {validationErrors.proposed_budget && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.proposed_budget}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeline (days)
                    </label>
                    <input
                      type="number"
                      value={formData.timeline_days}
                      onChange={(e) =>
                        handleChange("timeline_days", e.target.value)
                      }
                      min="1"
                      max="365"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.timeline_days
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., 30"
                    />
                    {validationErrors.timeline_days && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.timeline_days}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        handleChange("start_date", e.target.value)
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.start_date
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    {validationErrors.start_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.start_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours per Week (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.hours_per_week}
                      onChange={(e) =>
                        handleChange("hours_per_week", e.target.value)
                      }
                      min="1"
                      max="168"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Additional Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relevant Experience (optional)
                    </label>
                    <textarea
                      value={formData.relevant_experience}
                      onChange={(e) =>
                        handleChange("relevant_experience", e.target.value)
                      }
                      rows={3}
                      maxLength={1500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your most relevant experience for this role..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Questions for Employer (optional)
                    </label>
                    <textarea
                      value={formData.questions}
                      onChange={(e) =>
                        handleChange("questions", e.target.value)
                      }
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any questions about the project, expectations, or requirements..."
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      * Required fields must be completed
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Draft auto-saves every 30 seconds
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={submitting}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        handleSubmit(e);
                      }}
                      disabled={submitting}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Job Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-gray-600">{job.category}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Award className="w-4 h-4 mr-2" />
                  {job.specialty}
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {formatBudget()}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Deadline:{" "}
                  {new Date(job.timeline?.deadline).toLocaleDateString()}
                </div>
              </div>

              {job.posted_by && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {job.posted_by.firstName} {job.posted_by.lastName}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        {job.posted_by.verificationStatus?.overall ===
                          "verified" && (
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        )}
                        Verified Employer
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Match Score */}
            {matchScore !== null && matchScore !== undefined && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Match Score
                </h3>
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      matchScore >= 80
                        ? "text-green-600"
                        : matchScore >= 60
                        ? "text-blue-600"
                        : matchScore >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {matchScore}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {matchScore >= 80
                      ? "Excellent match"
                      : matchScore >= 60
                      ? "Good match"
                      : matchScore >= 40
                      ? "Fair match"
                      : "Weak match"}
                  </p>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        matchScore >= 80
                          ? "bg-green-500"
                          : matchScore >= 60
                          ? "bg-blue-500"
                          : matchScore >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {matchLoading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center">
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">
                    Calculating match score...
                  </span>
                </div>
              </div>
            )}

            {/* Application Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-start mb-3">
                <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Application Tips
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Personalize your cover letter for this specific role
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Be specific about your approach and timeline</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Propose a competitive but realistic budget</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Proofread carefully before submitting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Review Your Application
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Please review your application carefully. Once submitted, you
                  will not be able to make changes.
                </p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span className="font-medium text-gray-900">{job?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Proposed Budget:</span>
                <span className="font-medium text-gray-900">
                  ${parseFloat(formData.proposed_budget || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timeline:</span>
                <span className="font-medium text-gray-900">
                  {formData.timeline_days} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">
                  {formData.start_date
                    ? new Date(formData.start_date).toLocaleDateString()
                    : "Not specified"}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800 flex items-start">
                <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Applications cannot be edited after submission. Make sure all
                  information is accurate.
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Confirm Submission
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-8 animate-fadeIn">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              {/* Success Message */}
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Application Submitted Successfully
              </h2>
              <p className="text-gray-600 mb-6">
                Your application has been successfully submitted to{" "}
                <span className="font-semibold text-gray-900">
                  {job?.title}
                </span>
              </p>

              {/* Match Score Display */}
              {submittedMatchScore !== null &&
                submittedMatchScore !== undefined && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Your Match Score
                    </p>
                    <div className="flex items-center justify-center mb-3">
                      <div
                        className={`text-5xl font-bold ${
                          submittedMatchScore >= 80
                            ? "text-green-600"
                            : submittedMatchScore >= 60
                            ? "text-blue-600"
                            : submittedMatchScore >= 40
                            ? "text-yellow-600"
                            : "text-orange-600"
                        }`}
                      >
                        {submittedMatchScore}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          submittedMatchScore >= 80
                            ? "bg-green-500"
                            : submittedMatchScore >= 60
                            ? "bg-blue-500"
                            : submittedMatchScore >= 40
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                        }`}
                        style={{ width: `${submittedMatchScore}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {submittedMatchScore >= 80
                        ? "Excellent match! You're a strong candidate."
                        : submittedMatchScore >= 60
                        ? "Good match! Your profile aligns well."
                        : submittedMatchScore >= 40
                        ? "Fair match. Highlight your strengths."
                        : "Keep applying to find your perfect match!"}
                    </p>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/applications")}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  View My Applications
                </button>
                <button
                  onClick={() => navigate("/jobs")}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Browse More Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Match Score Modal */}
      {showMatchScore && (
        <MatchScoreModal
          matchScore={matchScore}
          onClose={() => {
            setShowMatchScore(false);
            setShowSuccessModal(true);
          }}
        />
      )}
    </div>
  );
};

export default ApplicationSubmission;
