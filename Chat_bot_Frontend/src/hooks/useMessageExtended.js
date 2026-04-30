import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Hook for extended message features (reply, forward, reactions, etc.)
 */
export const useMessageExtended = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem("token") || "";

  /**
   * Reply to a message
   */
  const replyToMessage = async (receiverId, replyToId, encryptedMessage, iv) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/message-extended/reply/${receiverId}`,
        { replyToId, encryptedMessage, iv },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      toast.success("Reply sent!");
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send reply";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Forward message to multiple users
   */
  const forwardMessage = async (messageId, receiverIds) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/message-extended/forward`,
        { messageId, receiverIds },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      toast.success(`Message forwarded to ${data.forwardedCount} users!`);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to forward message";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add reaction to message
   */
  const addReaction = async (messageId, emoji) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/message-extended/reaction/add`,
        { messageId, emoji },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to add reaction";
      toast.error(errorMsg);
      return null;
    }
  };

  /**
   * Remove reaction from message
   */
  const removeReaction = async (messageId, emoji) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/message-extended/reaction/remove`,
        { messageId, emoji },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to remove reaction";
      toast.error(errorMsg);
      return null;
    }
  };

  /**
   * Send disappearing message
   */
  const sendDisappearingMessage = async (receiverId, encryptedMessage, iv, disappearAfter) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/message-extended/disappearing/${receiverId}`,
        { encryptedMessage, iv, disappearAfter },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      toast.success("Disappearing message sent!");
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send disappearing message";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Edit message
   */
  const editMessage = async (messageId, newEncryptedMessage, newIv) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.put(
        `${API_URL}/api/message-extended/edit`,
        { messageId, newEncryptedMessage, newIv },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      toast.success("Message edited!");
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to edit message";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle pin message
   */
  const togglePinMessage = async (messageId) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/message-extended/pin`,
        { messageId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      toast.success(data.isPinned ? "Message pinned!" : "Message unpinned!");
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to pin message";
      toast.error(errorMsg);
      return null;
    }
  };

  /**
   * Get message extended data
   */
  const getMessageExtended = async (messageId) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/message-extended/${messageId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      return data;
    } catch (err) {
      console.error("Failed to get message extended data:", err);
      return null;
    }
  };

  return {
    loading,
    error,
    replyToMessage,
    forwardMessage,
    addReaction,
    removeReaction,
    sendDisappearingMessage,
    editMessage,
    togglePinMessage,
    getMessageExtended,
  };
};

export default useMessageExtended;
