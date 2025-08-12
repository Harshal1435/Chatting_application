import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../statemanage/useConversation";

const useGetSocketSeenMessage = () => {
  const { socket } = useSocketContext();
  const { messages, setMessage } = useConversation(); // ✅ fixed: messages not message

  useEffect(() => {
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

    return () => {
      socket.off("message-seen", handleSeen);
    };
  }, [socket, setMessage]);

};

export default useGetSocketSeenMessage;