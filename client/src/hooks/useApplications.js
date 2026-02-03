// client/src/hooks/useApplications.js - Custom Application Management Hook
import { useState, useEffect, useCallback } from "react";
import { applicationAPI, handleApiError } from "../api/jobs";

export const useApplications = (type = "my-applications", autoLoad = true) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadApplications = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          type === "received"
            ? await applicationAPI.getReceivedApplications(params)
            : await applicationAPI.getMyApplications(params);

        setApplications(response.data.data);
      } catch (err) {
        const errorInfo = handleApiError(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  const submitApplication = async (applicationData) => {
    try {
      setError(null);
      const response = await applicationAPI.submitApplication(applicationData);
      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  const updateApplicationStatus = async (applicationId, status, notes = "") => {
    try {
      setError(null);
      const response = await applicationAPI.updateApplicationStatus(
        applicationId,
        status,
        notes
      );

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status, notes } : app
        )
      );

      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  const withdrawApplication = async (applicationId) => {
    try {
      setError(null);
      await applicationAPI.withdrawApplication(applicationId);

      // Remove from local state
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));

      return { success: true };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadApplications();
    }
  }, [loadApplications, autoLoad]);

  return {
    applications,
    loading,
    error,
    loadApplications,
    submitApplication,
    updateApplicationStatus,
    withdrawApplication,
    setError,
  };
};
