import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import io from "socket.io-client";

const SocketContext = createContext();

// ✅ Custom hook
export const useSocketContext = () => useContext(SocketContext);

// ✅ Base URL
const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ Socket Provider
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [authUser] = useAuth();

  useEffect(() => {
    if (!authUser || !authUser.user?._id) return;

    const newSocket = io(baseurl, {
      withCredentials: true,
      query: {
        userId: authUser.user._id,
      },
    });

    setSocket(newSocket);

    // ✅ Receive online user updates
    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // ✅ Handle incoming notifications
    newSocket.on("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // ✅ Optional: Clear notifications on logout
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setNotifications([]);
    };
  }, [authUser]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        setNotifications, // in case you want to mark them as read or clear
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
