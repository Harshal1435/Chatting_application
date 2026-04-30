import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Hook for offline message queue management
 */
export const useOfflineQueue = () => {
  const [status, setStatus] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  /**
   * Get queue status
   */
  const getQueueStatus = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/offline-queue/status`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setStatus(data.stats);
      return data;
    } catch (err) {
      console.error("Failed to get queue status:", err);
      return null;
    }
  };

  /**
   * Get pending messages count
   */
  const getPendingCount = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/offline-queue/pending-count`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setPendingCount(data.pendingCount || 0);
      return data.pendingCount;
    } catch (err) {
      console.error("Failed to get pending count:", err);
      return 0;
    }
  };

  /**
   * Retry failed messages
   */
  const retryFailedMessages = async () => {
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/offline-queue/retry`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // Refresh status after retry
      await getQueueStatus();
      await getPendingCount();

      return data;
    } catch (err) {
      console.error("Failed to retry messages:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear delivered messages
   */
  const clearDeliveredMessages = async () => {
    setLoading(true);

    try {
      const { data } = await axios.delete(
        `${API_URL}/api/offline-queue/clear-delivered`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // Refresh status after clearing
      await getQueueStatus();

      return data;
    } catch (err) {
      console.error("Failed to clear delivered messages:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-refresh pending count periodically
   */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Initial fetch
    getPendingCount();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getPendingCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    pendingCount,
    loading,
    getQueueStatus,
    getPendingCount,
    retryFailedMessages,
    clearDeliveredMessages,
  };
};

export default useOfflineQueue;
