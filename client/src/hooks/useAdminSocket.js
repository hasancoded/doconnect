// client/src/hooks/useAdminSocket.js - Admin Socket.IO Connection Hook
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getAuthToken } from "../api";

/**
 * Custom hook for managing admin Socket.IO connection
 * Handles connection, reconnection, and real-time event subscriptions
 */
export const useAdminSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token available for admin socket");
      return;
    }

    // Socket.IO connects to server root, not /api
    // Remove /api from the URL if present
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    const serverUrl = apiUrl.replace(/\/api$/, ""); // Remove trailing /api
    const namespaceUrl = `${serverUrl}/admin`;


    // Create socket connection to admin namespace
    const socket = io(namespaceUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 10000,
    });


    // Connection successful
    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    // Admin-specific connection confirmation
    socket.on("admin:connected", (data) => {
      setLastUpdate(new Date(data.timestamp));
    });

    // Connection error
    socket.on("connect_error", (error) => {
      console.error("Admin socket connection error:", error.message);
      setIsConnected(false);
      setConnectionError(error.message);
      reconnectAttemptsRef.current++;

      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.warn(
          "Max reconnection attempts reached. Falling back to polling."
        );
        socket.disconnect();
      }
    });

    // Disconnection
    socket.on("disconnect", (reason) => {
      setIsConnected(false);

      // Auto-reconnect for certain disconnect reasons
      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });

    // Error handler
    socket.on("admin:error", (error) => {
      console.error("Admin socket error:", error);
      setConnectionError(error.message);
    });

    socketRef.current = socket;

    return socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const requestMetrics = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("admin:metrics:request");
    }
  }, [isConnected]);

  const requestActivity = useCallback(
    (options = {}) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("admin:activity:request", options);
      }
    },
    [isConnected]
  );

  // Initialize connection on mount
  useEffect(() => {
    const socket = connect();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [connect]);

  return {
    socket: socketRef.current,
    isConnected,
    lastUpdate,
    connectionError,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts,
    requestMetrics,
    requestActivity,
    disconnect,
  };
};
