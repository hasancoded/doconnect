// client/src/context/AuthContext.js - Fixed Login Issue
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  authAPI,
  profileAPI,
  subscriptionAPI,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
} from "../api";

const AuthContext = createContext();

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Account status
  accountStatus: null,
  verificationStatus: {
    identity: "pending",
    medical_license: "pending",
    background_check: "pending",
    overall: "pending",
  },

  // Profile completion
  profileCompletion: {
    percentage: 0,
    completedSections: [],
    missingSections: [],
    lastUpdated: null,
  },

  // User role and permissions
  role: null,
  permissions: {
    canAccessBasicFeatures: false,
    canAccessActiveFeatures: false,
    canAccessProfessionalFeatures: false,
    canAccessPremiumFeatures: false,
    canAccessAdminFeatures: false,
  },

  // Analytics
  profileAnalytics: {
    views: { total: 0, thisMonth: 0, thisWeek: 0 },
    searchAppearances: { total: 0, thisMonth: 0 },
    contactAttempts: { total: 0, thisMonth: 0 },
  },

  // Subscription Management
  subscription: null,
  subscriptionLoading: false,
  subscriptionError: null,
};

// ============================================================================
// PERMISSION CALCULATOR
// ============================================================================

const calculatePermissions = (user) => {
  if (!user) return initialState.permissions;

  const accountStatus = user.accountStatus;
  const verificationStatus = user.verificationStatus || {};
  const role = user.role;
  const subscription = user.subscription || {};

  const isPremiumUser =
    subscription &&
    subscription.status === "active" &&
    subscription.planId !== "free";

  return {
    canAccessBasicFeatures: ["pending", "active"].includes(accountStatus),
    canAccessActiveFeatures: accountStatus === "active",
    canAccessProfessionalFeatures:
      accountStatus === "active" && verificationStatus.overall === "verified",
    canAccessPremiumFeatures: isPremiumUser,
    canAccessAdminFeatures: role === "admin" && accountStatus === "active",
  };
};

// ============================================================================
// REDUCER
// ============================================================================

