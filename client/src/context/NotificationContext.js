// client/src/context/NotificationContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from server
  const fetchNotifications = useCallback(
    async (page = 1, limit = 20, filters = {}) => {
      if (!isConnected || !socket) return;

      setLoading(true);
      socket.emit("get_notifications", { page, limit, ...filters });
    },
    [socket, isConnected]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId) => {
      if (!socket || !isConnected) return;

      socket.emit("mark_notification_read", notificationId);

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [socket, isConnected]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit("mark_all_read");

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true, readAt: new Date() }))
    );
    setUnreadCount(0);
  }, [socket, isConnected]);

  // Delete notification
  const deleteNotification = useCallback(
    (notificationId) => {
      if (!socket || !isConnected) return;

      socket.emit("delete_notification", notificationId);

      // Optimistically update UI
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    },
    [socket, isConnected]
  );

  // Show toast for high-priority notifications
  const showNotificationToast = useCallback((notification) => {
    const { priority, title, message, actionUrl } = notification;

    if (priority === "high" || priority === "urgent") {
      const toastOptions = {
        duration: priority === "urgent" ? 6000 : 4000,
        style: {
          background: priority === "urgent" ? "#DC2626" : "#1F2937",
          color: "#fff",
        },
      };

      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-200">{message}</div>
            {actionUrl && (
              <button
                onClick={() => {
                  window.location.href = actionUrl;
                  toast.dismiss(t.id);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium text-left"
              >
                View →
              </button>
            )}
          </div>
        ),
        toastOptions
      );
    }
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle notifications loaded
    socket.on("notifications_loaded", (data) => {
      setNotifications(data.notifications);
      // Calculate unread count from loaded notifications
      const unread = data.notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
    });

    // Handle new notification
    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast for high-priority notifications
      showNotificationToast(notification);

      // Play sound if enabled (check user preferences)
      // TODO: Implement sound notification based on user preferences
    });

    // Handle notification marked as read
    socket.on("notification_marked_read", ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
    });

    // Handle all notifications marked as read
    socket.on("all_notifications_marked_read", () => {
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    });

    // Handle notification deleted
    socket.on("notification_deleted", ({ notificationId }) => {
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    });

    return () => {
      socket.off("notifications_loaded");
      socket.off("new_notification");
      socket.off("notification_marked_read");
      socket.off("all_notifications_marked_read");
      socket.off("notification_deleted");
    };
  }, [socket, isConnected, showNotificationToast]);

  // Fetch notifications on mount
  useEffect(() => {
    if (isAuthenticated && isConnected) {
      fetchNotifications();
    }
  }, [isAuthenticated, isConnected, fetchNotifications]);

  // Request desktop notification permission
  const requestDesktopPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const { title, message, actionUrl } = notification;

      const desktopNotif = new Notification(title, {
        body: message,
        icon: "/logo192.png", // Update with your app icon
        badge: "/logo192.png",
        tag: notification._id,
        requireInteraction: notification.priority === "urgent",
      });

      desktopNotif.onclick = () => {
        window.focus();
        if (actionUrl) {
          window.location.href = actionUrl;
        }
        desktopNotif.close();
      };
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestDesktopPermission,
    showDesktopNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
