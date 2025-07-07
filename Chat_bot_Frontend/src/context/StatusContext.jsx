import { createContext, useContext, useEffect, useState } from "react";
import { useSocketContext } from "./SocketContext";

export const StatusContext = createContext();

export const StatusProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new-status", (newStatus) => {
      setStatuses((prev) => [newStatus, ...prev]);
    });
    return () => socket.off("new-status");
  }, [socket]);

  return (
    <StatusContext.Provider value={{ statuses, setStatuses }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => useContext(StatusContext);
