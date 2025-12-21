import React, { useEffect, useState } from "react";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { useSocketContext } from "../../context/SocketContext";
import useSeenMessage from "../../context/useSeenMessage";
import { decryptText } from "../../utils/cryptoUtils";
import { motion } from "framer-motion";

function Message({ message }) {
  const [decryptedText, setDecryptedText] = useState("Decrypting...");
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const { socket } = useSocketContext();

  const isMe = message.senderId === authUser.user._id;
  const alignment = isMe ? "items-end" : "items-start";
  const bubbleColor = isMe 
    ? "bg-blue-500 dark:bg-blue-600" 
    : "bg-gray-200 dark:bg-gray-700";
  const textColor = isMe 
    ? "text-white" 
    : "text-gray-800 dark:text-gray-200";

  const createdAt = new Date(message.createdAt);
  const formattedTime = createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    const decrypt = async () => {
      try {
        const plainText = await decryptText(message.message, message.iv);
        setDecryptedText(plainText);
      } catch (error) {
        console.error("Error decrypting message:", error);
        setDecryptedText("[Couldn't decrypt this message]");
      }
    };
    decrypt();
  }, [message]);

  useSeenMessage(message, authUser.user._id);

  const TickStatus = () => {
    if (!isMe) return null;

    let icon;
    if (message.seen) {
      icon = <FaCheckDouble className="text-blue-400 dark:text-blue-300 text-xs" />;
    } else if (message.delivered) {
      icon = <FaCheckDouble className="text-gray-400 dark:text-gray-500 text-xs" />;
    } else {
      icon = <FaCheck className="text-gray-400 dark:text-gray-500 text-xs" />;
    }

    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col ${alignment} px-3 py-1`}
    >
      <div className="relative group max-w-[85%]">
        <div
          className={`${bubbleColor} ${textColor} rounded-2xl px-4 py-2 break-words shadow-sm transition-colors duration-200`}
        >
          {decryptedText}
        </div>
      </div>

      <div className={`flex items-center gap-1 mt-1 text-xs ${
        isMe 
          ? 'text-gray-500 dark:text-gray-400' 
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        <span>{formattedTime}</span>
        <TickStatus />
      </div>
    </motion.div>
  );
}

export default Message;