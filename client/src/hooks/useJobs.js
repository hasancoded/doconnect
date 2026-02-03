// client/src/hooks/useJobs.js - Custom Job Management Hook
import { useState, useEffect, useCallback } from "react";
import { jobAPI, handleApiError } from "../api/jobs";

export const useJobs = (filters = {}, autoLoad = true) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const loadJobs = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await jobAPI.browseJobs({
          ...filters,
          ...params,
          page: pagination.page,
          limit: pagination.limit,
        });

        setJobs(response.data.data);
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }));
      } catch (err) {
        const errorInfo = handleApiError(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.limit]
  );

  const createJob = async (jobData) => {
    try {
      setError(null);
      const response = await jobAPI.createJob(jobData);
      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  const updateJob = async (jobId, jobData) => {
    try {
      setError(null);
      const response = await jobAPI.updateJob(jobId, jobData);
      return { success: true, data: response.data };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  const deleteJob = async (jobId) => {
    try {
      setError(null);
      await jobAPI.deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      return { success: true };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadJobs();
    }
  }, [loadJobs, autoLoad]);

  return {
    jobs,
    loading,
    error,
    pagination,
    loadJobs,
    createJob,
    updateJob,
    deleteJob,
    setError,
    setPagination,
  };
};
