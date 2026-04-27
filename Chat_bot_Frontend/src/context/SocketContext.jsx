import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import io from "socket.io-client";

const SocketContext = createContext();
export const useSocketContext = () => useContext(SocketContext);

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const [authUser] = useAuth();
  const [socket, setSocket]           = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Use a stable primitive as the dep so we don't reconnect on every render
  const userId = authUser?.user?._id;

  // Keep a ref to the socket so cleanup always closes the right instance
  const socketRef = useRef(null);

  useEffect(() => {
    // Not logged in — make sure any old socket is closed
    if (!userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    // Tear down any previous socket before creating a new one
    socketRef.current?.disconnect();

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      query: { userId },
      // Reconnect automatically with back-off
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // ── Online users ──────────────────────────────────────────────────────
    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(Array.isArray(users) ? users : []);
    });

    // Re-request online users after reconnect so the list is never stale
    newSocket.on("connect", () => {
      // The server broadcasts getOnlineUsers on every connection,
      // but emit a ping just in case to get the current list immediately
      newSocket.emit("get-online-users");
    });

    newSocket.on("disconnect", () => {
      // Don't clear onlineUsers here — keep the last known list visible
      // until we reconnect and get a fresh one
    });

    // ── Notifications ─────────────────────────────────────────────────────
    newSocket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // ── Typing ────────────────────────────────────────────────────────────
    newSocket.on("user-typing", ({ from }) => {
      setTypingUsers((prev) => ({ ...prev, [from]: true }));
    });

    newSocket.on("user-stop-typing", ({ from }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setOnlineUsers([]);
      setTypingUsers({});
    };
  // Only re-run when the actual user ID changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, notifications, setNotifications, typingUsers }}
    >
      {children}
    </SocketContext.Provider>
  );
};
