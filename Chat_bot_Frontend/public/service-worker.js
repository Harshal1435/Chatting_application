/* eslint-disable no-restricted-globals */
/**
 * Service Worker for Push Notifications
 * Handles push notification events and background sync
 */

// Service Worker version
const SW_VERSION = "1.0.0";
const CACHE_NAME = `chat-app-cache-v${SW_VERSION}`;

// Install event
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  // Take control of all clients immediately
  return self.clients.claim();
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  if (!event.data) {
    console.log("[SW] Push event has no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("[SW] Push data:", data);

    const options = {
      body: data.body || "You have a new message",
      icon: data.icon || "/icon.png",
      badge: data.badge || "/badge.png",
      tag: data.tag || "general",
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [
        { action: "open", title: "Open", icon: "/icons/open.png" },
        { action: "close", title: "Close", icon: "/icons/close.png" },
      ],
      vibrate: [200, 100, 200], // Vibration pattern
      timestamp: Date.now(),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "New Message", options)
    );
  } catch (error) {
    console.error("[SW] Error handling push event:", error);
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }

        // Open a new window
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.conversationId
            ? `${self.location.origin}/chat/${event.notification.data.conversationId}`
            : self.location.origin;
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event.notification.tag);
  
  // Track notification dismissal (optional)
  // You can send analytics here
});

// Background sync event (for offline message queue)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "sync-offline-messages") {
    event.waitUntil(syncOfflineMessages());
  }
});

/**
 * Sync offline messages when connection is restored
 */
async function syncOfflineMessages() {
  try {
    console.log("[SW] Syncing offline messages...");

    // Get all clients
    const clients = await self.clients.matchAll();

    // Notify all clients to sync
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_OFFLINE_MESSAGES",
        timestamp: Date.now(),
      });
    });

    console.log("[SW] Offline messages sync initiated");
  } catch (error) {
    console.error("[SW] Error syncing offline messages:", error);
  }
}

// Message event (communication with main thread)
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Fetch event (optional: for offline support)
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip caching for API requests (they should be handled by the app)
  if (event.request.url.includes("/api/")) {
    return;
  }

  // Network-first strategy for dynamic content
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

console.log(`[SW] Service Worker ${SW_VERSION} loaded`);
