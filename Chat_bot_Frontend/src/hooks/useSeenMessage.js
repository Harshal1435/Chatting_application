import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";

const useSeenMessage = (message, userId) => {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket || !message || message.seen || message.senderId === userId) return;

    socket.emit("mark-seen", {
      messageId: message._id,
      senderId: message.senderId,
    });
  }, [message, userId, socket]);
};

export default useSeenMessage;