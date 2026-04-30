import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Hook for managing push notifications
 */
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if push notifications are supported
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      checkSubscription();
    }
  }, []);

  /**
   * Check if user is already subscribed
   */
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        setIsSubscribed(true);
        setSubscription(sub);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  /**
   * Register service worker
   */
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js"
      );
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (err) {
      console.error("Service Worker registration failed:", err);
      throw err;
    }
  };

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  /**
   * Subscribe to push notifications
   */
  const subscribe = async () => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Request permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error("Notification permission denied");
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Get VAPID public key from server
      const { data } = await axios.get(`${API_URL}/api/notifications/vapid-public-key`);
      const vapidPublicKey = data.publicKey;

      // Subscribe to push notifications
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/notifications/subscribe`,
        {
          subscription: sub.toJSON(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            deviceName: getBrowserName(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsSubscribed(true);
      setSubscription(sub);
      setLoading(false);

      return true;
    } catch (err) {
      console.error("Error subscribing to push notifications:", err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = async () => {
    if (!subscription) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify server
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/notifications/unsubscribe`,
        {
          endpoint: subscription.endpoint,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsSubscribed(false);
      setSubscription(null);
      setLoading(false);

      return true;
    } catch (err) {
      console.error("Error unsubscribing from push notifications:", err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  /**
   * Test push notification
   */
  const testNotification = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/notifications/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return true;
    } catch (err) {
      console.error("Error sending test notification:", err);
      setError(err.message);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    loading,
    error,
    subscribe,
    unsubscribe,
    testNotification,
  };
};

/**
 * Convert VAPID key from base64 to Uint8Array
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
 * Get browser name
 */
function getBrowserName() {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";

  return "Unknown";
}

export default usePushNotifications;
