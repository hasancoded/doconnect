// client/src/pages/DoctorSearch.js - Real API Integration
import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { profileAPI, messageAPI } from "../api";
import {
  Search,
  MapPin,
  Star,
  Briefcase,
  User,
  CheckCircle,
  Clock4,
  Grid,
  List,
  X,
  Globe,
  Shield,
  Eye,
  MessageCircle,
  Heart,
  Target,
  Loader,
  AlertCircle,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";

const DoctorSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    specialty: "",
    experience: "",
    rating: "",
    location: "",
    verified: false,
    sortBy: "relevance",
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 12;

  // Build search params
  const buildSearchParams = useCallback(() => {
    const params = {
      page,
      limit,
    };

    if (searchTerm) params.search = searchTerm;
    if (filters.specialty) params.specialty = filters.specialty;
    if (filters.experience) params.minExperience = filters.experience;
    if (filters.rating) params.minRating = filters.rating;
    if (filters.location) params.location = filters.location;
    if (filters.verified) params.verified = "true";
    if (filters.sortBy) params.sortBy = filters.sortBy;

    return params;
  }, [searchTerm, filters, page, limit]);

  // Fetch doctors from API
  const {
    data: doctorsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["doctors", "search", buildSearchParams()],
    queryFn: () => profileAPI.search(buildSearchParams()),
    enabled: true,
    keepPreviousData: true,
  });

  // Filter out admin users from the results
  const allDoctors = doctorsData?.data?.data || [];
  const doctors = allDoctors.filter((doctor) => doctor.role !== "admin");

  const pagination = doctorsData?.data?.pagination || {
    total: doctors.length,
    pages: Math.ceil(doctors.length / limit),
    page: 1,
  };

  // Specialty options
  const specialties = [
    "Anesthesiology",
    "Cardiology",
    "Dermatology",
    "Emergency Medicine",
    "Endocrinology",
    "Family Medicine",
    "Gastroenterology",
    "General Surgery",
    "Internal Medicine",
    "Neurology",
    "Obstetrics & Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Urology",
  ];

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "rating", label: "Highest Rated" },
    { value: "experience", label: "Most Experienced" },
    { value: "recent", label: "Recently Active" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      specialty: "",
      experience: "",
      rating: "",
      location: "",
      verified: false,
      sortBy: "relevance",
    });
    setSearchTerm("");
    setPage(1);
  };

  // Handle message button click
  const handleMessageClick = async (doctorId) => {
    try {
      const response = await messageAPI.createConversation(doctorId);
      const conversationId = response.data?.data?._id;
      if (conversationId) {
        navigate(`/messages?conversationId=${conversationId}`);
      } else {
        navigate("/messages");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  // Doctor Card Component
  const DoctorCard = ({ doctor }) => {
    const [isSaved, setIsSaved] = useState(false);
    const isOnline = new Date() - new Date(doctor.lastActive) < 60 * 60 * 1000;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              {doctor.profilePhoto?.url ? (
                <img
                  src={doctor.profilePhoto.url}
                  alt={doctor.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </div>
            {doctor.verificationStatus?.overall === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            )}
            {isOnline && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg truncate">
                  {doctor.displayName ||
                    `Dr. ${doctor.firstName} ${doctor.lastName}`}
                </h3>
                <p className="text-blue-600 font-medium">
                  {doctor.primarySpecialty}
                </p>
              </div>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                  isSaved
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              </button>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {doctor.location?.city}, {doctor.location?.state}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {doctor.rating?.average > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium text-sm">
                  {doctor.rating.average.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  ({doctor.rating.count})
                </span>
              </div>
            )}
            <div className="flex items-center text-gray-600 text-sm">
              <Briefcase className="w-4 h-4 mr-1" />
              <span>{doctor.yearsOfExperience || 0}yr</span>
            </div>
          </div>
          {doctor.availability?.responseTime && (
            <div className="flex items-center text-green-600 text-sm">
              <Clock4 className="w-3 h-3 mr-1" />
              <span className="capitalize">
                {doctor.availability.responseTime.replace("-", " ")}
              </span>
            </div>
          )}
        </div>

        {doctor.subspecialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doctor.subspecialties.slice(0, 2).map((subspecialty, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
              >
                {subspecialty}
              </span>
            ))}
            {doctor.subspecialties.length > 2 && (
              <span className="text-gray-500 text-xs py-1">
                +{doctor.subspecialties.length - 2} more
              </span>
            )}
          </div>
        )}

        {doctor.languages?.length > 0 && (
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {doctor.languages.map((l) => l.language).join(", ")}
            </span>
          </div>
        )}

        {doctor.bio && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {doctor.bio.substring(0, 120)}
            {doctor.bio.length > 120 && "..."}
          </p>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-3">
            {doctor.verificationStatus?.overall === "verified" && (
              <div className="flex items-center text-green-600">
                <Shield className="w-3 h-3 mr-1" />
                <span>Verified</span>
              </div>
            )}
            {doctor.profileCompletion?.percentage >= 90 && (
              <div className="flex items-center text-blue-600">
                <Target className="w-3 h-3 mr-1" />
                <span>{doctor.profileCompletion.percentage}%</span>
              </div>
            )}
          </div>
          <div className="flex items-center text-gray-500">
            <Eye className="w-3 h-3 mr-1" />
            <span>{doctor.analytics?.views?.thisMonth || 0}</span>
          </div>
        </div>

        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <Link
            to={`/profile/${doctor._id}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
          >
            View Profile
          </Link>
          {user && (
            <button
              onClick={() => handleMessageClick(doctor._id)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Send Message"
            >
              <MessageCircle className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // List View Component
  const DoctorListItem = ({ doctor }) => {
    const [isSaved, setIsSaved] = useState(false);
    const isOnline = new Date() - new Date(doctor.lastActive) < 60 * 60 * 1000;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
              {doctor.profilePhoto?.url ? (
                <img
                  src={doctor.profilePhoto.url}
                  alt={doctor.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
            {doctor.verificationStatus?.overall === "verified" && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
            {isOnline && (
              <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-xl">
                    {doctor.displayName ||
                      `Dr. ${doctor.firstName} ${doctor.lastName}`}
                  </h3>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`p-1 rounded-full transition-colors ${
                      isSaved
                        ? "text-red-500"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
                    />
                  </button>
                </div>
                <p className="text-blue-600 font-medium text-lg">
                  {doctor.primarySpecialty}
                </p>
              </div>

              {doctor.rating?.average > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-medium text-lg">
                    {doctor.rating.average.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({doctor.rating.count} reviews)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-gray-600 mb-3">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>
                  {doctor.location?.city}, {doctor.location?.state}
                </span>
              </div>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                <span>{doctor.yearsOfExperience || 0} years experience</span>
              </div>
              {doctor.availability?.responseTime && (
                <div className="flex items-center text-green-600">
                  <Clock4 className="w-4 h-4 mr-1" />
                  <span className="capitalize">
                    {doctor.availability.responseTime.replace("-", " ")}
                  </span>
                </div>
              )}
            </div>

            {doctor.bio && (
              <p className="text-gray-700 mb-4 line-clamp-2">
                {doctor.bio.substring(0, 200)}
                {doctor.bio.length > 200 && "..."}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {doctor.subspecialties?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {doctor.subspecialties
                      .slice(0, 3)
                      .map((subspecialty, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {subspecialty}
                        </span>
                      ))}
                    {doctor.subspecialties.length > 3 && (
                      <span className="text-gray-500 text-sm">
                        +{doctor.subspecialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {doctor.languages?.length > 0 && (
                  <div className="flex items-center text-gray-600 text-sm">
                    <Globe className="w-4 h-4 mr-1" />
                    <span>
                      {doctor.languages
                        .map((l) => l.language)
                        .slice(0, 2)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm">
                {doctor.verificationStatus?.overall === "verified" && (
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-1" />
                    <span>Verified</span>
                  </div>
                )}
                <div className="flex items-center text-gray-500">
                  <Eye className="w-4 h-4 mr-1" />
                  <span>{doctor.analytics?.views?.thisMonth || 0} views</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 flex-shrink-0">
            <Link
              to={`/profile/${doctor._id}`}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
            >
              View Profile
            </Link>
            {user && (
              <button
                onClick={() => handleMessageClick(doctor._id)}
                className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                title="Send Message"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Find Doctors</h1>
          <p className="text-gray-600 mt-2">
            Search and connect with verified medical professionals
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialty
                  </label>
                  <select
                    value={filters.specialty}
                    onChange={(e) =>
                      handleFilterChange("specialty", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. Experience
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) =>
                      handleFilterChange("experience", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="5">5+ years</option>
                    <option value="10">10+ years</option>
                    <option value="15">15+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min. Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) =>
                      handleFilterChange("rating", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) =>
                        handleFilterChange("verified", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Verified Only
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            {isLoading ? (
              <span>Searching...</span>
            ) : (
              <span>
                Found <strong>{pagination.total}</strong> doctor
                {pagination.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Doctors
            </h3>
            <p className="text-red-700">
              {error?.response?.data?.message || "Please try again later"}
            </p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No doctors found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {doctors.map((doctor) =>
                viewMode === "grid" ? (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ) : (
                  <DoctorListItem key={doctor._id} doctor={doctor} />
                )
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DoctorSearch;
