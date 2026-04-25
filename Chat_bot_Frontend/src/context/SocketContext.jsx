import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => useContext(SocketContext);

const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: true/false }
  const [authUser] = useAuth();

  useEffect(() => {
    if (!authUser?.user?._id) return;

    const newSocket = io(baseurl, {
      withCredentials: true,
      query: { userId: authUser.user._id },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => setOnlineUsers(users));

    newSocket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Typing indicators
    newSocket.on("user-typing", ({ from }) => {
      setTypingUsers((prev) => ({ ...prev, [from]: true }));
    });

    newSocket.on("user-stop-typing", ({ from }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[from];
        return updated;
      });
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setNotifications([]);
      setTypingUsers({});
    };
  }, [authUser]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        setNotifications,
        typingUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
