import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/notifications`,
  withCredentials: true,
});

/**
 * Register device for push notifications
 */
export const registerDevice = async (deviceData) => {
  try {
    const response = await api.post("/device/register", deviceData);
    return response.data;
  } catch (error) {
    console.error("Error registering device:", error);
    throw error;
  }
};

/**
 * Unregister device
 */
export const unregisterDevice = async (deviceId) => {
  try {
    const response = await api.post("/device/unregister", { deviceId });
    return response.data;
  } catch (error) {
    console.error("Error unregistering device:", error);
    throw error;
  }
};

/**
 * Get notification preferences
 */
export const getPreferences = async () => {
  try {
    const response = await api.get("/preferences");
    return response.data;
  } catch (error) {
    console.error("Error getting preferences:", error);
    throw error;
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (preferences) => {
  try {
    const response = await api.put("/preferences", preferences);
    return response.data;
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw error;
  }
};

/**
 * Mute conversation
 */
export const muteConversation = async (conversationId, mutedUntil = null) => {
  try {
    const response = await api.post("/mute", {
      conversationId,
      mutedUntil,
    });
    return response.data;
  } catch (error) {
    console.error("Error muting conversation:", error);
    throw error;
  }
};

/**
 * Unmute conversation
 */
export const unmuteConversation = async (conversationId) => {
  try {
    const response = await api.post("/unmute", { conversationId });
    return response.data;
  } catch (error) {
    console.error("Error unmuting conversation:", error);
    throw error;
  }
};

/**
 * Get notification history
 */
export const getNotificationHistory = async (limit = 50) => {
  try {
    const response = await api.get("/history", { params: { limit } });
    return response.data;
  } catch (error) {
    console.error("Error getting notification history:", error);
    throw error;
  }
};

/**
 * Test push notification
 */
export const testPushNotification = async () => {
  try {
    const response = await api.post("/test");
    return response.data;
  } catch (error) {
    console.error("Error testing push notification:", error);
    throw error;
  }
};

/**
 * Request notification permission and register service worker
 */
export const setupPushNotifications = async () => {
  try {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications");
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        ),
      });

      // Register device with backend
      const deviceId = generateDeviceId();
      await registerDevice({
        deviceId,
        platform: "web",
        token: JSON.stringify(subscription),
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
          auth: arrayBufferToBase64(subscription.getKey("auth")),
        },
      });

      return { success: true, subscription };
    }

    throw new Error("Service workers not supported");
  } catch (error) {
    console.error("Error setting up push notifications:", error);
    throw error;
  }
};

/**
 * Helper: Convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper: Generate unique device ID
 */
function generateDeviceId() {
  const stored = localStorage.getItem("deviceId");
  if (stored) return stored;

  const deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("deviceId", deviceId);
  return deviceId;
}
