// client/src/hooks/useRealtimeMetrics.js - Real-Time Metrics Hook with Polling Fallback
import { useState, useEffect, useCallback, useRef } from "react";
import { adminAPI } from "../api";

/**
 * Custom hook for real-time metric updates
 * Uses WebSocket when available, falls back to polling
 */
export const useRealtimeMetrics = (socket, isConnected) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const pollingIntervalRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch metrics from API (used for initial load and polling)
  const fetchMetrics = useCallback(async (silent = false) => {
    // Prevent duplicate requests
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      if (!silent) setLoading(true);

      const response = await adminAPI.getDashboard();
      setMetrics(response.data.data);
      setLastFetch(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      if (!silent) {
        setError(err.response?.data?.message || "Failed to fetch metrics");
      }
    } finally {
      if (!silent) setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch lightweight live metrics (for polling)
  const fetchLiveMetrics = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      const response = await adminAPI.getLiveMetrics();
      const liveData = response.data.data;

      // Merge with existing metrics
      setMetrics((prev) => ({
        ...prev,
        metrics: {
          ...prev?.metrics,
          users: liveData.users,
          verification: {
            ...prev?.metrics?.verification,
            ...liveData.verification,
          },
          jobs: liveData.jobs,
        },
        timestamp: liveData.timestamp,
      }));

      setLastFetch(new Date());
    } catch (err) {
      console.error("Error fetching live metrics:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMetricsUpdate = (data) => {
      setMetrics((prev) => ({
        ...prev,
        metrics: {
          ...prev?.metrics,
          ...data,
        },
        timestamp: data.timestamp,
      }));
      setLastFetch(new Date());
    };

    const handleActivityFeed = (activities) => {
      setMetrics((prev) => ({
        ...prev,
        activityFeed: activities,
      }));
    };

    // Subscribe to events
    socket.on("admin:metrics:update", handleMetricsUpdate);
    socket.on("admin:activity:feed", handleActivityFeed);

    // Request initial data
    socket.emit("admin:metrics:request");
    socket.emit("admin:activity:request", { limit: 50 });

    // Cleanup
    return () => {
      socket.off("admin:metrics:update", handleMetricsUpdate);
      socket.off("admin:activity:feed", handleActivityFeed);
    };
  }, [socket, isConnected]);

  // Polling fallback when WebSocket is disconnected
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Only poll if WebSocket is NOT connected
    if (!isConnected) {

      // Poll every 30 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchLiveMetrics();
      }, 30000);
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isConnected, fetchLiveMetrics]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastFetch,
    refresh,
  };
};
