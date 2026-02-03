// client/src/components/messaging/MessageBubble.js
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Paperclip } from "lucide-react";

const MessageBubble = ({ message }) => {
  const { user } = useAuth();

  // Robust sender detection - handle both populated object and string ID
  const getSenderId = () => {
    if (!message.sender) return null;
    if (typeof message.sender === "object" && message.sender._id) {
      return message.sender._id.toString();
    }
    return message.sender.toString();
  };

  const senderId = getSenderId();
  const currentUserId = user?._id?.toString();
  const isOwnMessage = senderId === currentUserId;

  const renderFileAttachment = () => {
    if (message.messageType !== "file") return null;

    return (
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
      >
        <Paperclip className="w-4 h-4" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{message.fileName}</p>
          <p className="text-xs opacity-75">
            {(message.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </a>
    );
  };

  const renderStatusIndicator = () => {
    if (!isOwnMessage) return null;

    return (
      <span className="flex items-center ml-1">
        {message.status === "sent" && (
          <Check className="w-3.5 h-3.5 text-gray-400" />
        )}
        {message.status === "delivered" && (
          <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
        )}
        {message.status === "read" && (
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        )}
      </span>
    );
  };

  return (
    <div
      className={`flex mb-4 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex flex-col max-w-[70%] ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isOwnMessage
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
          }`}
        >
          {/* File Attachment */}
          {renderFileAttachment()}

          {/* Message Content */}
          {message.content && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Edited Indicator */}
          {message.editedAt && (
            <p
              className={`text-xs mt-1 italic ${
                isOwnMessage ? "text-blue-100" : "text-gray-500"
              }`}
            >
              (edited)
            </p>
          )}
        </div>

        {/* Message Info */}
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </span>
          {renderStatusIndicator()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
