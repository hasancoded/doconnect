import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationBell from "./components/notifications/NotificationBell";
import Logo from "./components/Logo";
import {
  MessageSquare,
  LayoutDashboard,
  User,
  Search,
  Briefcase,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Newspaper,
  Calendar,
} from "lucide-react";

// Import existing pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EnhancedProfile from "./pages/EnhancedProfile";
import DoctorSearch from "./pages/DoctorSearch";
import AdminDashboard from "./pages/AdminDashboard";
import JobPosting from "./pages/JobPosting";
import JobManagement from "./pages/JobManagement";
import JobBrowse from "./pages/JobBrowse";
import JobDetails from "./pages/JobDetails";
import ApplicationSubmission from "./pages/ApplicationSubmission";
import ApplicationTracking from "./pages/ApplicationTracking";

// Import messaging and notification pages
import MessagesPage from "./pages/MessagesPage";
import AppointmentsList from "./pages/AppointmentsList";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationPreferences from "./pages/NotificationPreferences";
import PublicProfile from "./pages/PublicProfile";

// Import subscription pages
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionStatus from "./pages/SubscriptionStatus";
import ManageSubscription from "./pages/ManageSubscription";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import MedicalNews from "./pages/MedicalNews";

// ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-slate-600 mb-4">{this.state.error?.message}</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loader component
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-50"></div>
  </div>
);

// Desktop Sidebar Component - Collapsible with icon-only mode
const DesktopSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { isJunior, isSenior, isAdmin } = useAuth();
  const location = useLocation();

  // Icons imported at top of file

  const getNavigationItems = () => {
    const baseItems = [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        show: true,
      },
      { label: "Profile", path: "/profile", icon: User, show: !isAdmin() },
      {
        label: "Search Doctors",
        path: "/search",
        icon: Search,
        show: !isAdmin(),
      },
      {
        label: "Medical News",
        path: "/news",
        icon: Newspaper,
        show: !isAdmin(),
      },
    ];

    if (isJunior()) {
      return [
        ...baseItems,
        { label: "Browse Jobs", path: "/jobs", icon: Briefcase, show: true },
        {
          label: "My Applications",
          path: "/applications",
          icon: FileText,
          show: true,
        },
        {
          label: "Appointments",
          path: "/appointments",
          icon: Calendar,
          show: true,
        },
        {
          label: "Messages",
          path: "/messages",
          icon: MessageSquare,
          show: true,
        },
        {
          label: "Subscription",
          path: "/subscription/status",
          icon: CreditCard,
          show: true,
        },
      ];
    }

    if (isSenior()) {
      return [
        ...baseItems,
        { label: "Post Job", path: "/jobs/post", icon: Briefcase, show: true },
        {
          label: "Manage Jobs",
          path: "/jobs/manage",
          icon: ClipboardList,
          show: true,
        },
        {
          label: "Applications",
          path: "/applications",
          icon: FileText,
          show: true,
        },
        {
          label: "Appointments",
          path: "/appointments",
          icon: Calendar,
          show: true,
        },
        {
          label: "Messages",
          path: "/messages",
          icon: MessageSquare,
          show: true,
        },
        {
          label: "Subscription",
          path: "/subscription/status",
          icon: CreditCard,
          show: true,
        },
      ];
    }

    if (isAdmin()) {
      return [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          show: true,
        },
        { label: "Admin Panel", path: "/admin", icon: Settings, show: true },
      ];
    }

    return baseItems;
  };

  const navItems = getNavigationItems().filter((item) => item.show);

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-100 shadow-sm hidden lg:flex flex-col z-40 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Sidebar navigation items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${
                sidebarOpen ? "px-3" : "px-0 justify-center"
              } py-2.5 rounded-lg transition-all duration-300 ease-in-out group relative ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              }`}
              title={!sidebarOpen ? item.label : ""}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                  sidebarOpen ? "mr-3" : ""
                }`}
              />
              {sidebarOpen && (
                <span
                  className="text-sm font-medium truncate opacity-0 animate-fadeIn"
                  style={{
                    animationDelay: "100ms",
                    animationFillMode: "forwards",
                  }}
                >
                  {item.label}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button at bottom */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`flex items-center ${
            sidebarOpen ? "px-3" : "px-0 justify-center"
          } py-2.5 w-full text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200`}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
};

