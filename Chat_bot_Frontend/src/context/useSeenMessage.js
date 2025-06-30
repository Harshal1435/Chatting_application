import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";

const useSeenMessage = (message, userId) => {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!message.seen && message.senderId !== userId) {
      socket.emit("mark-seen", {
        messageId: message._id,
        senderId: message.senderId,
      });
    }
  }, [message, userId, socket]);
};

export default useSeenMessage;
