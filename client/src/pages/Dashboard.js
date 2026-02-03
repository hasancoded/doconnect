// client/src/pages/Dashboard.js - MVP Testing Version (Updated with Subscription Widget)
import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  profileAPI,
  jobAPI,
  applicationAPI,
  adminAPI,
  messageAPI,
  notificationAPI,
} from "../api";
import {
  User,
  Briefcase,
  FileText,
  Search,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Shield,
  ArrowRight,
  Loader,
  CreditCard,
  MessageSquare,
  Bell,
} from "lucide-react";

const Dashboard = () => {
  const {
    user,
    isJunior,
    isSenior,
    isAdmin,
    subscription,
    subscriptionLoading,
  } = useAuth();

  // Fetch recent conversations
  const { data: conversationsData } = useQuery({
    queryKey: ["conversations", "dashboard"],
    queryFn: () => messageAPI.getConversations({ limit: 3 }),
    enabled: !!user && !isAdmin(),
  });

  // Fetch unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationAPI.getUnreadCount(),
    enabled: !!user,
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileAPI.getMe(),
    enabled: !!user && !isAdmin(),
  });

  const profile = profileData?.data?.data || profileData?.data || user;

  const { data: myApplicationsData } = useQuery({
    queryKey: ["my-applications", "dashboard"],
    queryFn: () => applicationAPI.getMyApplications({ limit: 5 }),
    enabled: isJunior(),
  });

  const { data: jobRecommendationsData } = useQuery({
    queryKey: ["job-recommendations", "dashboard"],
    queryFn: () => jobAPI.getRecommendations({ limit: 5 }),
    enabled: isJunior(),
  });

  const { data: myJobsData } = useQuery({
    queryKey: ["my-jobs", "dashboard"],
    queryFn: () => jobAPI.getMyJobs({ limit: 5 }),
    enabled: isSenior(),
  });

  const { data: receivedApplicationsData } = useQuery({
    queryKey: ["received-applications", "dashboard"],
    queryFn: () => applicationAPI.getReceived({ limit: 5 }),
    enabled: isSenior(),
  });

  // Real-time admin metrics (same as AdminDashboard.js)
  const { socket: adminSocket, isConnected: adminSocketConnected } = isAdmin()
    ? require("../hooks/useAdminSocket").useAdminSocket()
    : { socket: null, isConnected: false };

  const { metrics: adminDashboardData } = isAdmin()
    ? require("../hooks/useRealtimeMetrics").useRealtimeMetrics(
        adminSocket,
        adminSocketConnected,
      )
    : { metrics: null };

  const { data: pendingVerificationsData } = useQuery({
    queryKey: ["pending-verifications", "dashboard"],
    queryFn: () => adminAPI.getPendingVerifications({ limit: 5 }),
    enabled: isAdmin(),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, Dr. {user.firstName}!
          </h2>
          <p className="text-gray-600">
            {isJunior() &&
              "Discover new opportunities to advance your medical career."}
            {isSenior() && "Manage your job postings and review applications."}
            {isAdmin() && "Oversee platform operations and user verifications."}
          </p>

          {!isAdmin() && profile?.profileCompletion && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Profile Completion
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {profile.profileCompletion.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${profile.profileCompletion.percentage}%`,
                    }}
                  />
                </div>
              </div>
              {profile.profileCompletion.percentage < 100 && (
                <Link to="/profile" className="btn-primary text-sm">
                  Complete Profile
                </Link>
              )}
            </div>
          )}
        </div>

        {/* SUBSCRIPTION STATUS WIDGET - Hidden for Admin */}
        {!isAdmin() && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Subscription Status
                </h3>
              </div>
            </div>

            {subscriptionLoading ? (
              <div className="mt-4 flex items-center justify-center py-6">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : subscription ? (
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Current Plan</p>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {subscription.planName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Renews:{" "}
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/subscription/status"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors text-center"
                  >
                    View Details
                  </Link>
                  <Link
                    to="/subscription/manage"
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors text-center"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-gray-600 mb-4">
                  You're currently on the free plan. Upgrade to unlock premium
                  features.
                </p>
                <Link
                  to="/subscription/plans"
                  className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  View Plans
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Role-Based Dashboard */}
        {isJunior() && (
          <JuniorDashboard
            user={user}
            profile={profile}
            myApplicationsData={myApplicationsData}
            jobRecommendationsData={jobRecommendationsData}
          />
        )}
        {isSenior() && (
          <SeniorDashboard
            user={user}
            profile={profile}
            myJobsData={myJobsData}
            receivedApplicationsData={receivedApplicationsData}
          />
        )}
        {isAdmin() && (
          <AdminDashboard
            adminDashboardData={adminDashboardData}
            pendingVerificationsData={pendingVerificationsData}
          />
        )}
      </main>
    </div>
  );
};

// ============================================================================
// JUNIOR DOCTOR DASHBOARD
// ============================================================================
const JuniorDashboard = ({
  user,
  profile,
  myApplicationsData,
  jobRecommendationsData,
}) => {
  const applications = myApplicationsData?.data?.data || [];
  const appsPagination = myApplicationsData?.data?.pagination || {};

  const stats = [
    {
      label: "Total Applications",
      value: appsPagination.total || 0,
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Pending",
      value: applications.filter(
        (a) => a.status === "submitted" || a.status === "under_review",
      ).length,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Accepted",
      value: applications.filter((a) => a.status === "accepted").length,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Profile Views",
      value: profile?.analytics?.views?.total || 0,
      icon: Eye,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const quickActions = [
    { label: "Browse Jobs", icon: Search, link: "/jobs", color: "bg-blue-600" },
    {
      label: "My Applications",
      icon: FileText,
      link: "/applications",
      color: "bg-purple-600",
    },
    {
      label: "Update Profile",
      icon: User,
      link: "/profile",
      color: "bg-emerald-600",
    },
    {
      label: "View Plans",
      icon: Users,
      link: "/subscription/plans",
      color: "bg-indigo-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              to={action.link}
              className={`${action.color} text-white rounded-xl p-6 hover:opacity-90 transition-opacity group`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-1">{action.label}</h3>
              <div className="flex items-center text-sm opacity-90">
                <span>Go now</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Applications
            </h3>
            <Link
              to="/applications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app._id}
                  to={`/applications`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {app.job_id?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.job_id?.specialty}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No applications yet</p>
              <Link to="/jobs" className="btn-primary text-sm">
                Browse Jobs
              </Link>
            </div>
          )}
        </div>

        {/* Job Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Recommended Jobs
            </h3>
            <Link
              to="/jobs"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {jobRecommendationsData?.data?.data?.length > 0 ? (
            <div className="space-y-3">
              {jobRecommendationsData.data.data.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                    {job.matchScore && (
                      <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        {job.matchScore}% match
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{job.specialty}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-blue-600">
                      ${job.budget?.amount?.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {job.timeline?.deadline &&
                        new Date(job.timeline.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recommendations available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SENIOR DOCTOR DASHBOARD
// ============================================================================
const SeniorDashboard = ({
  user,
  profile,
  myJobsData,
  receivedApplicationsData,
}) => {
  const jobs = myJobsData?.data?.data || [];
  const applications = receivedApplicationsData?.data?.data || [];
  const jobsPagination = myJobsData?.data?.pagination || {};
  const appsPagination = receivedApplicationsData?.data?.pagination || {};

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const pendingApps = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review",
  ).length;

  const stats = [
    {
      label: "Jobs Posted",
      value: jobsPagination.total || 0,
      icon: Briefcase,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Jobs",
      value: activeJobs,
      icon: TrendingUp,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Applications",
      value: appsPagination.total || 0,
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Pending Reviews",
      value: pendingApps,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  const quickActions = [
    {
      label: "Post New Job",
      icon: Plus,
      link: "/jobs/post",
      color: "bg-blue-600",
    },
    {
      label: "Manage Jobs",
      icon: Briefcase,
      link: "/jobs/manage",
      color: "bg-green-600",
    },
    {
      label: "Review Applications",
      icon: FileText,
      link: "/applications",
      color: "bg-purple-600",
    },
    {
      label: "View Plans",
      icon: Search,
      link: "/subscription/plans",
      color: "bg-indigo-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              to={action.link}
              className={`${action.color} text-white rounded-xl p-6 hover:opacity-90 transition-opacity group`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold text-lg mb-1">{action.label}</h3>
              <div className="flex items-center text-sm opacity-90">
                <span>Go now</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Jobs</h3>
            <Link
              to="/jobs/manage"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-gray-600">{job.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {job.applications_count || 0} applications
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No jobs posted yet</p>
              <Link to="/jobs/post" className="btn-primary text-sm">
                Post Your First Job
              </Link>
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Recent Applications
            </h3>
            <Link
              to="/applications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app._id}
                  to={`/applications`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Dr. {app.applicant_id?.firstName}{" "}
                        {app.applicant_id?.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.applicant_id?.primarySpecialty}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  {app.match_score && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        {app.match_score}% match
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
const AdminDashboard = ({ adminDashboardData, pendingVerificationsData }) => {
  const dashData = adminDashboardData || {};
  const pending = pendingVerificationsData?.data?.data || [];
  const pendingCount = pendingVerificationsData?.data?.pagination?.total || 0;

  const stats = [
    {
      label: "Total Users",
      value: dashData.metrics?.users?.total || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      subtitle: `${dashData.metrics?.users?.active || 0} active`,
    },
    {
      label: "Verified Users",
      value: dashData.metrics?.verification?.verified || 0,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Pending Verification",
      value: pendingCount,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
      urgent: pendingCount > 0,
    },
    {
      label: "Verification Rate",
      value: `${dashData.metrics?.verification?.rate || 0}%`,
      icon: Shield,
      color: "bg-purple-100 text-purple-600",
      subtitle: `${dashData.metrics?.verification?.verified || 0} verified`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                stat.urgent ? "border-red-300" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Verification Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Pending Verifications
          </h3>
          <Link
            to="/admin"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((userItem) => (
              <Link
                key={userItem._id}
                to="/admin"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Dr. {userItem.firstName} {userItem.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {userItem.primarySpecialty}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      {(() => {
                        const vs = userItem.verificationStatus || {};
                        if (vs.identity === "pending") return "ID Pending";
                        if (vs.medical_license === "pending")
                          return "License Pending";
                        if (vs.background_check === "pending")
                          return "Background Pending";
                        return "Pending";
                      })()}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No pending verifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================
const StatusBadge = ({ status }) => {
  const config = {
    submitted: {
      color: "bg-blue-50 text-blue-600 border-blue-200",
      label: "Submitted",
    },
    under_review: {
      color: "bg-purple-50 text-purple-700 border-purple-200",
      label: "Under Review",
    },
    accepted: {
      color: "bg-green-50 text-green-700 border-green-200",
      label: "Accepted",
    },
    rejected: {
      color: "bg-red-50 text-red-700 border-red-200",
      label: "Rejected",
    },
    active: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Active",
    },
    closed: {
      color: "bg-gray-50 text-gray-600 border-gray-200",
      label: "Closed",
    },
    completed: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Completed",
    },
  };

  const { color, label } = config[status] || {
    color: "bg-gray-50 text-gray-600 border-gray-200",
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-md border ${color}`}
    >
      {label}
    </span>
  );
};

export default Dashboard;
