import { useState, useCallback, useEffect } from "react";
import {
  searchMessages as searchApi,
  searchInConversation as searchInConvApi,
  getSearchSuggestions as getSuggestionsApi,
} from "../services/chatSearchApi";
import { useDebounce } from "./useDebounce";

export const useChatSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search messages
  const searchMessages = useCallback(async (searchQuery, filters = {}) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchApi(searchQuery, filters);
      setResults(data.results || []);
      return data;
    } catch (err) {
      setError(err.message);
      setResults([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search in specific conversation
  const searchInConversation = useCallback(
    async (conversationId, searchQuery, limit = 50) => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await searchInConvApi(conversationId, searchQuery, limit);
        setResults(data.results || []);
        return data;
      } catch (err) {
        setError(err.message);
        setResults([]);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get search suggestions
  const getSearchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await getSuggestionsApi(searchQuery);
      setSuggestions(data.suggestions || []);
      return data.suggestions;
    } catch (err) {
      console.error("Error getting suggestions:", err);
      setSuggestions([]);
    }
  }, []);

  // Auto-fetch suggestions when query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      getSearchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, getSearchSuggestions]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    suggestions,
    loading,
    error,
    searchMessages,
    searchInConversation,
    getSearchSuggestions,
    clearSearch,
  };
};
