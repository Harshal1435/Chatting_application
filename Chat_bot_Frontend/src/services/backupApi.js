import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/backup`,
  withCredentials: true,
});

/**
 * Create a new backup
 */
export const createBackup = async (backupType = "manual", password = null) => {
  try {
    const response = await api.post("/create", {
      backupType,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating backup:", error);
    throw error;
  }
};

/**
 * Get backup status
 */
export const getBackupStatus = async (backupId) => {
  try {
    const response = await api.get(`/${backupId}/status`);
    return response.data;
  } catch (error) {
    console.error("Error getting backup status:", error);
    throw error;
  }
};

/**
 * List all backups
 */
export const listBackups = async (limit = 10) => {
  try {
    const response = await api.get("/list", { params: { limit } });
    return response.data;
  } catch (error) {
    console.error("Error listing backups:", error);
    throw error;
  }
};

/**
 * Delete a backup
 */
export const deleteBackup = async (backupId) => {
  try {
    const response = await api.delete(`/${backupId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting backup:", error);
    throw error;
  }
};

/**
 * Restore from backup
 */
export const restoreBackup = async (backupId, password) => {
  try {
    const response = await api.post(`/${backupId}/restore`, { password });
    return response.data;
  } catch (error) {
    console.error("Error restoring backup:", error);
    throw error;
  }
};

/**
 * Schedule automatic backup
 */
export const scheduleAutoBackup = async (frequency, time) => {
  try {
    const response = await api.post("/schedule", {
      frequency,
      time,
    });
    return response.data;
  } catch (error) {
    console.error("Error scheduling backup:", error);
    throw error;
  }
};
