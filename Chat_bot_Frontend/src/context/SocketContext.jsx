import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import io from "socket.io-client";

const SocketContext = createContext();

// Custom hook
export const useSocketContext = () => useContext(SocketContext);

// Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [authUser] = useAuth();

  useEffect(() => {
    // ✅ Ensure user is present
    if (!authUser || !authUser.user?._id) {
      console.warn("SocketProvider: authUser missing");
      return;
    }

    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      query: {
        userId: authUser.user._id,
      },
    });

    setSocket(newSocket);

    // ✅ Handle online users event
    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // ✅ Clean up on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