// Minimal Top NavBar - Logo, notifications, messages, user info only
const NavBar = ({ sidebarOpen }) => {
  const { user, logout, isJunior, isSenior, isAdmin } = useAuth();
  const { socket, isConnected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = React.useState(0);
  const navigate = useNavigate();

  // Fetch unread message count
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      // Only fetch if user is authenticated
      if (!user) {
        return;
      }

      const { messageAPI } = await import("./api");
      const response = await messageAPI.getConversations();

      // Check if response is valid
      if (!response || !response.data) {
        console.warn("Invalid response from getConversations");
        return;
      }

      const conversations = response.data.data || [];
      const totalUnread = conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setUnreadMessageCount(totalUnread);
    } catch (error) {
      // Silently fail - don't show error to user for background fetch
      // Only log if it's not a timeout or auth error
      if (error.code !== "ECONNABORTED" && error.response?.status !== 401) {
        console.error("Error fetching unread count:", error);
      }
    }
  }, [user]);

  // Initial fetch and periodic refresh
  React.useEffect(() => {
    if (!isAdmin()) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchUnreadCount]);

  // Listen for real-time message events
  React.useEffect(() => {
    if (socket && isConnected && !isAdmin()) {
      // When new message is received, increment count
      const handleNewMessage = () => {
        setUnreadMessageCount((prev) => prev + 1);
      };

      // When message is read, decrement count
      const handleMessageRead = () => {
        fetchUnreadCount(); // Refresh to get accurate count
      };

      // When conversation is opened, refresh count
      const handleConversationUpdate = () => {
        fetchUnreadCount();
      };

      socket.on("new_message", handleNewMessage);
      socket.on("message_read", handleMessageRead);
      socket.on("conversation_updated", handleConversationUpdate);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("message_read", handleMessageRead);
        socket.off("conversation_updated", handleConversationUpdate);
      };
    }
  }, [socket, isConnected, isAdmin, fetchUnreadCount]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Same navigation logic for mobile menu
  const getNavigationItems = () => {
    const baseItems = [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        show: true,
      },
      { label: "Profile", path: "/profile", icon: User, show: !isAdmin() },
      {
        label: "Search Doctors",
        path: "/search",
        icon: Search,
        show: !isAdmin(),
      },
      {
        label: "Medical News",
        path: "/news",
        icon: Newspaper,
        show: !isAdmin(),
      },
    ];

    if (isJunior()) {
      return [
        ...baseItems,
        { label: "Browse Jobs", path: "/jobs", icon: Briefcase, show: true },
        {
          label: "My Applications",
          path: "/applications",
          icon: FileText,
          show: true,
        },
        {
          label: "Appointments",
          path: "/appointments",
          icon: Calendar,
          show: true,
        },
        {
          label: "Messages",
          path: "/messages",
          icon: MessageSquare,
          show: true,
        },
        {
          label: "Subscription",
          path: "/subscription/status",
          icon: CreditCard,
          show: true,
        },
      ];
    }

    if (isSenior()) {
      return [
        ...baseItems,
        { label: "Post Job", path: "/jobs/post", icon: Briefcase, show: true },
        {
          label: "Manage Jobs",
          path: "/jobs/manage",
          icon: ClipboardList,
          show: true,
        },
        {
          label: "Applications",
          path: "/applications",
          icon: FileText,
          show: true,
        },
        {
          label: "Appointments",
          path: "/appointments",
          icon: Calendar,
          show: true,
        },
        {
          label: "Messages",
          path: "/messages",
          icon: MessageSquare,
          show: true,
        },
        {
          label: "Subscription",
          path: "/subscription/status",
          icon: CreditCard,
          show: true,
        },
      ];
    }

    if (isAdmin()) {
      return [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          show: true,
        },
        { label: "Admin Panel", path: "/admin", icon: Settings, show: true },
      ];
    }

    return baseItems;
  };

  const navItems = getNavigationItems().filter((item) => item.show);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex justify-between items-center h-16">
        {/* Logo - Aligned with sidebar icons */}
        <div
          className={`flex items-center transition-all duration-300 ease-in-out ${
            sidebarOpen ? "pl-3" : "w-16 justify-center"
          }`}
        >
          <Link
            to="/dashboard"
            className="flex items-center flex-shrink-0 group"
          >
            <Logo size={36} showText={sidebarOpen} />
          </Link>
        </div>

        {/* Right side - Messages, Notifications, User info only */}
        <div className="flex items-center space-x-2 pr-4">
          {/* Messages & Notifications for non-admin */}
          {!isAdmin() && (
            <div className="flex items-center space-x-3 mr-2">
              <Link
                to="/messages"
                className="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-0 -right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </span>
                )}
              </Link>

              <div className="relative">
                <NotificationBell />
              </div>
            </div>
          )}

          {/* User info - Desktop */}
          <div className="hidden md:flex items-center space-x-3 pl-3 ml-2 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 active:scale-95"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu - Unchanged from original */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 active:scale-[0.98]"
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile user section */}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <div className="px-4 py-2 bg-gray-50 rounded-lg mb-1">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-0.5 leading-tight">
                  {user?.role}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all duration-150 active:scale-[0.98]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

