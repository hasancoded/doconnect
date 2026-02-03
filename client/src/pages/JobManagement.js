// JobManagement.js - Enhanced Dashboard with Debouncing and Auto-Refresh
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { jobAPI, handleApiError } from "../api";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Pause,
  Play,
  Trash2,
  Eye,
  Users,
  FileText,
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Briefcase,
  MoreVertical,
} from "lucide-react";

const JobManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isSenior } = useAuth();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [filters, setFilters] = useState({
    status: "all",
    category: "",
    sortBy: "createdAt",
    page: 1,
    limit: 10,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch filtered jobs
  const {
    data: jobsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-jobs", filters, debouncedSearch],
    queryFn: async () => {
      const params = { ...filters };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.status === "all") delete params.status;
      return jobAPI.getMyJobs(params);
    },
    keepPreviousData: true,
  });

  // Fetch all jobs for stats (regardless of filters)
  const { data: allJobsData } = useQuery({
    queryKey: ["my-jobs-stats"],
    queryFn: async () => {
      return jobAPI.getMyJobs({ status: "all" });
    },
    keepPreviousData: true,
  });

  const jobs = jobsData?.data?.data || [];
  const allJobs = allJobsData?.data?.data || [];
  const pagination = jobsData?.data?.pagination || { total: 0, pages: 0 };

  // Auto-refresh polling for real-time updates
  useEffect(() => {
    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };

    // Poll every 60 seconds when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    }, 60000); // 60 seconds

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);

  // Stats calculation from ALL jobs (not filtered)
  const stats = {
    total: allJobs.length,
    active: allJobs.filter((j) => j.status === "active").length,
    paused: allJobs.filter((j) => j.status === "paused").length,
    draft: allJobs.filter((j) => j.status === "draft").length,
    closed: allJobs.filter((j) => j.status === "closed").length,
    totalApplications: allJobs.reduce(
      (sum, j) => sum + (j.applications_count || 0),
      0
    ),
    totalViews: allJobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
  };

  // Mutations
  const pauseMutation = useMutation({
    mutationFn: (jobId) => jobAPI.pause(jobId),
    onSuccess: () => {
      toast.success("Job paused");
      queryClient.invalidateQueries(["my-jobs"]);
    },
    onError: (error) => toast.error(handleApiError(error).message),
  });

  const activateMutation = useMutation({
    mutationFn: (jobId) => jobAPI.activate(jobId),
    onSuccess: () => {
      toast.success("Job activated");
      queryClient.invalidateQueries(["my-jobs"]);
    },
    onError: (error) => toast.error(handleApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId) => jobAPI.delete(jobId),
    onSuccess: () => {
      toast.success("Job deleted");
      queryClient.invalidateQueries(["my-jobs"]);
      setDeleteConfirm(null);
    },
    onError: (error) => toast.error(handleApiError(error).message),
  });

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSelectAll = (checked) => {
    setSelectedJobs(checked ? jobs.map((j) => j._id) : []);
  };

  const handleSelectJob = (jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedJobs.length === 0) {
      toast.error("No jobs selected");
      return;
    }

    try {
      const promises = selectedJobs.map((jobId) => {
        switch (action) {
          case "pause":
            return jobAPI.pause(jobId);
          case "activate":
            return jobAPI.activate(jobId);
          case "delete":
            if (!window.confirm(`Delete ${selectedJobs.length} job(s)?`)) {
              throw new Error("Cancelled");
            }
            return jobAPI.delete(jobId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${selectedJobs.length} job(s) ${action}d`);
      setSelectedJobs([]);
      queryClient.invalidateQueries(["my-jobs"]);
    } catch (error) {
      if (error.message !== "Cancelled") {
        toast.error("Bulk operation failed");
      }
    }
  };

  const exportToCSV = () => {
    if (jobs.length === 0) {
      toast.error("No jobs to export");
      return;
    }

    try {
      const headers = [
        "Title",
        "Status",
        "Category",
        "Budget",
        "Applications",
        "Views",
        "Created",
      ];
      const rows = jobs.map((job) => [
        job.title,
        job.status,
        job.category,
        formatBudget(job),
        job.applications_count || 0,
        job.views_count || 0,
        new Date(job.createdAt).toLocaleDateString(),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Exported to CSV");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export CSV");
    }
  };

  // Helpers
  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      closed: "bg-gray-100 text-gray-800",
      draft: "bg-blue-100 text-blue-800",
    };
    return colors[status] || colors.draft;
  };

  const formatBudget = (job) => {
    if (!job.budget) return "Negotiable";
    if (job.budget.type === "negotiable") return "Negotiable";
    if (job.budget.type === "hourly") return `$${job.budget.amount}/hr`;
    return `$${job.budget.amount?.toLocaleString()}`;
  };

  const isExpiringSoon = (deadline) => {
    const days = Math.ceil(
      (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days <= 7 && days > 0;
  };

  if (!isSenior()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Only senior doctors can access job management
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border p-6 animate-pulse"
              >
                <div className="h-12 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 text-center mb-2">
              Error Loading Jobs
            </h3>
            <p className="text-red-700 text-center mb-4">
              {handleApiError(error).message}
            </p>
            <button
              onClick={() => refetch()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-1">Manage your job postings</p>
          </div>
          <Link
            to="/jobs/post"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.total}
              </span>
            </div>
            <p className="text-sm text-gray-600">Total Jobs</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.active} active • {stats.paused} paused
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">
                {stats.active}
              </span>
            </div>
            <p className="text-sm text-gray-600">Active Jobs</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total > 0
                ? Math.round((stats.active / stats.total) * 100)
                : 0}
              % of total
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {stats.totalApplications}
              </span>
            </div>
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-xs text-gray-500 mt-1">
              Avg:{" "}
              {stats.total > 0
                ? Math.round(stats.totalApplications / stats.total)
                : 0}{" "}
              per job
            </p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {stats.totalViews}
              </span>
            </div>
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-xs text-gray-500 mt-1">
              Avg:{" "}
              {stats.total > 0 ? Math.round(stats.totalViews / stats.total) : 0}{" "}
              per job
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border mb-6">
          <div className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                  showFilters
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={exportToCSV}
                disabled={jobs.length === 0}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-t">
            <div className="flex overflow-x-auto p-2">
              {[
                { id: "all", label: "All Jobs", count: stats.total },
                { id: "active", label: "Active", count: stats.active },
                { id: "paused", label: "Paused", count: stats.paused },
                {
                  id: "draft",
                  label: "Drafts",
                  count: stats.draft,
                },
                { id: "closed", label: "Closed", count: stats.closed },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterChange("status", tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all rounded-lg mx-1 whitespace-nowrap ${
                    filters.status === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      filters.status === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="border-t p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">All Categories</option>
                  <option value="consultation">Consultation</option>
                  <option value="research">Research</option>
                  <option value="documentation">Documentation</option>
                  <option value="review">Review</option>
                  <option value="telemedicine">Telemedicine</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="-createdAt">Most Recent</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="-applications_count">Most Applications</option>
                  <option value="-views_count">Most Views</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedJobs.length === jobs.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-medium text-blue-900">
                  {selectedJobs.length} job(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkAction("pause")}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  Pause
                </button>
                <button
                  onClick={() => handleBulkAction("activate")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedJobs([])}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Jobs Found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filters.status !== "all"
                ? "Try adjusting your filters"
                : "Create your first job posting"}
            </p>
            <Link
              to="/jobs/post"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Post Your First Job
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white rounded-lg border hover:border-blue-500 transition-all"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job._id)}
                        onChange={() => handleSelectJob(job._id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Link
                              to={`/jobs/${job._id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 block mb-1"
                            >
                              {job.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <span className="capitalize">{job.category}</span>
                              <span>•</span>
                              <span>{job.specialty}</span>
                              <span>•</span>
                              <span>
                                {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                job.status
                              )}`}
                            >
                              {job.status}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown === job._id ? null : job._id
                                  )
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-500" />
                              </button>

                              {activeDropdown === job._id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActiveDropdown(null)}
                                  />
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                                    <Link
                                      to={`/jobs/${job._id}`}
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 first:rounded-t-lg"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </Link>
                                    <Link
                                      to={`/jobs/${job._id}/edit`}
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Job
                                    </Link>
                                    <Link
                                      to={`/applications?jobId=${job._id}`}
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Applications (
                                      {job.applications_count || 0})
                                    </Link>
                                    <div className="border-t" />
                                    {job.status === "active" ? (
                                      <button
                                        onClick={() => {
                                          pauseMutation.mutate(job._id);
                                          setActiveDropdown(null);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-yellow-700 w-full text-left"
                                      >
                                        <Pause className="w-4 h-4" />
                                        Pause Job
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          activateMutation.mutate(job._id);
                                          setActiveDropdown(null);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-green-700 w-full text-left"
                                      >
                                        <Play className="w-4 h-4" />
                                        Activate Job
                                      </button>
                                    )}
                                    {job.status !== "closed" && (
                                      <button
                                        onClick={() => {
                                          setDeleteConfirm(job._id);
                                          setActiveDropdown(null);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-700 w-full text-left last:rounded-b-lg"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Job
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-4">
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span className="font-medium">
                                {job.applications_count || 0}
                              </span>
                              <span className="hidden sm:inline">
                                applications
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Eye className="w-4 h-4" />
                              <span className="font-medium">
                                {job.views_count || 0}
                              </span>
                              <span className="hidden sm:inline">views</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium text-green-600">
                                {formatBudget(job)}
                              </span>
                            </div>
                            {job.timeline?.deadline && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">
                                  {new Date(
                                    job.timeline.deadline
                                  ).toLocaleDateString()}
                                </span>
                                {isExpiringSoon(job.timeline.deadline) && (
                                  <span className="text-orange-600 text-xs">
                                    (Soon)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Link
                            to={`/applications?jobId=${job._id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            Applications ({job.applications_count || 0})
                          </Link>
                          <Link
                            to={`/jobs/${job._id}`}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-600">
                  Page {filters.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleFilterChange("page", Math.max(1, filters.page - 1))
                    }
                    disabled={filters.page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      handleFilterChange(
                        "page",
                        Math.min(pagination.pages, filters.page + 1)
                      )
                    }
                    disabled={filters.page === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
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

export default JobManagement;
