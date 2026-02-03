// client/src/components/notifications/NotificationItem.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  MessageSquare,
  Eye,
  Star,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Trash2,
  Circle,
} from "lucide-react";

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    const iconMap = {
      job_application: Briefcase,
      application_status: CheckCircle,
      new_message: MessageSquare,
      profile_view: Eye,
      new_review: Star,
      subscription_expiring: CreditCard,
      subscription_renewed: CreditCard,
      verification_approved: CheckCircle,
      verification_rejected: AlertCircle,
    };

    const Icon = iconMap[type] || AlertCircle;
    return <Icon className="w-5 h-5" />;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      job_application: "blue",
      application_status: "green",
      new_message: "purple",
      profile_view: "indigo",
      new_review: "yellow",
      subscription_expiring: "orange",
      subscription_renewed: "green",
      verification_approved: "green",
      verification_rejected: "red",
    };

    return colorMap[type] || "gray";
  };

  const handleClick = () => {
    // Mark as read
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    const navigationMap = {
      new_message: "/messages",
      job_application: "/applications",
      application_status: "/applications",
      job_match: "/jobs",
      profile_view: "/profile",
      new_review: "/profile",
      subscription_expiring: "/subscription/status",
      subscription_renewed: "/subscription/status",
      verification_approved: "/profile",
      verification_rejected: "/profile",
    };

    const targetPath =
      notification.actionUrl || navigationMap[notification.type];
    if (targetPath) {
      navigate(targetPath);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification._id);
  };

  const color = getNotificationColor(notification.type);

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`p-2 bg-${color}-100 rounded-lg text-${color}-600 flex-shrink-0`}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
              <Circle className="w-2 h-2 fill-blue-600 text-blue-600 flex-shrink-0 mt-1" />
            )}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
