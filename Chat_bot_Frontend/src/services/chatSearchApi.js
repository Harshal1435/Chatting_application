import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/search`,
  withCredentials: true,
});

/**
 * Search messages across all conversations
 */
export const searchMessages = async (query, filters = {}) => {
  try {
    const params = {
      query,
      ...filters,
    };

    const response = await api.get("/", { params });
    return response.data;
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
};

/**
 * Search messages in a specific conversation
 */
export const searchInConversation = async (conversationId, query, limit = 50) => {
  try {
    const response = await api.get(`/conversation/${conversationId}`, {
      params: { query, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching in conversation:", error);
    throw error;
  }
};

/**
 * Get search suggestions
 */
export const getSearchSuggestions = async (query) => {
  try {
    const response = await api.get("/suggestions", {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    throw error;
  }
};

/**
 * Reindex all messages (admin function)
 */
export const reindexAllMessages = async () => {
  try {
    const response = await api.post("/reindex");
    return response.data;
  } catch (error) {
    console.error("Error reindexing messages:", error);
    throw error;
  }
};
