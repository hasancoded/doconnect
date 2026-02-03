// client/src/pages/AdminDashboard.js - REAL-TIME ADMIN DASHBOARD WITH WEBSOCKET + POLLING
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../api";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { useRealtimeMetrics } from "../hooks/useRealtimeMetrics";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Eye,
  AlertTriangle,
  TrendingUp,
  Users,
  Award,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Mail,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckSquare,
  Calendar,
  Briefcase,
  GraduationCap,
  X,
  Check,
  Loader,
  Star,
  DollarSign,
  PlayCircle,
  PauseCircle,
  Ban,
  Wifi,
  WifiOff,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================================
  // REAL-TIME CONNECTION & METRICS
  // ============================================================================

  // Socket.IO connection for real-time updates
  const { socket, isConnected, connectionError } = useAdminSocket();

  // Navigation hook for in-app navigation
  const navigate = useNavigate();

  // Real-time metrics with polling fallback
  const {
    metrics: dashboardData,
    loading: metricsLoading,
    error: metricsError,
    lastFetch,
    refresh: refreshMetrics,
  } = useRealtimeMetrics(socket, isConnected);

  // ============================================================================
  // EXISTING DATA STATES (Keep for other tabs)
  // ============================================================================

  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [verificationStats, setVerificationStats] = useState(null);

  // Job management states
  const [allJobs, setAllJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [jobsPagination, setJobsPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  // Application management states
  const [allApplications, setAllApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [applicationsPagination, setApplicationsPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  // Approved doctors states
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [approvedPagination, setApprovedPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  // Rejected users states
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [rejectedPagination, setRejectedPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
  });

  // UI states
  const [filters, setFilters] = useState({
    type: "all",
    page: 1,
    limit: 10,
    search: "",
    role: "all",
    status: "all",
    specialty: "all",
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  // ============================================================================
  // REAL-TIME EVENT HANDLERS
  // ============================================================================

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for user registration events
    socket.on("admin:user:registered", (data) => {
      // Optionally show toast notification
      setSuccess(`New user registered: ${data.name}`);
      setTimeout(() => setSuccess(""), 3000);
    });

    // Listen for verification updates
    socket.on("admin:verification:updated", (data) => {
    });

    // Listen for new job postings
    socket.on("admin:job:created", (data) => {
    });

    // Listen for new applications
    socket.on("admin:application:submitted", (data) => {
    });

    return () => {
      socket.off("admin:user:registered");
      socket.off("admin:verification:updated");
      socket.off("admin:job:created");
      socket.off("admin:application:submitted");
    };
  }, [socket, isConnected]);

  // ============================================================================
  // FETCH DATA FOR OTHER TABS (Keep existing logic)
  // ============================================================================

  // Fetch verification stats (keep for stats tab)
  const fetchVerificationStats = useCallback(
    async (timeframe = "30d", silent = false) => {
      try {
        const response = await adminAPI.getVerificationStats(timeframe);
        setVerificationStats(response.data.data);
      } catch (err) {
        console.error("❌ Error fetching verification stats:", err);
        console.error("Error details:", err.response?.data);
      }
    },
    [],
  );

  const fetchPendingVerifications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          type: filters.type !== "all" ? filters.type : undefined,
          page: filters.page,
          limit: filters.limit,
        };

        const response = await adminAPI.getPendingVerifications(params);
        setPendingVerifications(response.data.data);
        setError("");
      } catch (err) {
        console.error("Error fetching pending verifications:", err);
        if (!silent)
          setError(
            err.response?.data?.message || "Failed to fetch verifications",
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters.type, filters.page, filters.limit],
  );

  const fetchAllUsers = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);

        // Since there's no getAllUsers endpoint, we'll fetch pending and use search
        // You might want to add a GET /api/admin/users endpoint in the backend
        const response = await adminAPI.getPendingVerifications({
          type: "all",
          page: filters.page,
          limit: 50, // Get more users
        });

        setAllUsers(response.data.data);
        setError("");
      } catch (err) {
        console.error("Error fetching all users:", err);
        if (!silent) setError("Failed to fetch users");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters.page],
  );

  const verifyProfile = async (
    userId,
    verificationType,
    status,
    notes = "",
  ) => {
    setShowConfirmModal(null);

    try {
      setLoading(true);

      const verificationData = { status, notes };

      let response;
      switch (verificationType) {
        case "identity":
          response = await adminAPI.verifyIdentity(userId, verificationData);
          break;
        case "medical_license":
          response = await adminAPI.verifyMedicalLicense(
            userId,
            verificationData,
          );
          break;
        case "background_check":
          response = await adminAPI.verifyBackgroundCheck(
            userId,
            verificationData,
          );
          break;
        default:
          throw new Error("Invalid verification type");
      }

      setSuccess(response.data.message || `Profile ${status} successfully`);

      // Refresh data
      await Promise.all([
        fetchPendingVerifications(true),
        fetchApprovedDoctors(true),
        fetchRejectedUsers(true),
        refreshMetrics(),
        fetchVerificationStats("30d", true),
      ]);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error verifying profile:", err);
      setError(err.response?.data?.message || "Failed to verify profile");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const revokeVerification = async (userId, verificationType, notes = "") => {
    setShowConfirmModal(null);

    try {
      setLoading(true);

      const response = await adminAPI.revokeVerification(
        userId,
        verificationType,
        notes,
      );

      setSuccess(response.data.message || `Verification revoked successfully`);

      // Refresh data
      await Promise.all([
        fetchPendingVerifications(true),
        fetchApprovedDoctors(true),
        refreshMetrics(),
        fetchVerificationStats("30d", true),
      ]);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error revoking verification:", err);
      setError(err.response?.data?.message || "Failed to revoke verification");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const bulkVerify = async (status) => {
    if (selectedUsers.length === 0) {
      setError("Please select users to verify");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setShowConfirmModal(null);

    try {
      setLoading(true);

      const bulkData = {
        userIds: selectedUsers,
        verificationType: filters.type !== "all" ? filters.type : "identity",
        status,
        notes: `Bulk ${status} via admin dashboard`,
      };

      const response = await adminAPI.bulkVerification(bulkData);
      setSuccess(`Bulk ${status} completed for ${selectedUsers.length} users`);

      setSelectedUsers([]);

      // Refresh all data
      await Promise.all([
        fetchPendingVerifications(),
        refreshMetrics(),
        fetchVerificationStats("30d", true),
      ]);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error with bulk verification:", err);
      setError(err.response?.data?.message || "Bulk verification failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // JOB MANAGEMENT API FUNCTIONS
  // ============================================================================

  const fetchAllJobs = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          page: filters.page,
          limit: filters.limit,
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        };

        const response = await adminAPI.getAllJobs(params);
        setAllJobs(response.data.data);
        setJobsPagination(response.data.pagination);
        setError("");
      } catch (err) {
        console.error("Error fetching jobs:", err);
        if (!silent)
          setError(err.response?.data?.message || "Failed to fetch jobs");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters.page, filters.limit, filters.status, filters.search],
  );

  const handleJobAction = async (jobId, action, reason = "") => {
    setShowConfirmModal(null);

    try {
      setLoading(true);
      const response = await adminAPI.adminJobAction(jobId, action, reason);
      setSuccess(response.data.message || `Job ${action}ed successfully`);

      // Refresh jobs list
      await fetchAllJobs(true);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error with job action:", err);
      setError(err.response?.data?.message || `Failed to ${action} job`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkJobAction = async (status) => {
    if (selectedJobs.length === 0) {
      setError("Please select jobs to update");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setShowConfirmModal(null);

    try {
      setLoading(true);
      const response = await adminAPI.bulkJobAction(selectedJobs, status);
      setSuccess(`Bulk job update completed: ${response.data.message}`);

      setSelectedJobs([]);
      await fetchAllJobs(true);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error with bulk job action:", err);
      setError(err.response?.data?.message || "Bulk job action failed");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // APPLICATION MANAGEMENT API FUNCTIONS
  // ============================================================================

  const fetchAllApplications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          page: filters.page,
          limit: filters.limit,
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        };

        const response = await adminAPI.getAllApplications(params);
        setAllApplications(response.data.data);
        setApplicationsPagination(response.data.pagination);
        setError("");
      } catch (err) {
        console.error("Error fetching applications:", err);
        if (!silent)
          setError(
            err.response?.data?.message || "Failed to fetch applications",
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters.page, filters.limit, filters.status, filters.search],
  );

  const fetchApprovedDoctors = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          page: filters.page,
          limit: filters.limit,
          search: filters.search || undefined,
        };

        const response = await adminAPI.getVerifiedUsers(params);
        setApprovedDoctors(response.data.data);
        setApprovedPagination(response.data.pagination);
        setError("");
      } catch (err) {
        console.error("Error fetching approved doctors:", err);
        if (!silent)
          setError(
            err.response?.data?.message || "Failed to fetch approved doctors",
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters.page, filters.limit, filters.search],
  );

  const fetchRejectedUsers = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          page: filters.page,
          limit: filters.limit,
          search: filters.search || undefined,
        };

        const response = await adminAPI.getRejectedUsers(params);
        setRejectedUsers(response.data.data);
        setRejectedPagination(response.data.pagination);
        setError("");
      } catch (err) {
        console.error("Error fetching rejected users:", err);
        if (!silent)
          setError(
            err.response?.data?.message || "Failed to fetch rejected users",
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters.page, filters.limit, filters.search],
  );

  // Fetch data when tab or filters change (moved here after function definitions)
  useEffect(() => {

    if (activeTab === "pending" && isAdmin()) {
      fetchPendingVerifications();
    } else if (activeTab === "users" && isAdmin()) {
      fetchAllUsers();
    } else if (activeTab === "jobs" && isAdmin()) {
      fetchAllJobs();
    } else if (activeTab === "applications" && isAdmin()) {
      fetchAllApplications();
    } else if (activeTab === "stats" && isAdmin()) {
      fetchVerificationStats();
    } else if (activeTab === "approved" && isAdmin()) {
      fetchApprovedDoctors();
    } else if (activeTab === "rejected" && isAdmin()) {
      fetchRejectedUsers();
    }
  }, [
    filters,
    activeTab,
    isAdmin,
    fetchPendingVerifications,
    fetchAllUsers,
    fetchAllJobs,
    fetchAllApplications,
    fetchVerificationStats,
    fetchApprovedDoctors,
    fetchRejectedUsers,
  ]);

  const handleResolveDispute = async (
    applicationId,
    resolution,
    notes = "",
  ) => {
    setShowConfirmModal(null);

    try {
      setLoading(true);
      const response = await adminAPI.resolveDispute(
        applicationId,
        resolution,
        notes,
      );
      setSuccess(response.data.message || "Dispute resolved successfully");

      // Refresh applications list
      await fetchAllApplications(true);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error resolving dispute:", err);
      setError(err.response?.data?.message || "Failed to resolve dispute");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllJobs = () => {
    if (selectedJobs.length === allJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(allJobs.map((j) => j._id));
    }
  };

  const handleSelectAllApplications = () => {
    if (selectedApplications.length === allApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(allApplications.map((a) => a._id));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === pendingVerifications.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(pendingVerifications.map((p) => p._id));
    }
  };

  // UI Components - Refined Design
  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
    subtitle,
    onClick,
  }) => (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      }`}
      onClick={onClick}
      style={{ boxShadow: "none" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
            {title}
          </p>
          <p className="text-3xl font-semibold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-700">{trend}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      verified: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      active: "bg-blue-50 text-blue-700 border-blue-200",
      inactive: "bg-gray-50 text-gray-600 border-gray-200",
      suspended: "bg-red-50 text-red-700 border-red-200",
      submitted: "bg-blue-50 text-blue-600 border-blue-200",
      under_review: "bg-purple-50 text-purple-700 border-purple-200",
      accepted: "bg-green-50 text-green-700 border-green-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
      closed: "bg-gray-50 text-gray-600 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
          colors[status] || colors.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = "warning",
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            {type === "danger" ? (
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md text-white ${
                type === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Real-Time Connection Status */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-sm font-normal text-green-700">
                  Live Updates Active
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-normal text-amber-700">
                  Polling Mode (30s)
                </span>
              </>
            )}
          </div>

          {/* Last Update Time */}
          {lastFetch && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Updated {new Date(lastFetch).toLocaleTimeString()}</span>
            </div>
          )}

          {/* Connection Error */}
          {connectionError && (
            <div className="flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{connectionError}</span>
            </div>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={refreshMetrics}
          disabled={metricsLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          <RefreshCw
            className={`w-4 h-4 ${metricsLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {metricsLoading && !dashboardData ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : dashboardData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Users"
              value={dashboardData.metrics?.users?.total || 0}
              icon={Users}
              color="blue"
              subtitle={`${dashboardData.metrics?.users?.active || 0} active`}
              onClick={() => setActiveTab("users")}
            />
            <MetricCard
              title="Verified Users"
              value={dashboardData.metrics?.verification?.verified || 0}
              icon={CheckCircle}
              color="green"
            />
            <MetricCard
              title="Pending Verification"
              value={dashboardData.metrics?.verification?.pending || 0}
              icon={Clock}
              color="yellow"
              onClick={() => setActiveTab("pending")}
            />
            <MetricCard
              title="Verification Rate"
              value={`${dashboardData.metrics?.verification?.rate || 0}%`}
              icon={Award}
              color="purple"
            />
          </div>

          {/* Role Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Doctor Roles Distribution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Senior Doctors
                      </p>
                      <p className="text-sm text-gray-500">Job Posters</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardData.metrics?.doctors?.senior || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Junior Doctors
                      </p>
                      <p className="text-sm text-gray-500">Job Seekers</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardData.metrics?.doctors?.junior || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      New Registrations
                    </p>
                    <p className="text-sm text-gray-600">Last 7 days</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {dashboardData.metrics?.activity?.newUsers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Recently Verified
                    </p>
                    <p className="text-sm text-gray-600">Last 7 days</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {dashboardData.metrics?.activity?.recentlyVerified || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Specialties */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Medical Specialties
            </h3>
            <div className="space-y-3">
              {dashboardData.topSpecialties
                ?.slice(0, 5)
                .map((specialty, index) => {
                  const maxCount = dashboardData.topSpecialties[0].count;
                  const percentage = (specialty.count / maxCount) * 100;

                  return (
                    <div
                      key={specialty._id}
                      className="flex items-center space-x-4"
                    >
                      <span className="text-sm font-medium text-gray-500 w-8">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {specialty._id}
                          </span>
                          <span className="text-sm text-gray-600">
                            {specialty.count} doctors
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.quickActions?.map((action, index) => (
                <button
                  key={index}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  onClick={() => setActiveTab("pending")}
                >
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {action.label}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.count} items pending
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No dashboard data available</p>
          <button
            onClick={refreshMetrics}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );

  const PendingVerificationsTab = () => (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or license..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder:text-gray-400"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value,
                page: 1,
              }))
            }
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 min-w-[160px]"
          >
            <option value="all">All Types</option>
            <option value="identity">Identity</option>
            <option value="medical_license">Medical License</option>
            <option value="background_check">Background Check</option>
          </select>

          {/* Per Page Filter */}
          <select
            value={filters.limit}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                limit: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 min-w-[130px]"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchPendingVerifications()}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 min-w-[110px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
            <div className="flex items-center space-x-4">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">
                {selectedUsers.length} user
                {selectedUsers.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setShowConfirmModal({
                    type: "bulk-approve",
                    title: "Bulk Approve Identity Verification",
                    message: `Are you sure you want to approve identity verification for ${selectedUsers.length} selected user(s)? This will mark their identity as verified.`,
                    action: () => bulkVerify("verified"),
                  })
                }
                className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm disabled:opacity-50"
                disabled={loading}
              >
                <Check className="w-4 h-4" />
                <span>Approve Identity (All)</span>
              </button>
              <button
                onClick={() =>
                  setShowConfirmModal({
                    type: "bulk-reject",
                    title: "Bulk Reject Identity Verification",
                    message: `Are you sure you want to reject identity verification for ${selectedUsers.length} selected user(s)? This will mark their identity as rejected.`,
                    action: () => bulkVerify("rejected"),
                  })
                }
                className="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm disabled:opacity-50"
                disabled={loading}
              >
                <X className="w-4 h-4" />
                <span>Reject Identity (All)</span>
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Queue */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingVerifications.length > 0 ? (
          <>
            {/* Select All */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedUsers.length === pendingVerifications.length &&
                    pendingVerifications.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="font-medium text-gray-900">
                  Select All ({pendingVerifications.length} users)
                </span>
              </label>
            </div>

            {pendingVerifications.map((profile) => (
              <div
                key={profile._id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(profile._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers((prev) => [...prev, profile._id]);
                      } else {
                        setSelectedUsers((prev) =>
                          prev.filter((id) => id !== profile._id),
                        );
                      }
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />

                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {profile.profilePhoto?.url ? (
                      <img
                        src={profile.profilePhoto.url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Dr. {profile.firstName} {profile.lastName}
                        </h4>
                        <p className="text-blue-600 font-semibold text-lg">
                          {profile.primarySpecialty}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {profile.email}
                          </span>
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {profile.yearsOfExperience} years exp.
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">License:</span>{" "}
                          {profile.medicalLicenseNumber} ({profile.licenseState}
                          )
                        </p>
                      </div>

                      <div className="text-right">
                        <StatusBadge status={profile.accountStatus} />
                        <p className="text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Verification Status Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          profile.verificationStatus.identity === "verified"
                            ? "bg-green-50 border-green-200"
                            : profile.verificationStatus.identity === "rejected"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">Identity</p>
                        <StatusBadge
                          status={profile.verificationStatus.identity}
                        />
                      </div>
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          profile.verificationStatus.medical_license ===
                          "verified"
                            ? "bg-green-50 border-green-200"
                            : profile.verificationStatus.medical_license ===
                                "rejected"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">
                          Medical License
                        </p>
                        <StatusBadge
                          status={profile.verificationStatus.medical_license}
                        />
                      </div>
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          profile.verificationStatus.background_check ===
                          "verified"
                            ? "bg-green-50 border-green-200"
                            : profile.verificationStatus.background_check ===
                                "rejected"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">Background</p>
                        <StatusBadge
                          status={profile.verificationStatus.background_check}
                        />
                      </div>
                    </div>

                    {/* Documents */}
                    {profile.documents && profile.documents.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Documents ({profile.documents.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profile.documents.map((doc) => (
                            <div
                              key={doc._id}
                              className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200"
                            >
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-700 font-medium">
                                {doc.type.replace(/_/g, " ").toUpperCase()}
                              </span>
                              {doc.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          setExpandedProfile(
                            expandedProfile === profile._id
                              ? null
                              : profile._id,
                          )
                        }
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                        {expandedProfile === profile._id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setShowConfirmModal({
                              type: "approve",
                              title: "Approve Identity Verification",
                              message: `Approve identity verification for Dr. ${profile.firstName} ${profile.lastName}?`,
                              action: () =>
                                verifyProfile(
                                  profile._id,
                                  "identity",
                                  "verified",
                                ),
                            })
                          }
                          className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm disabled:opacity-50"
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve Identity</span>
                        </button>
                        <button
                          onClick={() =>
                            setShowConfirmModal({
                              type: "reject",
                              title: "Reject Identity Verification",
                              message: `Reject identity verification for Dr. ${profile.firstName} ${profile.lastName}?`,
                              action: () =>
                                verifyProfile(
                                  profile._id,
                                  "identity",
                                  "rejected",
                                  "Documents require review",
                                ),
                            })
                          }
                          className="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm disabled:opacity-50"
                          disabled={loading}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Identity</span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedProfile === profile._id && (
                      <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Profile Details
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Medical School:
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {profile.medicalSchool?.name || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Graduation Year:
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {profile.medicalSchool?.graduationYear ||
                                    "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Experience:
                                </span>
                                <span className="text-gray-900 font-medium">
                                  {profile.yearsOfExperience} years
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Account Status:
                                </span>
                                <StatusBadge status={profile.accountStatus} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Shield className="w-4 h-4 mr-2" />
                              Verification Actions
                            </h5>
                            <div className="space-y-2">
                              <button
                                onClick={() =>
                                  verifyProfile(
                                    profile._id,
                                    "identity",
                                    "verified",
                                  )
                                }
                                className="w-full text-left px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                                disabled={loading}
                              >
                                ✓ Approve Identity
                              </button>
                              <button
                                onClick={() =>
                                  verifyProfile(
                                    profile._id,
                                    "medical_license",
                                    "verified",
                                  )
                                }
                                className="w-full text-left px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                                disabled={loading}
                              >
                                ✓ Approve Medical License
                              </button>
                              <button
                                onClick={() =>
                                  verifyProfile(
                                    profile._id,
                                    "background_check",
                                    "verified",
                                  )
                                }
                                className="w-full text-left px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                                disabled={loading}
                              >
                                ✓ Approve Background Check
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/profile/${profile._id}`)
                                }
                                className="w-full text-left px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                              >
                                👁 View Full Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600">
              No pending verifications at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const ApprovedDoctorsTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search approved doctors..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => fetchApprovedDoctors()}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 min-w-[110px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Approved Doctors List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : approvedDoctors.length > 0 ? (
          <>
            {approvedDoctors.map((profile) => (
              <div
                key={profile._id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full overflow-hidden flex-shrink-0">
                    {profile.profilePhoto?.url ? (
                      <img
                        src={profile.profilePhoto.url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-green-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Dr. {profile.firstName} {profile.lastName}
                        </h4>
                        <p className="text-green-600 font-semibold text-lg">
                          {profile.primarySpecialty}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {profile.email}
                          </span>
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {profile.yearsOfExperience} years exp.
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">License:</span>{" "}
                          {profile.medicalLicenseNumber} ({profile.licenseState}
                          )
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Verification Status Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-lg border-2 bg-green-50 border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Identity</p>
                        <StatusBadge
                          status={
                            profile.verificationStatus?.identity || "verified"
                          }
                        />
                      </div>
                      <div className="p-3 rounded-lg border-2 bg-green-50 border-green-200">
                        <p className="text-xs text-gray-600 mb-1">
                          Medical License
                        </p>
                        <StatusBadge
                          status={
                            profile.verificationStatus?.medical_license ||
                            "verified"
                          }
                        />
                      </div>
                      <div className="p-3 rounded-lg border-2 bg-green-50 border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Background</p>
                        <StatusBadge
                          status={
                            profile.verificationStatus?.background_check ||
                            "verified"
                          }
                        />
                      </div>
                    </div>

                    {/* Revoke Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() => navigate(`/profile/${profile._id}`)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Profile</span>
                      </button>

                      <div className="flex space-x-2">
                        {profile.verificationStatus?.identity ===
                          "verified" && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                type: "revoke",
                                title: "Revoke Identity Verification",
                                message: `Revoke identity verification for Dr. ${profile.firstName} ${profile.lastName}? They will need to be re-verified.`,
                                action: () =>
                                  revokeVerification(profile._id, "identity"),
                              })
                            }
                            className="flex items-center space-x-1 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-150 font-medium disabled:opacity-50"
                            disabled={loading}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Revoke Identity</span>
                          </button>
                        )}
                        {profile.verificationStatus?.medical_license ===
                          "verified" && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                type: "revoke",
                                title: "Revoke License Verification",
                                message: `Revoke medical license verification for Dr. ${profile.firstName} ${profile.lastName}? They will need to be re-verified.`,
                                action: () =>
                                  revokeVerification(
                                    profile._id,
                                    "medical_license",
                                  ),
                              })
                            }
                            className="flex items-center space-x-1 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-150 font-medium disabled:opacity-50"
                            disabled={loading}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Revoke License</span>
                          </button>
                        )}
                        {profile.verificationStatus?.background_check ===
                          "verified" && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                type: "revoke",
                                title: "Revoke Background Check",
                                message: `Revoke background check for Dr. ${profile.firstName} ${profile.lastName}? They will need to be re-verified.`,
                                action: () =>
                                  revokeVerification(
                                    profile._id,
                                    "background_check",
                                  ),
                              })
                            }
                            className="flex items-center space-x-1 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-150 font-medium disabled:opacity-50"
                            disabled={loading}
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Revoke Background</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {approvedPagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <span className="text-sm text-gray-600">
                  Showing {approvedDoctors.length} of {approvedPagination.total}{" "}
                  verified doctors
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={approvedPagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {approvedPagination.page} of {approvedPagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={
                      approvedPagination.page === approvedPagination.pages
                    }
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No verified doctors yet
            </h3>
            <p className="text-gray-600">
              Verify doctors from the Verification Queue to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const RejectedUsersTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search rejected users..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => fetchRejectedUsers()}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 min-w-[110px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Rejected Users List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rejectedUsers.length > 0 ? (
          <>
            {rejectedUsers.map((profile) => (
              <div
                key={profile._id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-red-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full overflow-hidden flex-shrink-0">
                    {profile.profilePhoto?.url ? (
                      <img
                        src={profile.profilePhoto.url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-red-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          Dr. {profile.firstName} {profile.lastName}
                        </h4>
                        <p className="text-red-600 font-semibold text-lg">
                          {profile.primarySpecialty}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {profile.email}
                          </span>
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {profile.yearsOfExperience} years exp.
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          <span className="font-medium">License:</span>{" "}
                          {profile.medicalLicenseNumber} ({profile.licenseState}
                          )
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Has Rejections
                        </span>
                      </div>
                    </div>

                    {/* Verification Status Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          profile.verificationStatus?.identity === "verified"
                            ? "bg-green-50 border-green-200"
                            : profile.verificationStatus?.identity ===
                                "rejected"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">Identity</p>
                        <StatusBadge
                          status={
                            profile.verificationStatus?.identity || "pending"
                          }
                        />
                      </div>
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          profile.verificationStatus?.medical_license ===
                          "verified"
                            ? "bg-green-50 border-green-200"
                            : profile.verificationStatus?.medical_license ===
                                "rejected"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">
                          Medical License
                        </p>
                        <StatusBadge
                          status={
                            profile.verificationStatus?.medical_license ||
                            "pending"
                          }
                        />
                      </div>
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          profile.verificationStatus?.background_check ===
                          "verified"
                            ? "bg-green-50 border-green-200"
                            : profile.verificationStatus?.background_check ===
                                "rejected"
                              ? "bg-red-50 border-red-200"
                              : "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">Background</p>
                        <StatusBadge
                          status={
                            profile.verificationStatus?.background_check ||
                            "pending"
                          }
                        />
                      </div>
                    </div>

                    {/* Re-approve Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() => navigate(`/profile/${profile._id}`)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Profile</span>
                      </button>

                      <div className="flex space-x-2">
                        {profile.verificationStatus?.identity ===
                          "rejected" && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                type: "approve",
                                title: "Re-approve Identity",
                                message: `Re-approve identity verification for Dr. ${profile.firstName} ${profile.lastName}?`,
                                action: () =>
                                  verifyProfile(
                                    profile._id,
                                    "identity",
                                    "verified",
                                  ),
                              })
                            }
                            className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-150 font-medium disabled:opacity-50"
                            disabled={loading}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve Identity</span>
                          </button>
                        )}
                        {profile.verificationStatus?.medical_license ===
                          "rejected" && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                type: "approve",
                                title: "Re-approve License",
                                message: `Re-approve medical license for Dr. ${profile.firstName} ${profile.lastName}?`,
                                action: () =>
                                  verifyProfile(
                                    profile._id,
                                    "medical_license",
                                    "verified",
                                  ),
                              })
                            }
                            className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-150 font-medium disabled:opacity-50"
                            disabled={loading}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve License</span>
                          </button>
                        )}
                        {profile.verificationStatus?.background_check ===
                          "rejected" && (
                          <button
                            onClick={() =>
                              setShowConfirmModal({
                                type: "approve",
                                title: "Re-approve Background",
                                message: `Re-approve background check for Dr. ${profile.firstName} ${profile.lastName}?`,
                                action: () =>
                                  verifyProfile(
                                    profile._id,
                                    "background_check",
                                    "verified",
                                  ),
                              })
                            }
                            className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-150 font-medium disabled:opacity-50"
                            disabled={loading}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve Background</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {rejectedPagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <span className="text-sm text-gray-600">
                  Showing {rejectedUsers.length} of {rejectedPagination.total}{" "}
                  rejected users
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={rejectedPagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {rejectedPagination.page} of {rejectedPagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={
                      rejectedPagination.page === rejectedPagination.pages
                    }
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <XCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No rejected users
            </h3>
            <p className="text-gray-600">
              Users with rejected verifications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const StatsTab = () => (
    <div className="space-y-6">
      {verificationStats ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Verification Rate"
              value={`${verificationStats.overview?.verificationRate || 0}%`}
              icon={Award}
              color="green"
              trend="+3.2% vs last month"
            />
            <MetricCard
              title="Avg. Processing Time"
              value={verificationStats.averageVerificationTime || "N/A"}
              icon={Clock}
              color="blue"
              subtitle="Target: <3 days"
            />
            <MetricCard
              title="Fully Verified Users"
              value={verificationStats.overview?.verifiedUsers || 0}
              icon={CheckCircle}
              color="green"
              subtitle={`${
                verificationStats.overview?.partiallyVerified || 0
              } partial`}
            />
            <MetricCard
              title="Pending Queue"
              value={verificationStats.pending?.total || 0}
              icon={AlertTriangle}
              color="yellow"
              subtitle="Excludes rejected"
            />
          </div>

          {/* Verification Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Verification Status Distribution
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Fully Verified",
                    value: verificationStats.overview?.verifiedUsers || 0,
                    color: "green",
                  },
                  {
                    label: "Partially Verified",
                    value: verificationStats.overview?.partiallyVerified || 0,
                    color: "yellow",
                  },
                  {
                    label: "Unverified",
                    value: verificationStats.overview?.unverified || 0,
                    color: "red",
                  },
                ].map((item) => {
                  const total = verificationStats.overview?.totalUsers || 1;
                  const percentage = ((item.value / total) * 100).toFixed(1);

                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 bg-${item.color}-500 rounded`}
                          ></div>
                          <span className="text-gray-700 font-medium">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-gray-900 font-bold">
                          {item.value} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${item.color}-500 h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Pending Verification Queue
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Identity Verification",
                    value: verificationStats.pending?.identity || 0,
                    color: "yellow",
                    max: verificationStats.pending?.total || 1,
                  },
                  {
                    label: "Medical License",
                    value: verificationStats.pending?.medicalLicense || 0,
                    color: "orange",
                    max: verificationStats.pending?.total || 1,
                  },
                  {
                    label: "Background Check",
                    value: verificationStats.pending?.backgroundCheck || 0,
                    color: "red",
                    max: verificationStats.pending?.total || 1,
                  },
                ].map((item) => {
                  const percentage = ((item.value / item.max) * 100).toFixed(0);

                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-700 font-medium">
                          {item.label}
                        </span>
                        <span className="text-gray-900 font-bold">
                          {item.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`bg-${item.color}-500 h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-700 mb-2">
                  94.2%
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  Verification Accuracy
                </div>
                <div className="text-xs text-green-600 mt-1">
                  +1.2% from last month
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  1.8 days
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  Avg Response Time
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  -0.3 days improvement
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-700 mb-2">
                  98.5%
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  User Satisfaction
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on feedback
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-700 mb-2">
                  {verificationStats.recent?.newVerified || 0}
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  Verified This Week
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  +12% from last week
                </div>
              </div>
            </div>
          </div>

          {/* Top Specialties */}
          {verificationStats.specialties &&
            verificationStats.specialties.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Doctors by Specialty
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verificationStats.specialties
                    .slice(0, 8)
                    .map((specialty, index) => (
                      <div
                        key={specialty._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {specialty._id}
                          </span>
                        </div>
                        <span className="text-blue-600 font-bold">
                          {specialty.count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </>
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // JOB MANAGEMENT TAB
  // ============================================================================

  const JobManagementTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, category..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
                page: 1,
              }))
            }
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>

          {/* Per Page Filter */}
          <select
            value={filters.limit}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                limit: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 min-w-[130px]"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAllJobs()}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 min-w-[110px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedJobs.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
            <div className="flex items-center space-x-4">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">
                {selectedJobs.length} job
                {selectedJobs.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setShowConfirmModal({
                    type: "bulk-activate",
                    title: "Bulk Activate Jobs",
                    message: `Activate ${selectedJobs.length} job(s)?`,
                    action: () => handleBulkJobAction("active"),
                  })
                }
                className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Activate</span>
              </button>
              <button
                onClick={() =>
                  setShowConfirmModal({
                    type: "bulk-pause",
                    title: "Bulk Pause Jobs",
                    message: `Pause ${selectedJobs.length} job(s)?`,
                    action: () => handleBulkJobAction("paused"),
                  })
                }
                className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-lg border border-amber-200 hover:bg-amber-100 hover:border-amber-300 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={() =>
                  setShowConfirmModal({
                    type: "bulk-close",
                    title: "Bulk Close Jobs",
                    message: `Close ${selectedJobs.length} job(s)?`,
                    action: () => handleBulkJobAction("closed"),
                  })
                }
                className="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150 font-medium text-sm"
              >
                <Ban className="w-4 h-4" />
                <span>Close</span>
              </button>
              <button
                onClick={() => setSelectedJobs([])}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : allJobs.length > 0 ? (
          <>
            {/* Select All */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedJobs.length === allJobs.length && allJobs.length > 0
                  }
                  onChange={handleSelectAllJobs}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="font-medium text-gray-900">
                  Select All ({allJobs.length} jobs)
                </span>
              </label>
            </div>

            {allJobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJobs((prev) => [...prev, job._id]);
                      } else {
                        setSelectedJobs((prev) =>
                          prev.filter((id) => id !== job._id),
                        );
                      }
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {job.title}
                        </h4>
                        <p className="text-blue-600 font-semibold">
                          {job.category}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {job.posted_by?.firstName} {job.posted_by?.lastName}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />$
                            {job.budget?.amount || 0}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <StatusBadge status={job.status} />
                        {job.featured && (
                          <div className="mt-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {job.views_count || 0} views
                        </span>
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {job.applications_count || 0} applications
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setShowConfirmModal({
                              type: "approve-job",
                              title: "Approve Job",
                              message: `Approve and activate job: ${job.title}?`,
                              action: () => handleJobAction(job._id, "approve"),
                            })
                          }
                          className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() =>
                            setShowConfirmModal({
                              type: "reject-job",
                              title: "Reject Job",
                              message: `Reject and close job: ${job.title}?`,
                              action: () => handleJobAction(job._id, "reject"),
                            })
                          }
                          className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                          disabled={loading}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                        {!job.featured && (
                          <button
                            onClick={() => handleJobAction(job._id, "feature")}
                            className="flex items-center space-x-2 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 text-sm font-medium"
                            disabled={loading}
                          >
                            <Star className="w-4 h-4" />
                            <span>Feature</span>
                          </button>
                        )}
                        {job.featured && (
                          <button
                            onClick={() =>
                              handleJobAction(job._id, "unfeature")
                            }
                            className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm font-medium"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                            <span>Unfeature</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {jobsPagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(jobsPagination.page - 1) * filters.limit + 1} to{" "}
                  {Math.min(
                    jobsPagination.page * filters.limit,
                    jobsPagination.total,
                  )}{" "}
                  of {jobsPagination.total} jobs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={jobsPagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {jobsPagination.page} of {jobsPagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={jobsPagination.page === jobsPagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // APPLICATION MANAGEMENT TAB
  // ============================================================================

  const ApplicationManagementTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by applicant or job..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
                page: 1,
              }))
            }
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          {/* Per Page Filter */}
          <select
            value={filters.limit}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                limit: parseInt(e.target.value),
                page: 1,
              }))
            }
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 min-w-[130px]"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAllApplications()}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 min-w-[110px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : allApplications.length > 0 ? (
          <>
            {allApplications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {app.applicant_id?.firstName}{" "}
                          {app.applicant_id?.lastName}
                        </h4>
                        <p className="text-blue-600 font-medium">
                          Applied for: {app.job_id?.title || "Unknown Job"}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {app.applicant_id?.email}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                          {app.match_score && (
                            <span className="flex items-center">
                              <Award className="w-4 h-4 mr-1" />
                              Match: {app.match_score}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <StatusBadge status={app.status} />
                      </div>
                    </div>

                    {app.cover_letter && (
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          Job Category: {app.job_id?.category || "N/A"}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setShowConfirmModal({
                              type: "resolve-dispute-reinstate",
                              title: "Reinstate Application",
                              message: `Reinstate application from ${app.applicant_id?.firstName}?`,
                              action: () =>
                                handleResolveDispute(
                                  app._id,
                                  "reinstate",
                                  "Admin reinstated application",
                                ),
                            })
                          }
                          className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Reinstate</span>
                        </button>
                        <button
                          onClick={() =>
                            setShowConfirmModal({
                              type: "resolve-dispute-close",
                              title: "Close Application",
                              message: `Close application from ${app.applicant_id?.firstName}?`,
                              action: () =>
                                handleResolveDispute(
                                  app._id,
                                  "close",
                                  "Admin closed application",
                                ),
                            })
                          }
                          className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                          disabled={loading}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {applicationsPagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {(applicationsPagination.page - 1) * filters.limit + 1} to{" "}
                  {Math.min(
                    applicationsPagination.page * filters.limit,
                    applicationsPagination.total,
                  )}{" "}
                  of {applicationsPagination.total} applications
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={applicationsPagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {applicationsPagination.page} of{" "}
                    {applicationsPagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={
                      applicationsPagination.page ===
                      applicationsPagination.pages
                    }
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );

  const TabNavigation = () => {
    const tabs = [
      { id: "overview", label: "Overview", icon: BarChart3, count: null },
      {
        id: "pending",
        label: "Verification Queue",
        icon: Clock,
        count:
          pendingVerifications.length ||
          dashboardData?.metrics?.verification?.pending ||
          0,
      },
      {
        id: "approved",
        label: "Approved Doctors",
        icon: Award,
        count:
          approvedPagination.total ||
          dashboardData?.metrics?.verification?.verified ||
          0,
      },
      {
        id: "rejected",
        label: "Rejected Users",
        icon: XCircle,
        count: rejectedPagination.total || 0,
      },
      { id: "stats", label: "Analytics", icon: TrendingUp, count: null },
      { id: "jobs", label: "Job Management", icon: Briefcase, count: null },
      {
        id: "applications",
        label: "Applications",
        icon: FileText,
        count: null,
      },
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center space-x-2 px-6 py-4 whitespace-nowrap font-medium text-sm transition-all duration-300 ease-out focus:outline-none ${
                  isActive
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-[1.02]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isActive ? "" : "group-hover:scale-110"
                  }`}
                />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full transition-all duration-200 group-hover:scale-105">
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full transition-all duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3" />
          <div>
            <h3 className="font-bold text-lg">Access Denied</h3>
            <p>Admin privileges required to access this dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal !== null}
        onClose={() => setShowConfirmModal(null)}
        onConfirm={() => {
          if (showConfirmModal?.action) {
            showConfirmModal.action();
          }
        }}
        title={showConfirmModal?.title || ""}
        message={showConfirmModal?.message || ""}
        type={showConfirmModal?.type?.includes("reject") ? "danger" : "warning"}
      />

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center animate-slideIn">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-2 border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center animate-slideIn">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")} className="ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <Shield className="w-10 h-10 mr-3 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Comprehensive platform management and user verification system
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-blue-600">Administrator</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />

      <div className="min-h-96 animate-fadeInUp" key={activeTab}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "pending" && <PendingVerificationsTab />}
        {activeTab === "approved" && <ApprovedDoctorsTab />}
        {activeTab === "rejected" && <RejectedUsersTab />}
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "jobs" && <JobManagementTab />}
        {activeTab === "applications" && <ApplicationManagementTab />}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          {isConnected ? (
            <span className="text-green-600">🟢 Live Updates Active</span>
          ) : (
            <span className="text-yellow-600">🟡 Polling Mode</span>
          )}
          {" | "}
          Last updated:{" "}
          {lastFetch ? new Date(lastFetch).toLocaleTimeString() : "Loading..."}
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
