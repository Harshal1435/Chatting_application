import { useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import useConversation from "../statemanage/useConversation.js";
import sound from "../assets/notification.mp3";

const useGetSocketMessage = () => {
  const { socket } = useSocketContext();
  const { messages, setMessage, selectedConversation } = useConversation();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Only play sound if the message is from the currently selected conversation
      if (newMessage.senderId === selectedConversation?._id) {
        const notification = new Audio(sound);
        notification.play().catch(() => {}); // ignore autoplay errors
        setMessage((prev) => [...prev, newMessage]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, setMessage, selectedConversation]);
};

export default useGetSocketMessage;