// JobBrowse.js - Enhanced MVP with Saved Searches
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { jobAPI, applicationAPI, handleApiError } from "../api";
import {
  Search,
  Filter,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Bookmark,
  BookmarkCheck,
  Star,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";

const DEBOUNCE_DELAY = 500;

const JobBrowse = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isJunior, isSenior } = useAuth();

  // State
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Filters
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    specialty: searchParams.get("specialty") || "",
    experience_level: searchParams.get("experience") || "",
    budget_min: searchParams.get("budgetMin") || "",
    budget_max: searchParams.get("budgetMax") || "",
    remote_only: searchParams.get("remote") === "true",
    sortBy: searchParams.get("sortBy") || "recent",
  });

  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const limit = 12;

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState(() => {
    const saved = localStorage.getItem("savedSearches");
    return saved ? JSON.parse(saved) : [];
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchTerm),
      DEBOUNCE_DELAY
    );
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params, { replace: true });
  }, [searchTerm, filters, page, setSearchParams]);

  // Fetch jobs
  const {
    data: jobsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jobs-browse", debouncedSearch, filters, page],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy: filters.sortBy,
        ...(filters.category && { category: filters.category }),
        ...(filters.specialty && { specialty: filters.specialty }),
        ...(filters.experience_level && {
          experience_level: filters.experience_level,
        }),
        ...(filters.budget_min && {
          budget_min: parseFloat(filters.budget_min),
        }),
        ...(filters.budget_max && {
          budget_max: parseFloat(filters.budget_max),
        }),
        ...(filters.remote_only && { remote_only: true }),
      };

      if (debouncedSearch.trim()) {
        return await jobAPI.search({ q: debouncedSearch, ...params });
      }
      return await jobAPI.browse(params);
    },
    keepPreviousData: true,
    onError: (error) => {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    },
  });

  const jobs = jobsData?.data?.data || [];
  const pagination = jobsData?.data?.pagination || { total: 0, pages: 0 };

  // Fetch user's applications to show "Already Applied" badges
  const { data: userApplicationsData } = useQuery({
    queryKey: ["user-applications-list", user?.id],
    queryFn: async () => {
      try {
        const response = await applicationAPI.getMyApplications({});
        const applications = response?.data?.data || [];
        // Filter out withdrawn applications so they don't show as "Applied"
        const activeApplications = applications.filter(
          (app) => app.status !== "withdrawn"
        );
        return activeApplications;
      } catch (error) {
        return [];
      }
    },
    enabled: isAuthenticated && isJunior() && !!user?.id,
    retry: 1,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
  });

  const userApplications = userApplicationsData || [];
  const appliedJobIds = new Set(
    userApplications.map((app) => app.job_id?._id || app.job_id)
  );

  // Saved search functions
  const saveCurrentSearch = () => {
    const searchName = prompt("Enter a name for this search:");
    if (!searchName) return;

    const searchConfig = {
      id: Date.now(),
      name: searchName,
      filters: { ...filters },
      searchTerm: searchTerm,
      timestamp: Date.now(),
    };

    const updated = [...savedSearches, searchConfig];
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
    toast.success("Search saved successfully!");
  };

  const loadSavedSearch = (searchConfig) => {
    setSearchTerm(searchConfig.searchTerm || "");
    setFilters(searchConfig.filters);
    setPage(1);
  };

  const deleteSavedSearch = (searchId) => {
    const updated = savedSearches.filter((s) => s.id !== searchId);
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
    toast.success("Saved search removed");
  };

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      category: "",
      specialty: "",
      experience_level: "",
      budget_min: "",
      budget_max: "",
      remote_only: false,
      sortBy: "recent",
    });
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Status color helper
  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.active;
  };

  // Budget formatter
  const formatBudget = (job) => {
    if (!job.budget) return "Negotiable";
    if (job.budget.type === "negotiable") return "Negotiable";
    if (job.budget.type === "hourly") return `$${job.budget.amount}/hr`;
    return `$${job.budget.amount?.toLocaleString()}`;
  };

  // Loading State
  if (isLoading && !jobsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <X className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">
                Error Loading Jobs
              </h3>
            </div>
            <p className="text-red-700 mb-4">{handleApiError(error).message}</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4" />
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
            <h1 className="text-3xl font-bold text-gray-900">
              Medical Opportunities
            </h1>
            <p className="text-gray-600 mt-1">
              {pagination.total} jobs available
            </p>
          </div>
          {isAuthenticated && isSenior() && (
            <Link
              to="/jobs/post"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Post Job
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border p-4 mb-6">
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
              onClick={saveCurrentSearch}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              title="Save current search"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Saved searches:</span>
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <button
                    onClick={() => loadSavedSearch(search)}
                    className="hover:text-blue-600"
                  >
                    {search.name}
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(search.id)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t mt-4 pt-4">
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
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

                <input
                  type="text"
                  placeholder="Specialty"
                  value={filters.specialty}
                  onChange={(e) =>
                    handleFilterChange("specialty", e.target.value)
                  }
                  className="px-3 py-2 border rounded-lg"
                />

                <select
                  value={filters.experience_level}
                  onChange={(e) =>
                    handleFilterChange("experience_level", e.target.value)
                  }
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Any Experience</option>
                  <option value="resident">Resident</option>
                  <option value="junior">Junior (0-3 years)</option>
                  <option value="mid-level">Mid-Level (3-7 years)</option>
                  <option value="senior">Senior (7+ years)</option>
                </select>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min $"
                    value={filters.budget_min}
                    onChange={(e) =>
                      handleFilterChange("budget_min", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Max $"
                    value={filters.budget_max}
                    onChange={(e) =>
                      handleFilterChange("budget_max", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="recent">Most Recent</option>
                  <option value="budget_high">Highest Budget</option>
                  <option value="budget_low">Lowest Budget</option>
                  <option value="deadline">Deadline Soon</option>
                </select>
              </div>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.remote_only}
                    onChange={(e) =>
                      handleFilterChange("remote_only", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Remote only</span>
                </label>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Jobs Found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white rounded-lg border hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleJobClick(job._id)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {job.category} • {job.specialty}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                        {appliedJobIds.has(job._id) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Applied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-green-600">
                          {formatBudget(job)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="capitalize">{job.budget?.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="capitalize">
                          {job.requirements?.location_preference || "Remote"}
                        </span>
                      </div>
                      {job.timeline?.deadline && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Due:{" "}
                            {new Date(
                              job.timeline.deadline
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applications_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {job.views_count || 0}
                        </span>
                      </div>
                      {job.posted_by?.verificationStatus?.overall ===
                        "verified" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-600">
                  Page {page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setPage((p) => Math.min(pagination.pages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={page === pagination.pages}
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
    </div>
  );
};

export default JobBrowse;
