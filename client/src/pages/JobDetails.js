// JobDetails.js - FIXED: Remove infinite loop
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { jobAPI, applicationAPI, handleApiError } from "../api";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Star,
  CheckCircle,
  Edit,
  Pause,
  Play,
  Trash2,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  X,
  Share2,
  MessageSquare,
} from "lucide-react";

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isJunior, isSenior } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch job details
  const {
    data: jobData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobAPI.getById(jobId),
    retry: 2,
  });

  const job = jobData?.data?.data;

  const isOwner = job?.posted_by?._id === user?.id;

  // Track view mutation
  const trackViewMutation = useMutation({
    mutationFn: () => jobAPI.trackView(jobId),
  });

  // Track view only once per session and not for job owner
  const hasTrackedView = React.useRef(false);

  useEffect(() => {
    // Only track if:
    // 1. Job data is loaded
    // 2. User is not the owner
    // 3. Haven't tracked this view yet in this session
    if (job && !isOwner && !hasTrackedView.current) {
      trackViewMutation.mutate();
      hasTrackedView.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, isOwner, trackViewMutation]); // Only track once per jobId when not owner

  // Fetch top applicants preview (only for job owners)
  const { data: topApplicantsData } = useQuery({
    queryKey: ["job-applicants-preview", jobId],
    queryFn: async () => {
      const response = await applicationAPI.getByJob(jobId, {
        limit: 3,
        sortBy: "match_score",
      });
      return response;
    },
    enabled:
      isAuthenticated &&
      job?.posted_by?._id === user?.id &&
      job?.status === "active",
    retry: 1,
  });

  const topApplicants = topApplicantsData?.data?.data || [];

  // Check if current user has already applied to this job
  const { data: userApplicationData } = useQuery({
    queryKey: ["user-application", jobId, user?.id],
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
          "📋 Active applications found:",
          activeApplications.length,
          activeApplications
        );
        return activeApplications.length > 0 ? activeApplications[0] : null;
      } catch (error) {
        return null;
      }
    },
    enabled:
      isAuthenticated &&
      typeof isJunior === "function" &&
      isJunior() &&
      !!jobId &&
      !!user?.id,
    retry: 1,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache withdrawn application status
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const userApplication = userApplicationData;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => jobAPI.delete(jobId),
    onSuccess: () => {
      toast.success("Job deleted successfully");
      navigate("/jobs/manage");
    },
    onError: (error) => toast.error(handleApiError(error).message),
  });

  // Pause mutation
  const pauseMutation = useMutation({
    mutationFn: () => jobAPI.pause(jobId),
    onSuccess: () => {
      toast.success("Job paused");
      queryClient.invalidateQueries(["job", jobId]);
    },
    onError: (error) => toast.error(handleApiError(error).message),
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: () => jobAPI.activate(jobId),
    onSuccess: () => {
      toast.success("Job activated");
      queryClient.invalidateQueries(["job", jobId]);
    },
    onError: (error) => toast.error(handleApiError(error).message),
  });

  // Share job function
  const shareJob = async () => {
    const shareData = {
      title: job?.title || "Medical Job Opportunity",
      text: `Check out this job: ${job?.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Job shared successfully!");
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        // User cancelled share
        console.error("Share failed:", err);
        toast.error("Failed to share job");
      }
    }
  };

  // Helpers
  const formatBudget = () => {
    if (!job?.budget) return "Negotiable";
    if (job.budget.type === "negotiable") return "Negotiable";
    if (job.budget.type === "hourly") return `$${job.budget.amount}/hr`;
    return `$${job.budget.amount?.toLocaleString()}`;
  };

  const canApply = isAuthenticated && isJunior() && !isOwner;
  const canEdit = isAuthenticated && isOwner;

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-32 bg-gray-200 rounded mb-4" />
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 text-center mb-2">
              Job Not Found
            </h3>
            <p className="text-red-700 text-center mb-4">
              {error ? handleApiError(error).message : "Job does not exist"}
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back</span>
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg border">
          {/* Header */}
          <div className="p-8 border-b">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="capitalize">{job.category}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {job.specialty}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize">
                      {job.requirements?.location_preference || "Remote"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatBudget()}
                </div>
                <p className="text-sm text-gray-500 capitalize">
                  {job.budget?.type} payment
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600 py-4 border-y">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {job.applications_count || 0} applications
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {job.views_count || 0} views
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Share Button */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={shareJob}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                title="Share this job"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Owner Actions */}
            {canEdit && (
              <div className="flex gap-3 mt-4">
                <Link
                  to={`/jobs/${jobId}/edit`}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                {job.status === "active" ? (
                  <button
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-yellow-500 text-yellow-700 rounded-lg hover:bg-yellow-50"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => activateMutation.mutate()}
                    disabled={activateMutation.isLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-700 rounded-lg hover:bg-green-50"
                  >
                    <Play className="w-4 h-4" />
                    Activate
                  </button>
                )}
                <Link
                  to={`/applications?jobId=${jobId}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4" />
                  Applications ({job.applications_count || 0})
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-700 rounded-lg hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="p-8 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="p-8 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Requirements
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Experience
                </h3>
                <p className="text-gray-700">
                  {job.experience_required?.level} level
                </p>
                <p className="text-sm text-gray-600">
                  Minimum {job.experience_required?.minimum_years} years
                </p>
              </div>

              {job.timeline?.deadline && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Deadline
                  </h3>
                  <p className="text-gray-700">
                    {new Date(job.timeline.deadline).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.ceil(
                      (new Date(job.timeline.deadline) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days remaining
                  </p>
                </div>
              )}

              {job.timeline?.estimated_hours && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Estimated Hours
                  </h3>
                  <p className="text-gray-700">
                    {job.timeline.estimated_hours} hours
                  </p>
                </div>
              )}
            </div>

            {job.skills_required && job.skills_required.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Applicants Preview - Only show to owner */}
          {isOwner && topApplicants.length > 0 && (
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Top Applicants
                </h2>
                <Link
                  to={`/applications?jobId=${jobId}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All ({job.applications_count})
                </Link>
              </div>
              <div className="space-y-3">
                {topApplicants.map((app) => (
                  <div
                    key={app._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {app.applicant_id?.firstName?.[0]}
                        {app.applicant_id?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.applicant_id?.firstName}{" "}
                          {app.applicant_id?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${app.proposal?.proposed_budget?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.match_score && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {app.match_score}% match
                        </span>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const { messageAPI } = await import("../api");
                            const response =
                              await messageAPI.createConversation(
                                app.applicant_id._id
                              );
                            navigate(
                              `/messages?conversationId=${response.data.data._id}`
                            );
                          } catch (error) {
                            console.error(
                              "Failed to create conversation:",
                              error
                            );
                          }
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="Message applicant"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employer Info */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About the Employer
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {job.posted_by?.firstName?.[0]}
                {job.posted_by?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {job.posted_by?.firstName} {job.posted_by?.lastName}
                  </h3>
                  {job.posted_by?.verificationStatus?.overall ===
                    "verified" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className="text-blue-600 font-medium mb-2">
                  {job.posted_by?.primarySpecialty}
                </p>
                {job.posted_by?.rating?.average > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>{job.posted_by.rating.average.toFixed(1)}</span>
                    <span>({job.posted_by.rating.count} reviews)</span>
                  </div>
                )}
              </div>
              {/* Contact Poster Button - Only for junior doctors */}
              {canApply && (
                <button
                  onClick={async () => {
                    try {
                      const { messageAPI } = await import("../api");
                      const response = await messageAPI.createConversation(
                        job.posted_by._id
                      );
                      navigate(
                        `/messages?conversationId=${response.data.data._id}`
                      );
                    } catch (error) {
                      console.error("Failed to create conversation:", error);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Poster
                </button>
              )}
            </div>
          </div>

          {/* Apply Section */}
          {canApply && !userApplication && (
            <div className="p-8 bg-gray-50 border-t">
              <button
                onClick={() => navigate(`/jobs/${jobId}/apply`)}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
              >
                Apply for this Job
              </button>
            </div>
          )}

          {/* Already Applied Section */}
          {canApply && userApplication && (
            <div className="p-8 bg-green-50 border-t border-green-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  You've Already Applied
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Application submitted on{" "}
                  {new Date(userApplication.createdAt).toLocaleDateString()}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to={`/applications/${userApplication._id}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Application
                  </Link>
                  <Link
                    to="/applications"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    All Applications
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="p-8 bg-gray-50 border-t">
              <button
                onClick={() =>
                  navigate("/login", { state: { from: `/jobs/${jobId}` } })
                }
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
              >
                Login to Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Job
              </h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this job? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
