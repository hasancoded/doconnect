// client/src/pages/PublicProfile.js
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { profileAPI, messageAPI, handleApiError } from "../api";
import OnlineStatus from "../components/common/OnlineStatus";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  MapPin,
  Briefcase,
  Award,
  Star,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";

const PublicProfile = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch public profile
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", "public", identifier],
    queryFn: () => profileAPI.getPublicProfile(identifier),
    enabled: !!identifier,
  });

  const profile = profileData?.data?.data;

  // Handle send message
  const handleSendMessage = async () => {
    if (!profile?._id) return;

    try {
      setSendingMessage(true);
      const response = await messageAPI.createConversation(profile._id);
      const conversation = response.data.data;
      navigate(`/messages?conversationId=${conversation._id}`);
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message || "Failed to start conversation");
      setSendingMessage(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error.response?.data?.message ||
              "This profile could not be found or is private."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary px-6 py-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No profile data available</p>
        </div>
      </div>
    );
  }

  // Check if viewing own profile
  const isOwnProfile = user?._id === profile._id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </button>

          {/* Profile Header Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                  {profile.profilePhoto?.url ? (
                    <img
                      src={profile.profilePhoto.url}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl font-bold">
                      {profile.firstName?.[0]}
                      {profile.lastName?.[0]}
                    </div>
                  )}
                </div>
                {/* Online Status Badge */}
                <div className="absolute bottom-2 right-2">
                  <OnlineStatus
                    status={profile.onlineStatus}
                    size="lg"
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    Dr. {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.verificationStatus?.overall === "verified" && (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                </div>
                <p className="text-xl text-blue-100 mb-3">
                  {profile.primarySpecialty}
                </p>
                
                {/* Subspecialties */}
                {profile.subspecialties && profile.subspecialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.subspecialties.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-500/30 text-blue-50 rounded-full text-sm font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-blue-200">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {profile.yearsOfExperience} years experience
                  </span>
                  {profile.location?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location.city}, {profile.location.state}
                    </span>
                  )}
                  {profile.rating?.average > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {profile.rating.average.toFixed(1)} (
                      {profile.rating.count} reviews)
                    </span>
                  )}
                  {profile.job_statistics?.projects_completed > 0 && (
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {profile.job_statistics.projects_completed} projects completed
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              )}

              {isOwnProfile && (
                <Link
                  to="/profile"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              {profile.bio ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-gray-500 italic text-center py-4">
                  No bio added yet
                </p>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Education
              </h2>
              {profile.medicalSchool?.name ? (
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {profile.medicalSchool.name}
                  </h3>
                  <p className="text-gray-600">Doctor of Medicine (MD)</p>
                  {profile.medicalSchool.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {profile.medicalSchool.location}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Graduated {profile.medicalSchool.graduationYear}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">
                  No education information added yet
                </p>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Professional Experience
              </h2>
              {profile.experiences && profile.experiences.length > 0 ? (
                <div className="space-y-6">
                  {profile.experiences.map((exp, index) => (
                    <div
                      key={exp._id || index}
                      className="border-l-4 border-blue-600 pl-4 relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white"></div>
                      
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {exp.title}
                          </h3>
                          <p className="text-gray-600 font-medium">{exp.institution}</p>
                        </div>
                        {exp.current && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exp.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          -{" "}
                          {exp.current
                            ? "Present"
                            : new Date(exp.endDate).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                        </span>
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exp.location}
                          </span>
                        )}
                        {exp.type && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">
                            {exp.type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      
                      {exp.description && (
                        <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">
                  No professional experience added yet
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="space-y-4">
                  {/* Group skills by category */}
                  {["clinical", "research", "administrative", "technical", "other"].map((category) => {
                    const categorySkills = profile.skills.filter(
                      (skill) => skill.category === category
                    );
                    if (categorySkills.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill, index) => (
                            <span
                              key={skill._id || index}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 flex items-center gap-2"
                            >
                              {skill.name}
                              {skill.proficiencyLevel && (
                                <span className="text-xs text-blue-500 capitalize">
                                  • {skill.proficiencyLevel}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">
                  No skills added yet
                </p>
              )}
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Certifications & Licenses
              </h2>
              {profile.certifications && profile.certifications.length > 0 ? (
                <div className="space-y-4">
                  {profile.certifications.map((cert, index) => (
                    <div
                      key={cert._id || index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <Award className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {cert.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {cert.issuingOrganization}
                            </p>
                          </div>
                          {cert.verified && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                          </span>
                          {cert.expirationDate && (
                            <span>
                              Expires: {new Date(cert.expirationDate).toLocaleDateString()}
                            </span>
                          )}
                          {cert.credentialId && (
                            <span>ID: {cert.credentialId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">
                  No certifications added yet
                </p>
              )}
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" />
                Languages
              </h2>
              {profile.languages && profile.languages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {profile.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">
                        {lang.language}
                      </span>
                      <span className="text-sm text-gray-600 capitalize">
                        {lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">
                  No languages added yet
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Professional Stats */}
            {profile.job_statistics && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Professional Stats
                </h3>
                <div className="space-y-4">
                  {profile.job_statistics.projects_completed > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Projects Completed</span>
                        <span className="font-bold text-gray-900 text-lg">
                          {profile.job_statistics.projects_completed}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {profile.job_statistics.success_rate > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-bold text-green-600 text-lg">
                          {profile.job_statistics.success_rate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${profile.job_statistics.success_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {profile.job_statistics.response_time_hours != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Avg Response Time
                      </span>
                      <span className="font-semibold text-gray-900">
                        {profile.job_statistics.response_time_hours < 1
                          ? `${Math.round(profile.job_statistics.response_time_hours * 60)}min`
                          : profile.job_statistics.response_time_hours < 24
                          ? `${Math.round(profile.job_statistics.response_time_hours)}h`
                          : `${Math.round(profile.job_statistics.response_time_hours / 24)}d`}
                      </span>
                    </div>
                  )}

                  {profile.role === "junior" && profile.job_statistics.total_earnings > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Total Earnings
                      </span>
                      <span className="font-bold text-gray-900">
                        ${profile.job_statistics.total_earnings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Empty state if no stats */}
                  {!profile.job_statistics.projects_completed &&
                    !profile.job_statistics.success_rate &&
                    !profile.job_statistics.response_time_hours &&
                    !(profile.role === "junior" && profile.job_statistics.total_earnings > 0) && (
                      <p className="text-gray-500 italic text-center py-2">
                        No statistics available yet
                      </p>
                    )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {(profile.privacy?.showEmail || profile.privacy?.showPhone) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {profile.privacy?.showEmail && profile.email && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                  )}
                  {profile.privacy?.showPhone && profile.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Verification Status
              </h3>
              <div className="space-y-2">
                {[
                  "overall",
                  "identity",
                  "medical_license",
                  "background_check",
                ].map((type) => {
                  const status =
                    profile.verificationStatus?.[type] || "pending";
                  const colors = {
                    verified: "bg-green-100 text-green-800 border-green-200",
                    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    rejected: "bg-red-100 text-red-800 border-red-200",
                  };

                  return (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600 capitalize">
                        {type.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Profile Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Profile Views</span>
                  <span className="font-semibold text-gray-900">
                    {profile.analytics?.views?.total || profile.profileViews?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {profile.lastActive && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Active</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(profile.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
