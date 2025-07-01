import React, { useEffect, useState } from "react";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { useSocketContext } from "../../context/SocketContext";
import useSeenMessage from "../../context/useSeenMessage";
import { decryptText } from "../../utils/cryptoUtils"; // 🔐 Import decrypt function

function Message({ message }) {
  const [decryptedText, setDecryptedText] = useState("Decrypting...");
  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const { socket } = useSocketContext();

  const isMe = message.senderId === authUser.user._id;
  const alignment = isMe ? "chat-end" : "chat-start";
  const bubbleColor = isMe ? "bg-blue-500" : "bg-gray-700";

  const createdAt = new Date(message.createdAt);
  const formattedTime = createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ✅ Decrypt the message
  useEffect(() => {
    const decrypt = async () => {
      try {
        const plainText = await decryptText(message.message, message.iv);
        setDecryptedText(plainText);
      } catch (error) {
        console.error("❌ Error decrypting message:", error);
        setDecryptedText("[Decryption failed]");
      }
    };
    decrypt();
  }, [message]);

  // ✅ Seen tracker
  useSeenMessage(message, authUser.user._id);

  // ✅ Tick status
  let TickIcon = null;
  if (isMe) {
    if (message.seen) {
      TickIcon = <FaCheckDouble className="text-blue-500 text-[12px]" />;
    } else if (message.delivered) {
      TickIcon = <FaCheckDouble className="text-gray-300 text-[12px]" />;
    } else {
      TickIcon = <FaCheck className="text-gray-300 text-[12px]" />;
    }
  }

  return (
    <div className="px-3 py-1">
      <div className={`chat ${alignment}`}>
        <div
          className={`chat-bubble text-white ${bubbleColor} break-words max-w-[75%] px-4 py-2 rounded-lg`}
        >
          {decryptedText}
        </div>
        <div className="chat-footer text-[11px] text-gray-200 flex items-center gap-1 px-1">
          <span>{formattedTime}</span>
          {TickIcon}
        </div>
      </div>
    </div>
  );
}

export default Message;