// Breadcrumb component - Adjusted for sidebar spacing
const Breadcrumb = ({ sidebarOpen }) => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter((p) => p);

  return (
    <div className="bg-white border-b border-slate-100">
      {/* Add left margin on desktop to account for sidebar */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        <nav className="flex space-x-2 text-xs text-slate-500 py-2.5">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          {paths.map((path, index) => (
            <React.Fragment key={index}>
              <span>/</span>
              <Link
                to={`/${paths.slice(0, index + 1).join("/")}`}
                className="capitalize hover:text-blue-600 transition-colors"
              >
                {path.replace("-", " ")}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
};

// Protected Layout - Now includes sidebar state management
const ProtectedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <>
      <NavBar sidebarOpen={sidebarOpen} />
      <DesktopSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <Breadcrumb sidebarOpen={sidebarOpen} />
      {/* Main content area - Adjusted for sidebar on desktop */}
      <div
        className={`pt-[35px] transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-16"
        }`}
      >
        <Outlet />
      </div>
    </>
  );
};

// AppContent component to handle auth logic
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
  }, [location]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />

      {/* Subscription Routes (Protected) */}
      <Route
        path="/subscription/plans"
        element={
          <ProtectedRoute>
            <SubscriptionPlans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/status"
        element={
          <ProtectedRoute>
            <SubscriptionStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/manage"
        element={
          <ProtectedRoute>
            <ManageSubscription />
          </ProtectedRoute>
        }
      />

      {/* Checkout Routes (Can be public for Stripe redirect) */}
      <Route path="/subscription/success" element={<CheckoutSuccess />} />
      <Route path="/subscription/cancel" element={<CheckoutCancel />} />

      {/* Protected Routes with Layout */}
      <Route element={<ProtectedLayout />}>
        {/* Basic Protected - Auth only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctor Search - Active Required */}
        <Route
          path="/search"
          element={
            <ProtectedRoute requireActive={true}>
              <DoctorSearch />
            </ProtectedRoute>
          }
        />

        {/* Profile Routes - Active Required */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireActive={true}>
              <EnhancedProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin Only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Job Management Routes (Senior Doctors) */}
        <Route
          path="/jobs/post"
          element={
            <ProtectedRoute roles={["senior"]}>
              <JobPosting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/manage"
          element={
            <ProtectedRoute roles={["senior"]}>
              <JobManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId/edit"
          element={
            <ProtectedRoute roles={["senior"]}>
              <JobPosting />
            </ProtectedRoute>
          }
        />

        {/* Job Discovery Routes */}
        <Route path="/jobs" element={<JobBrowse />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />

        {/* Application Routes */}
        <Route
          path="/jobs/:jobId/apply"
          element={
            <ProtectedRoute requireActive={true}>
              <ApplicationSubmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute requireActive={true}>
              <ApplicationTracking />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/verifications"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Messaging Routes */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute requireActive={true}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Appointments Route */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute requireActive={true}>
              <AppointmentsList />
            </ProtectedRoute>
          }
        />

        {/* Notification Routes */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute requireActive={true}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications/preferences"
          element={
            <ProtectedRoute requireActive={true}>
              <NotificationPreferences />
            </ProtectedRoute>
          }
        />

        {/* Medical News Route */}
        <Route
          path="/news"
          element={
            <ProtectedRoute requireActive={true}>
              <MedicalNews />
            </ProtectedRoute>
          }
        />

        {/* Public Profile Route */}
        <Route
          path="/profile/:identifier"
          element={
            <ProtectedRoute requireActive={true}>
              <PublicProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <ErrorBoundary>
              <div className="App">
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#fff",
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                      },
                    },
                  }}
                />
                <AppContent />
              </div>
            </ErrorBoundary>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
