// Production API Configuration
// This file should be used in production builds

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://api.yourdomain.com";

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
};

export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    UPDATE_PASSWORD: "/api/auth/updatepassword",
  },

  // Profile
  PROFILE: {
    ME: "/api/profile/me",
    UPDATE_BASIC: "/api/profile/basic",
    UPLOAD_PHOTO: "/api/profile/photo",
    UPLOAD_DOCUMENTS: "/api/profile/documents",
    ADD_EXPERIENCE: "/api/profile/experience",
    UPDATE_SKILLS: "/api/profile/skills",
    SEARCH: "/api/profile/search",
    PUBLIC: (slug) => `/api/profile/${slug}`,
  },

  // Jobs
  JOBS: {
    LIST: "/api/jobs",
    CREATE: "/api/jobs",
    DETAILS: (id) => `/api/jobs/${id}`,
    UPDATE: (id) => `/api/jobs/${id}`,
    DELETE: (id) => `/api/jobs/${id}`,
    MY_POSTED: "/api/jobs/my/posted",
    APPLY: (id) => `/api/jobs/${id}/apply`,
  },

  // Applications
  APPLICATIONS: {
    LIST: "/api/applications",
    DETAILS: (id) => `/api/applications/${id}`,
    UPDATE_STATUS: (id) => `/api/applications/${id}/status`,
    SEND_MESSAGE: (id) => `/api/applications/${id}/message`,
    BULK_ACTION: "/api/applications/bulk-action",
    WITHDRAW: (id) => `/api/applications/${id}`,
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    PLANS: "/api/subscriptions/plans",
    CURRENT: "/api/subscriptions/current",
    CREATE_CHECKOUT: "/api/subscriptions/create-checkout-session",
    CANCEL: "/api/subscriptions/cancel",
    REACTIVATE: "/api/subscriptions/reactivate",
    UPGRADE: "/api/subscriptions/upgrade",
    DOWNGRADE: "/api/subscriptions/downgrade",
  },

  // Messages
  MESSAGES: {
    LIST: "/api/messages",
    SEND: "/api/messages",
    CONVERSATION: (userId) => `/api/messages/conversation/${userId}`,
    MARK_READ: (messageId) => `/api/messages/${messageId}/read`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/api/notifications",
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: "/api/notifications/mark-all-read",
    DELETE: (id) => `/api/notifications/${id}`,
  },

  // Admin
  ADMIN: {
    DASHBOARD: "/api/admin/dashboard",
    USERS: "/api/admin/users",
    PENDING_VERIFICATIONS: "/api/admin/verification/pending",
    VERIFY_IDENTITY: (userId) => `/api/admin/verification/identity/${userId}`,
    VERIFY_LICENSE: (userId) => `/api/admin/verification/license/${userId}`,
    BULK_ACTION: "/api/admin/verification/bulk-action",
    UPDATE_USER_STATUS: (userId) => `/api/admin/users/${userId}/status`,
  },

  // Health & Status
  HEALTH: "/api/health",
  HEALTH_DB: "/api/health/db",
  STATUS: "/api/status",
  SOCKET_HEALTH: "/api/socket/health",
};

// Socket.IO Configuration
export const SOCKET_CONFIG = {
  url: API_BASE_URL,
  options: {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  },
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedDocumentTypes: ["application/pdf"],
  maxImages: 5,
  maxDocuments: 10,
};

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
};

export default API_CONFIG;
