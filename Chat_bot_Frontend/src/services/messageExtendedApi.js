import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/message-extended`,
  withCredentials: true,
});

/**
 * Reply to a message
 */
export const replyToMessage = async (messageId, replyToId) => {
  try {
    const response = await api.post("/reply", { messageId, replyToId });
    return response.data;
  } catch (error) {
    console.error("Error replying to message:", error);
    throw error;
  }
};

/**
 * Forward a message
 */
export const forwardMessage = async (originalMessageId, newMessageId, originalSenderId) => {
  try {
    const response = await api.post("/forward", {
      originalMessageId,
      newMessageId,
      originalSenderId,
    });
    return response.data;
  } catch (error) {
    console.error("Error forwarding message:", error);
    throw error;
  }
};

/**
 * Add reaction to a message
 */
export const addReaction = async (messageId, emoji) => {
  try {
    const response = await api.post("/reaction/add", { messageId, emoji });
    return response.data;
  } catch (error) {
    console.error("Error adding reaction:", error);
    throw error;
  }
};

/**
 * Remove reaction from a message
 */
export const removeReaction = async (messageId) => {
  try {
    const response = await api.post("/reaction/remove", { messageId });
    return response.data;
  } catch (error) {
    console.error("Error removing reaction:", error);
    throw error;
  }
};

/**
 * Edit a message
 */
export const editMessage = async (messageId, newEncryptedMessage, newIv) => {
  try {
    const response = await api.post("/edit", {
      messageId,
      newEncryptedMessage,
      newIv,
    });
    return response.data;
  } catch (error) {
    console.error("Error editing message:", error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId, deleteForEveryone = false) => {
  try {
    const response = await api.post("/delete", {
      messageId,
      deleteForEveryone,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

/**
 * Pin/Unpin a message
 */
export const togglePinMessage = async (messageId) => {
  try {
    const response = await api.post("/pin", { messageId });
    return response.data;
  } catch (error) {
    console.error("Error toggling pin:", error);
    throw error;
  }
};

/**
 * Set disappearing message timer
 */
export const setDisappearingTimer = async (messageId, deleteAfterSeconds) => {
  try {
    const response = await api.post("/disappearing", {
      messageId,
      deleteAfterSeconds,
    });
    return response.data;
  } catch (error) {
    console.error("Error setting disappearing timer:", error);
    throw error;
  }
};

/**
 * Get extended message data
 */
export const getMessageExtended = async (messageId) => {
  try {
    const response = await api.get(`/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting extended message data:", error);
    throw error;
  }
};