const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, loading: true, error: null };

    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS": {
      const userData = action.payload.user;
      const token = action.payload.token;

      setAuthToken(token);

      return {
        ...state,
        user: userData,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
        accountStatus: userData.accountStatus,
        verificationStatus:
          userData.verificationStatus || state.verificationStatus,
        profileCompletion:
          userData.profileCompletion || state.profileCompletion,
        role: userData.role,
        permissions: calculatePermissions(userData),
        profileAnalytics: userData.analytics || state.profileAnalytics,
      };
    }

    case "LOAD_USER_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
        accountStatus: action.payload.accountStatus,
        verificationStatus:
          action.payload.verificationStatus || state.verificationStatus,
        profileCompletion:
          action.payload.profileCompletion || state.profileCompletion,
        role: action.payload.role,
        permissions: calculatePermissions(action.payload),
        profileAnalytics: action.payload.analytics || state.profileAnalytics,
      };

    case "UPDATE_USER": {
      const updatedUser = action.payload;
      return {
        ...state,
        user: updatedUser,
        accountStatus: updatedUser.accountStatus,
        verificationStatus:
          updatedUser.verificationStatus || state.verificationStatus,
        profileCompletion:
          updatedUser.profileCompletion || state.profileCompletion,
        role: updatedUser.role,
        permissions: calculatePermissions(updatedUser),
        profileAnalytics: updatedUser.analytics || state.profileAnalytics,
      };
    }

    case "UPDATE_PROFILE_COMPLETION":
      return {
        ...state,
        profileCompletion: {
          ...state.profileCompletion,
          ...action.payload,
        },
      };

    case "UPDATE_VERIFICATION_STATUS": {
      const newVerificationStatus = {
        ...state.verificationStatus,
        ...action.payload,
      };
      return {
        ...state,
        verificationStatus: newVerificationStatus,
        permissions: calculatePermissions({
          ...state.user,
          verificationStatus: newVerificationStatus,
        }),
      };
    }

    case "UPDATE_ACCOUNT_STATUS":
      return {
        ...state,
        accountStatus: action.payload,
        permissions: calculatePermissions({
          ...state.user,
          accountStatus: action.payload,
        }),
      };

    case "UPDATE_ANALYTICS":
      return {
        ...state,
        profileAnalytics: {
          ...state.profileAnalytics,
          ...action.payload,
        },
      };

    case "SUBSCRIPTION_LOADING":
      return {
        ...state,
        subscriptionLoading: true,
        subscriptionError: null,
      };

    case "SUBSCRIPTION_SUCCESS":
      return {
        ...state,
        subscription: action.payload,
        subscriptionLoading: false,
        subscriptionError: null,
      };

    case "SUBSCRIPTION_ERROR":
      return {
        ...state,
        subscriptionLoading: false,
        subscriptionError: action.payload,
      };

    case "AUTH_ERROR":
    case "LOGIN_FAIL":
    case "REGISTER_FAIL":
    case "LOGOUT":
      clearAuthToken();
      return {
        ...initialState,
        loading: false,
        error: action.payload,
        token: null,
        isAuthenticated: false,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "CLEAR_SUBSCRIPTION_ERROR":
      return { ...state, subscriptionError: null };

    case "REFRESH_PERMISSIONS":
      return {
        ...state,
        permissions: calculatePermissions(state.user),
      };

    default:
      return state;
  }
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ============================================================================
  // CORE AUTH METHODS
  // ============================================================================

  const loadUser = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        dispatch({ type: "AUTH_LOADING" });
      }

      if (!getAuthToken()) {
        dispatch({ type: "AUTH_ERROR", payload: null });
        return;
      }

      const response = await authAPI.getMe();
      dispatch({ type: "LOAD_USER_SUCCESS", payload: response.data.data });
    } catch (error) {
      console.error("Load user error:", error);
      if (!silent) {
        dispatch({
          type: "AUTH_ERROR",
          payload: error.response?.data?.message,
        });
      }
    }
  }, []);

  const register = async (userData) => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const response = await authAPI.register(userData);

      // ✅ Set token immediately
      setAuthToken(response.data.token);

      dispatch({
        type: "REGISTER_SUCCESS",
        payload: {
          token: response.data.token,
          user: response.data.data,
        },
      });

      // Now safe to fetch subscription
      refreshSubscription().catch((err) =>
        console.warn("Failed to fetch subscription on register:", err)
      );

      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      dispatch({ type: "REGISTER_FAIL", payload: message });
      return { success: false, message, errors: error.response?.data?.errors };
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: "AUTH_LOADING" });

      const response = await authAPI.login(credentials);

      // ✅ Set token immediately in axios before any other calls
      setAuthToken(response.data.token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          token: response.data.token,
          user: response.data.data,
        },
      });


      // Now safe to fetch subscription - token is already in axios
      refreshSubscription().catch((err) =>
        console.warn("Failed to fetch subscription on login:", err)
      );

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("🔐 AuthContext: Login error:", error);
      const message = error.response?.data?.message || "Login failed";
      dispatch({ type: "LOGIN_FAIL", payload: message });
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
      clearAuthToken();
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateDetails(userData);
      dispatch({ type: "UPDATE_USER", payload: response.data.data });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      return { success: false, message, errors: error.response?.data?.errors };
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      const response = await authAPI.updatePassword(passwordData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Password update failed";
      return { success: false, message, errors: error.response?.data?.errors };
    }
  };

  // ============================================================================
  // PROFILE MANAGEMENT METHODS
  // ============================================================================

  const uploadProfilePhoto = async (photoFile, onProgress) => {
    try {
      const response = await profileAPI.uploadPhoto(photoFile, onProgress);
      dispatch({ type: "UPDATE_USER", payload: response.data.data });
      return { success: true, message: "Photo uploaded successfully" };
    } catch (error) {
      const message = error.response?.data?.message || "Photo upload failed";
      return { success: false, message };
    }
  };

  const uploadDocuments = async (files, documentTypes, onProgress) => {
    try {
      const response = await profileAPI.uploadDocuments(
        files,
        documentTypes,
        onProgress
      );
      dispatch({ type: "UPDATE_USER", payload: response.data.data });
      return { success: true, message: "Documents uploaded successfully" };
    } catch (error) {
      const message = error.response?.data?.message || "Document upload failed";
      return { success: false, message };
    }
  };

  const updateBasicProfile = async (profileData) => {
    try {
      const response = await profileAPI.updateBasic(profileData);
      dispatch({ type: "UPDATE_USER", payload: response.data.data });
      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      return { success: false, message };
    }
  };

  // ============================================================================
  // STATUS UPDATE METHODS
  // ============================================================================

  const updateProfileCompletion = (completionData) => {
    dispatch({ type: "UPDATE_PROFILE_COMPLETION", payload: completionData });
  };

  const updateVerificationStatus = (statusUpdates) => {
    dispatch({ type: "UPDATE_VERIFICATION_STATUS", payload: statusUpdates });
  };

  const updateAccountStatus = (status) => {
    dispatch({ type: "UPDATE_ACCOUNT_STATUS", payload: status });
  };

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  const getProfileAnalytics = async () => {
    try {
      const response = await profileAPI.getAnalytics();
      dispatch({ type: "UPDATE_ANALYTICS", payload: response.data.data });
      return response.data.data;
    } catch (error) {
      console.error("Error getting profile analytics:", error);
      return null;
    }
  };

  // ============================================================================
  // SUBSCRIPTION METHODS
  // ============================================================================

  const refreshSubscription = async () => {
    try {
      dispatch({ type: "SUBSCRIPTION_LOADING" });
      const response = await subscriptionAPI.getCurrentSubscription();
      dispatch({
        type: "SUBSCRIPTION_SUCCESS",
        payload: response.data.data,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      dispatch({
        type: "SUBSCRIPTION_ERROR",
        payload:
          error.response?.data?.message || "Failed to fetch subscription",
      });
      return null;
    }
  };

  const getSubscriptionPlans = async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      return response.data.data;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      throw error;
    }
  };

  const createCheckoutSession = async (planId, billingCycle = "monthly") => {
    try {
      const response = await subscriptionAPI.createCheckoutSession(
        planId,
        billingCycle
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  };

  const upgradePlan = async (targetPlanId) => {
    try {
      const response = await subscriptionAPI.upgradePlan(targetPlanId);
      await refreshSubscription();
      return response.data.data;
    } catch (error) {
      console.error("Error upgrading plan:", error);
      throw error;
    }
  };

  const downgradePlan = async (targetPlanId) => {
    try {
      const response = await subscriptionAPI.downgradePlan(targetPlanId);
      await refreshSubscription();
      return response.data.data;
    } catch (error) {
      console.error("Error downgrading plan:", error);
      throw error;
    }
  };

  const cancelSubscription = async (reason = "", feedback = "") => {
    try {
      const response = await subscriptionAPI.cancelSubscription({
        reason,
        feedback,
      });
      await refreshSubscription();
      return response.data.data;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  };

  const reactivateSubscription = async () => {
    try {
      const response = await subscriptionAPI.reactivateSubscription();
      await refreshSubscription();
      return response.data.data;
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw error;
    }
  };

  const getInvoices = async (page = 1, limit = 10) => {
    try {
      const response = await subscriptionAPI.getInvoices(page, limit);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  };

  const trackUsage = async (usageType, amount = 1) => {
    try {
      const response = await subscriptionAPI.trackUsage(usageType, amount);
      return response.data.data;
    } catch (error) {
      console.error("Error tracking usage:", error);
      throw error;
    }
  };

  const checkFeatureAccess = async (featureName) => {
    try {
      const response = await subscriptionAPI.checkFeatureAccess(featureName);
      return response.data.data;
    } catch (error) {
      console.error("Error checking feature access:", error);
      throw error;
    }
  };

  const updatePaymentMethod = async () => {
    try {
      const response = await subscriptionAPI.updatePaymentMethod();
      return response.data.data;
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  };

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  const hasPermission = (permission) => {
    return state.permissions[permission] || false;
  };

  const canAccessRoute = (routeLevel) => {
    const levelMap = {
      basic: "canAccessBasicFeatures",
      active: "canAccessActiveFeatures",
      professional: "canAccessProfessionalFeatures",
      premium: "canAccessPremiumFeatures",
      admin: "canAccessAdminFeatures",
    };
    return hasPermission(levelMap[routeLevel] || "canAccessBasicFeatures");
  };

  // ============================================================================
  // ACCOUNT STATUS HELPERS
  // ============================================================================

  const isAccountPending = () => state.accountStatus === "pending";
  const isAccountActive = () => state.accountStatus === "active";
  const isAccountInactive = () => state.accountStatus === "inactive";
  const isAccountSuspended = () => state.accountStatus === "suspended";

  // ============================================================================
  // VERIFICATION HELPERS
  // ============================================================================

  const isIdentityVerified = () =>
    state.verificationStatus.identity === "verified";
  const isMedicalLicenseVerified = () =>
    state.verificationStatus.medical_license === "verified";
  const isBackgroundCheckVerified = () =>
    state.verificationStatus.background_check === "verified";
  const isFullyVerified = () => state.verificationStatus.overall === "verified";
  const isPartiallyVerified = () =>
    state.verificationStatus.overall === "partial";

  // ============================================================================
  // PROFILE COMPLETION HELPERS
  // ============================================================================

  const getProfileCompletionPercentage = () =>
    state.profileCompletion.percentage;
  const isProfileComplete = () => state.profileCompletion.percentage >= 80;
  const getMissingProfileSections = () =>
    state.profileCompletion.missingSections || [];

  // ============================================================================
  // ROLE HELPERS
  // ============================================================================

  const isAdmin = () => state.role === "admin";
  const isSenior = () => state.role === "senior";
  const isJunior = () => state.role === "junior";

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const clearSubscriptionError = () => {
    dispatch({ type: "CLEAR_SUBSCRIPTION_ERROR" });
  };

  const refreshPermissions = () => {
    dispatch({ type: "REFRESH_PERMISSIONS" });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadUser();
    } else {
      dispatch({ type: "AUTH_ERROR", payload: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch({ type: "LOGOUT" });
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (state.isAuthenticated && getAuthToken()) {
      const interval = setInterval(() => {
        loadUser(true);
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]); // Only depend on auth status, not loadUser function

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // State
    ...state,

    // Core auth methods
    register,
    login,
    logout,
    loadUser,
    updateProfile,
    updatePassword,
    clearError,

    // Profile management
    uploadProfilePhoto,
    uploadDocuments,
    updateBasicProfile,
    updateProfileCompletion,
    updateVerificationStatus,
    updateAccountStatus,
    refreshPermissions,

    // Analytics
    getProfileAnalytics,

    // Subscription methods
    refreshSubscription,
    getSubscriptionPlans,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
    upgradePlan,
    downgradePlan,
    getInvoices,
    trackUsage,
    checkFeatureAccess,
    updatePaymentMethod,
    clearSubscriptionError,

    // Permission helpers
    hasPermission,
    canAccessRoute,

    // Account status helpers
    isAccountPending,
    isAccountActive,
    isAccountInactive,
    isAccountSuspended,

    // Verification helpers
    isIdentityVerified,
    isMedicalLicenseVerified,
    isBackgroundCheckVerified,
    isFullyVerified,
    isPartiallyVerified,

    // Profile completion helpers
    getProfileCompletionPercentage,
    isProfileComplete,
    getMissingProfileSections,

    // Role helpers
    isAdmin,
    isSenior,
    isJunior,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ============================================================================
// HOC FOR PROTECTED ROUTES
// ============================================================================

export const withAuth = (WrappedComponent, requiredPermission) => {
  return (props) => {
    const auth = useAuth();

    if (!auth.isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please log in to access this page.
            </p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      );
    }

    if (requiredPermission && !auth.canAccessRoute(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;
