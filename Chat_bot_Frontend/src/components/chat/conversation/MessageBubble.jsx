import { useEffect, useState } from "react";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { useSocketContext } from "../../../context/SocketContext";
import useSeenMessage from "../../../hooks/useSeenMessage";
import { decryptText } from "../../../utils/cryptoUtils";
import { motion } from "framer-motion";

function Message({ message }) {
  const [decryptedText, setDecryptedText] = useState(null);
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const isMe = message.senderId === authUser.user._id;

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
      } catch {
        setDecryptedText("🔒 Couldn't decrypt this message");
      }
    };
    decrypt();
  }, [message]);

  useSeenMessage(message, authUser.user._id);

  const TickStatus = () => {
    if (!isMe) return null;
    if (message.seen) return <FaCheckDouble className="text-blue-400 text-[10px]" />;
    if (message.delivered) return <FaCheckDouble className="text-gray-400 text-[10px]" />;
    return <FaCheck className="text-gray-400 text-[10px]" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} px-3 py-0.5`}
    >
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-sm break-words text-sm leading-relaxed ${
            isMe
              ? "bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm"
              : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-600"
          }`}
        >
          {decryptedText === null ? (
            <span className="flex gap-1 items-center opacity-60">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          ) : (
            decryptedText
          )}
        </div>

        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formattedTime}</span>
          <TickStatus />
        </div>
      </div>
    </motion.div>
  );
}

export default Message;