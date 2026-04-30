import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Hook for chat search functionality
 */
export const useSearch = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem("token") || "";

  /**
   * Search messages across all conversations
   */
  const searchMessages = async (query, options = {}) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        limit: options.limit || 50,
        skip: options.skip || 0,
      });

      if (options.senderId) params.append("senderId", options.senderId);
      if (options.startDate) params.append("startDate", options.startDate);
      if (options.endDate) params.append("endDate", options.endDate);

      const { data } = await axios.get(
        `${API_URL}/api/search/messages?${params.toString()}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setResults(data.results || []);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Search failed";
      setError(errorMsg);
      console.error("Search error:", err);
      return { results: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search within a specific conversation
   */
  const searchInConversation = async (conversationId, query, options = {}) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query,
        limit: options.limit || 50,
        skip: options.skip || 0,
      });

      const { data } = await axios.get(
        `${API_URL}/api/search/conversation/${conversationId}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setResults(data.results || []);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Search failed";
      setError(errorMsg);
      console.error("Search error:", err);
      return { results: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search users
   */
  const searchUsers = async (query, limit = 20) => {
    if (!query || query.trim().length === 0) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(
        `${API_URL}/api/search/users?query=${encodeURIComponent(query)}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      return data.results || [];
    } catch (err) {
      const errorMsg = err.response?.data?.error || "User search failed";
      setError(errorMsg);
      console.error("User search error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get search suggestions
   */
  const getSearchSuggestions = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/search/suggestions`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      return data.suggestions || [];
    } catch (err) {
      console.error("Failed to get suggestions:", err);
      return [];
    }
  };

  /**
   * Clear search results
   */
  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    loading,
    results,
    error,
    searchMessages,
    searchInConversation,
    searchUsers,
    getSearchSuggestions,
    clearResults,
  };
};

export default useSearch;
