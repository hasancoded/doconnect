// client/src/components/common/OnlineStatus.js
import React from "react";
import { formatDistanceToNow } from "date-fns";

const OnlineStatus = ({
  status,
  lastActive,
  showLabel = false,
  size = "sm",
}) => {
  const sizeClasses = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  };

  const getLastSeenText = () => {
    if (status === "online") return "Active now";
    if (status === "away") return "Away";
    if (lastActive) {
      return `Last seen ${formatDistanceToNow(new Date(lastActive), {
        addSuffix: true,
      })}`;
    }
    return "Offline";
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status Dot */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} ${statusColors[status]} rounded-full`}
        ></div>
        {status === "online" && (
          <div
            className={`absolute inset-0 ${statusColors[status]} rounded-full animate-ping opacity-75`}
          ></div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span className="text-sm text-gray-600">{getLastSeenText()}</span>
      )}
    </div>
  );
};

export default OnlineStatus;
