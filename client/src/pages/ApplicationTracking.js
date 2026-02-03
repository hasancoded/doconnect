// client/src/pages/ApplicationTracking.js - Enhanced with Polling and CSV Export
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { applicationAPI, handleApiError } from "../api";
import {
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  MessageSquare,
  Filter,
  Search,
  RefreshCw,
  MoreVertical,
  Briefcase,
  User,
  DollarSign,
  Calendar,
  Send,
  X as CloseIcon,
  TrendingUp,
  FileText,
  Award,
  Mail,
  Download,
  CalendarPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import AppointmentScheduler from "../components/appointments/AppointmentScheduler";

const ApplicationTracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sortBy: "createdAt",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Load applications on mount and when filters change
  useEffect(() => {
    loadApplications();
  }, [filters, page]);

  // Add polling for real-time updates
  useEffect(() => {
    // Only poll when page is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadApplications();
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadApplications();
      }
    }, 60000); // Poll every minute

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [filters, page]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: 10,
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
      };

      let response;
      if (user?.role === "junior") {
        response = await applicationAPI.getMyApplications(params);
      } else if (user?.role === "senior") {
        response = await applicationAPI.getReceived(params);
      } else {
        throw new Error("Invalid user role");
      }

      setApplications(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  // CSV export function
  const exportApplications = () => {
    try {
      const csvData = applications.map((app) => ({
        "Job Title": app.job_id?.title || "N/A",
        Status: app.status,
        "Applicant/Employer":
          user?.role === "senior"
            ? `${app.applicant_id?.firstName} ${app.applicant_id?.lastName}`
            : `${app.job_id?.posted_by?.firstName} ${app.job_id?.posted_by?.lastName}`,
        Budget: `$${app.proposal?.proposed_budget?.toLocaleString() || "0"}`,
        Timeline: `${app.proposal?.timeline_days || "N/A"} days`,
        Date: new Date(app.createdAt).toLocaleDateString(),
        "Match Score": app.match_score ? `${app.match_score}%` : "N/A",
      }));

      // Convert to CSV
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
          headers.map((header) => `"${row[header]}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Applications exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export applications");
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
      setError("");

      await applicationAPI.updateStatus(applicationId, newStatus);
      setSuccess(`Application ${newStatus} successfully`);
      setTimeout(() => setSuccess(""), 3000);

      // Reload applications
      loadApplications();
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || `Failed to update status`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleAccept = async (applicationId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
      setError("");

      await applicationAPI.accept(applicationId, {});
      toast.success("Application accepted successfully!");
      setSuccess("Application accepted successfully");
      setTimeout(() => setSuccess(""), 3000);

      // Reload applications
      loadApplications();
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message || "Failed to accept application");
      setError(apiError.message || "Failed to accept application");
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleReject = async (applicationId, reason = "") => {
    try {
      setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
      setError("");

      await applicationAPI.reject(applicationId, reason);
      toast.success("Application rejected");
      setSuccess("Application rejected successfully");
      setTimeout(() => setSuccess(""), 3000);

      // Reload applications
      loadApplications();
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message || "Failed to reject application");
      setError(apiError.message || "Failed to reject application");
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?"))
      return;

    try {
      setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
      setError("");

      await applicationAPI.withdraw(applicationId);
      setSuccess("Application withdrawn successfully");
      setTimeout(() => setSuccess(""), 3000);

      loadApplications();
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to withdraw application");
    } finally {
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleSendMessage = async (application) => {
    try {
      setActionLoading((prev) => ({ ...prev, [application._id]: true }));
      setError("");

      // Determine the other participant
      // Handle both populated objects and raw ObjectId strings
      let otherParticipantId;
      if (user?.role === "senior") {
        // For senior doctors, get the applicant's ID
        otherParticipantId =
          application.applicant_id?._id || application.applicant_id;
      } else {
        // For junior doctors, get the job poster's ID
        const postedBy = application.job_id?.posted_by;
        otherParticipantId = postedBy?._id || postedBy; // Handle both object and string
      }

        role: user?.role,
        applicant_id: application.applicant_id,
        posted_by: application.job_id?.posted_by,
        resolved_participant: otherParticipantId,
      });

      if (!otherParticipantId) {
        setError("Cannot create conversation - participant not found");
        return;
      }

      // Create or get existing conversation
      const { messageAPI } = await import("../api");
      const response = await messageAPI.createConversation(otherParticipantId);
      const conversation = response.data.data;

      // Navigate to messages page with conversation selected
      navigate(`/messages?conversationId=${conversation._id}`);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to start conversation");
    } finally {
      setActionLoading((prev) => ({ ...prev, [application._id]: false }));
    }
  };

  const viewDetails = async (application) => {
    try {
      const response = await applicationAPI.getById(
        application._id || application.id
      );
      setSelectedApplication(response.data.data);
      setShowDetailsModal(true);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to load application details");
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      under_review: "bg-purple-100 text-purple-800 border-purple-200",
      shortlisted: "bg-indigo-100 text-indigo-800 border-indigo-200",
      interview_scheduled: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
      completed: "bg-green-100 text-green-800 border-green-200",
    };
    return styles[status] || styles.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      submitted: Clock,
      under_review: Eye,
      interview_scheduled: Calendar,
      accepted: CheckCircle,
      rejected: XCircle,
      withdrawn: XCircle,
      completed: CheckCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter((app) =>
      ["submitted", "under_review"].includes(app.status)
    ).length,
    interviewing: applications.filter(
      (app) => app.status === "interview_scheduled"
    ).length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === "senior"
              ? "Application Management"
              : "My Applications"}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === "senior"
              ? "Review and manage applications for your job postings"
              : "Track your job applications and their progress"}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Interviewing</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.interviewing}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Accepted</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.accepted}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                "all",
                "submitted",
                "under_review",
                "shortlisted",
                "interview_scheduled",
                "accepted",
                "rejected",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, status }));
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    filters.status === status
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Sort & Actions */}
            <div className="flex items-center space-x-3">
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Most Recent</option>
                <option value="match_score">Best Match</option>
                <option value="budget">Budget (High to Low)</option>
              </select>

              <button
                onClick={exportApplications}
                disabled={applications.length === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                title="Export to CSV"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={loadApplications}
                disabled={loading}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application._id || application.id}
                application={application}
                userRole={user?.role}
                onViewDetails={viewDetails}
                onStatusUpdate={handleStatusUpdate}
                onAccept={handleAccept}
                onReject={handleReject}
                onWithdraw={handleWithdraw}
                onMessage={handleSendMessage}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-600 mb-6">
              {user?.role === "senior"
                ? "No applications received yet."
                : "You haven't submitted any applications yet."}
            </p>
            {user?.role === "junior" && (
              <Link
                to="/jobs"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Jobs
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedApplication && (
          <ApplicationDetailsModal
            application={selectedApplication}
            userRole={user?.role}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedApplication(null);
            }}
            onStatusUpdate={handleStatusUpdate}
            onAccept={handleAccept}
            onReject={handleReject}
            onMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

// Application Card Component
const ApplicationCard = ({
  application,
  userRole,
  onViewDetails,
  onStatusUpdate,
  onAccept,
  onReject,
  onWithdraw,
  onMessage,
  actionLoading,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  const getStatusBadge = (status) => {
    const styles = {
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      under_review: "bg-purple-100 text-purple-800 border-purple-200",
      shortlisted: "bg-indigo-100 text-indigo-800 border-indigo-200",
      interview_scheduled: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return styles[status] || styles.submitted;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Link
              to={`/jobs/${application.job_id?._id || application.job_id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
            >
              {application.job_id?.title || "Job Title"}
            </Link>
            {application.match_score && application.match_score > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {application.match_score}% match
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              {application.job_id?.category}
            </span>
            <span className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              {application.job_id?.specialty}
            </span>
            <span className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />$
              {application.proposal?.proposed_budget?.toLocaleString()}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(application.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
              application.status
            )}`}
          >
            {application.status.replace("_", " ")}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    onViewDetails(application);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    onMessage(application);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                >
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Send Message
                </button>

                {/* Schedule Interview Button for Senior Doctors */}
                {userRole === "senior" &&
                  application.status === "shortlisted" && (
                    <>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={() => {
                          setShowScheduler(true);
                          setShowMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50"
                      >
                        <CalendarPlus className="w-4 h-4 mr-3" />
                        Schedule Interview
                      </button>
                    </>
                  )}

                {userRole === "senior" &&
                  [
                    "submitted",
                    "under_review",
                    "shortlisted",
                    "interview_scheduled",
                  ].includes(application.status) && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div className="px-4 py-2">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Change Status
                        </p>
                      </div>
                      {application.status === "submitted" && (
                        <button
                          onClick={() => {
                            onStatusUpdate(
                              application._id || application.id,
                              "under_review"
                            );
                            setShowMenu(false);
                          }}
                          disabled={
                            actionLoading[application._id || application.id]
                          }
                          className="flex items-center w-full px-4 py-2 text-left text-purple-600 hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4 mr-3" />
                          Under Review
                        </button>
                      )}
                      {application.status === "under_review" && (
                        <button
                          onClick={() => {
                            onStatusUpdate(
                              application._id || application.id,
                              "shortlisted"
                            );
                            setShowMenu(false);
                          }}
                          disabled={
                            actionLoading[application._id || application.id]
                          }
                          className="flex items-center w-full px-4 py-2 text-left text-indigo-600 hover:bg-indigo-50"
                        >
                          <TrendingUp className="w-4 h-4 mr-3" />
                          Shortlist
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onAccept(application._id || application.id);
                          setShowMenu(false);
                        }}
                        disabled={
                          actionLoading[application._id || application.id]
                        }
                        className="flex items-center w-full px-4 py-2 text-left text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-3" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          onReject(application._id || application.id);
                          setShowMenu(false);
                        }}
                        disabled={
                          actionLoading[application._id || application.id]
                        }
                        className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-b-lg"
                      >
                        <XCircle className="w-4 h-4 mr-3" />
                        Reject
                      </button>
                    </>
                  )}

                {userRole === "junior" &&
                  ["submitted", "under_review"].includes(
                    application.status
                  ) && (
                    <>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={() => {
                          onWithdraw(application._id || application.id);
                          setShowMenu(false);
                        }}
                        disabled={
                          actionLoading[application._id || application.id]
                        }
                        className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-b-lg"
                      >
                        <XCircle className="w-4 h-4 mr-3" />
                        Withdraw
                      </button>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicant/Employer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {userRole === "senior"
              ? application.applicant_id?.firstName?.[0] || "A"
              : application.job_id?.posted_by?.firstName?.[0] || "E"}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {userRole === "senior"
                ? `${application.applicant_id?.firstName} ${application.applicant_id?.lastName}`
                : `${application.job_id?.posted_by?.firstName} ${application.job_id?.posted_by?.lastName}`}
            </p>
            <p className="text-sm text-gray-600">
              {userRole === "senior" ? "Applicant" : "Employer"}
            </p>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(application)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </button>
      </div>

      {/* Appointment Scheduler Modal */}
      {showScheduler && (
        <AppointmentScheduler
          doctor={application.applicant_id}
          conversationId={null}
          applicationId={application._id || application.id}
          onClose={() => setShowScheduler(false)}
          onSuccess={() => {
            setShowScheduler(false);
            toast.success("Interview scheduled! Application status updated.");
            // Reload page to show updated status while maintaining auth
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
        />
      )}
    </div>
  );
};

// Application Details Modal Component
const ApplicationDetailsModal = ({
  application,
  userRole,
  onClose,
  onStatusUpdate,
  onAccept,
  onReject,
  onMessage,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {application.job_id?.title}
            </h2>
            <p className="text-gray-600 mt-1">Application Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Status</h3>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium`}
              >
                Status: {application.status.replace("_", " ")}
              </span>
            </div>

            {/* Proposal */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Proposal</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-lg font-semibold">
                    ${application.proposal?.proposed_budget?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Timeline</p>
                  <p className="text-gray-900">
                    {application.proposal?.timeline_days} days
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {application.proposal?.cover_letter}
                </p>
              </div>
            </div>

            {/* Approach */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Project Approach</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {application.proposal?.approach}
                </p>
              </div>
            </div>

            {/* Communication Log */}
            {application.communication_log &&
              application.communication_log.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Communication History
                  </h3>
                  <div className="space-y-3">
                    {application.communication_log.map((log, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {log.from}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{log.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={() => onMessage(application)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </button>

          {userRole === "senior" &&
            [
              "submitted",
              "under_review",
              "shortlisted",
              "interview_scheduled",
            ].includes(application.status) && (
              <>
                {application.status === "submitted" && (
                  <button
                    onClick={() =>
                      onStatusUpdate(
                        application._id || application.id,
                        "under_review"
                      )
                    }
                    className="flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Under Review
                  </button>
                )}
                {application.status === "under_review" && (
                  <button
                    onClick={() =>
                      onStatusUpdate(
                        application._id || application.id,
                        "shortlisted"
                      )
                    }
                    className="flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Shortlist
                  </button>
                )}
                <button
                  onClick={() => onReject(application._id || application.id)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => onAccept(application._id || application.id)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </button>
              </>
            )}

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Message Modal Component
const MessageModal = ({
  application,
  messageText,
  setMessageText,
  sending,
  onSend,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Sending message regarding:{" "}
              <span className="font-medium text-gray-900">
                {application.job_id?.title}
              </span>
            </p>
          </div>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message here..."
          />
          <p className="text-xs text-gray-500 mt-2">
            {messageText.length} characters
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending || !messageText.trim()}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTracking;
