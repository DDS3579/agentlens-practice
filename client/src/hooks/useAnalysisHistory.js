import { useState, useCallback } from "react";
import useAuth from "./useAuth.js";

function useAnalysisHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { getToken } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in to view your history");
        }
        if (response.status === 403) {
          throw new Error("You do not have permission to view this history");
        }
        throw new Error("Failed to load analysis history");
      }

      const data = await response.json();
      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const deleteAnalysis = useCallback(
    async (id) => {
      try {
        setError(null);

        const token = await getToken();

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch(`/api/history/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to delete analyses");
          }
          if (response.status === 403) {
            throw new Error(
              "You do not have permission to delete this analysis",
            );
          }
          if (response.status === 404) {
            throw new Error("Analysis not found");
          }
          throw new Error("Failed to delete analysis");
        }

        // Remove from local state
        setAnalyses((prev) => prev.filter((analysis) => analysis.id !== id));

        return true;
      } catch (err) {
        console.error("Error deleting analysis:", err);
        setError(err.message || "Failed to delete analysis");
        return false;
      }
    },
    [getToken],
  );

  return {
    analyses,
    isLoading,
    error,
    fetchHistory,
    deleteAnalysis,
    clearError,
  };
}

export default useAnalysisHistory;
