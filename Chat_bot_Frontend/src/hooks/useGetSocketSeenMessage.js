import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../store/useConversation";

const useGetSocketSeenMessage = () => {
  const { socket } = useSocketContext();
  const { setMessage } = useConversation();

  useEffect(() => {
    if (!socket) return;

    const handleSeen = (updatedMessage) => {
      setMessage((prevMessages) =>
        Array.isArray(prevMessages)
          ? prevMessages.map((msg) =>
              msg._id === updatedMessage._id ? updatedMessage : msg
            )
          : []
      );
    };

    socket.on("message-seen", handleSeen);
    return () => socket.off("message-seen", handleSeen);
  }, [socket, setMessage]);
};

export default useGetSocketSeenMessage;