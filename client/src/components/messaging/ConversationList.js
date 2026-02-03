// client/src/components/messaging/ConversationList.js
import React from "react";
import { formatDistanceToNow } from "date-fns";
import OnlineStatus from "../common/OnlineStatus";
import { Search } from "lucide-react";

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">No conversations yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start a conversation from a job or profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversation Items */}
      <div className="divide-y divide-gray-100">
        {conversations.map((conversation) => {
          const isSelected = selectedConversation?._id === conversation._id;
          const hasUnread = conversation.unreadCount > 0;

          return (
            <div
              key={conversation._id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-50 border-l-4 border-blue-600"
                  : "hover:bg-gray-50 border-l-4 border-transparent"
              } ${hasUnread ? "bg-blue-50/50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Profile Photo */}
                <div className="relative flex-shrink-0">
                  {conversation.otherParticipant?.profilePhoto?.url ? (
                    <img
                      src={conversation.otherParticipant.profilePhoto.url}
                      alt={conversation.otherParticipant.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {conversation.otherParticipant?.firstName?.[0]}
                      {conversation.otherParticipant?.lastName?.[0]}
                    </div>
                  )}

                  {/* Online Status Indicator */}
                  <div className="absolute bottom-0 right-0">
                    <OnlineStatus
                      status={
                        conversation.otherParticipant?.onlineStatus || "offline"
                      }
                      size="sm"
                    />
                  </div>
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        hasUnread ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Dr. {conversation.otherParticipant?.firstName}{" "}
                      {conversation.otherParticipant?.lastName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(
                        new Date(
                          conversation.lastMessage?.timestamp ||
                            conversation.createdAt
                        ),
                        {
                          addSuffix: true,
                        }
                      )}
                    </span>
                  </div>

                  <p
                    className={`text-sm truncate ${
                      hasUnread ? "font-medium text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {conversation.lastMessage?.content || "No messages yet"}
                  </p>

                  {/* Specialty */}
                  <p className="text-xs text-gray-500 mt-1">
                    {conversation.otherParticipant?.primarySpecialty}
                  </p>
                </div>

                {/* Unread Badge */}
                {hasUnread && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                      {conversation.unreadCount > 9
                        ? "9+"
                        : conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
