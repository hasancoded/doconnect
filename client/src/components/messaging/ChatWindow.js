// client/src/components/messaging/ChatWindow.js
import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { messageAPI } from "../../api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import OnlineStatus from "../common/OnlineStatus";
import AppointmentScheduler from "../appointments/AppointmentScheduler";
import { Calendar } from "lucide-react";

const ChatWindow = ({ conversation, onConversationUpdate }) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherParticipant = conversation.otherParticipant;

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation) {
      fetchMessages();
      joinConversation();
      markConversationAsRead();
    }

    return () => {
      if (socket && conversation) {
        // Leave conversation room on unmount
        socket.off("new_message");
        socket.off("user_typing");
        socket.off("user_stopped_typing");
      }
    };
  }, [conversation._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(conversation._id);
      setMessages(response.data.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinConversation = () => {
    if (socket && isConnected) {
      socket.emit("join_conversation", conversation._id);

      // Listen for new messages
      socket.on("new_message", (message) => {
        if (message.conversationId === conversation._id) {
          setMessages((prev) => [...prev, message]);
        }
      });

      // Listen for message delivered events
      socket.on("message_delivered", (data) => {
        if (data.conversationId === conversation._id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === data.messageId
                ? { ...msg, status: "delivered", deliveredAt: data.deliveredAt }
                : msg
            )
          );
        }
      });

      // Listen for messages read events
      socket.on("messages_read", (data) => {
        if (data.conversationId === conversation._id) {
          setMessages((prev) =>
            prev.map((msg) =>
              data.messageIds?.includes(msg._id) || msg.sender !== socket.userId
                ? { ...msg, status: "read", readAt: data.readAt }
                : msg
            )
          );
        }
      });

      // Listen for typing indicators
      socket.on("user_typing", (data) => {
        if (data.conversationId === conversation._id) {
          setTyping(true);

          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Set new timeout to hide typing indicator
          typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
          }, 3000);
        }
      });

      socket.on("user_stopped_typing", (data) => {
        if (data.conversationId === conversation._id) {
          setTyping(false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
        }
      });
    }
  };

  const markConversationAsRead = async () => {
    try {
      await messageAPI.markConversationAsRead(conversation._id);
      // Emit event to update unread count in real-time
      if (socket && isConnected) {
        socket.emit("conversation_read", conversation._id);
      }
      // Trigger conversation update to refresh list
      onConversationUpdate();
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content, fileData) => {
    if (socket && isConnected) {
      const messageData = {
        conversationId: conversation._id,
        content,
        messageType: fileData ? "file" : "text",
        ...(fileData && {
          fileUrl: fileData.url,
          fileName: fileData.fileName,
          fileSize: fileData.fileSize,
        }),
      };

      socket.emit("send_message", messageData);
      onConversationUpdate();
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit("typing_start", conversation._id);
    }
  };

  const handleStopTyping = () => {
    if (socket && isConnected) {
      socket.emit("typing_stop", conversation._id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Profile Photo */}
          <div className="relative">
            {otherParticipant?.profilePhoto?.url ? (
              <img
                src={otherParticipant.profilePhoto.url}
                alt={otherParticipant.firstName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-100">
                {otherParticipant?.firstName?.[0]}
                {otherParticipant?.lastName?.[0]}
              </div>
            )}
            <div className="absolute bottom-0 right-0 transform translate-x-0.5 translate-y-0.5">
              <OnlineStatus
                status={otherParticipant?.onlineStatus || "offline"}
                size="sm"
              />
            </div>
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Dr. {otherParticipant?.firstName} {otherParticipant?.lastName}
            </h3>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <OnlineStatus
                status={otherParticipant?.onlineStatus || "offline"}
                lastActive={otherParticipant?.lastActive}
                showLabel={true}
              />
            </div>
          </div>
        </div>

        {/* Schedule Appointment Button */}
        <button
          onClick={() => setShowScheduler(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Calendar className="w-4 h-4" />
          Schedule
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-t-blue-600 border-r-blue-600 border-b-gray-200 border-l-gray-200"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageBubble key={message._id} message={message} />
            ))}
            {typing && (
              <TypingIndicator userName={otherParticipant?.firstName} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
        />
      </div>

      {/* Appointment Scheduler Modal */}
      {showScheduler && (
        <AppointmentScheduler
          doctor={otherParticipant}
          conversationId={conversation._id}
          onClose={() => setShowScheduler(false)}
          onSuccess={() => {
            onConversationUpdate();
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
