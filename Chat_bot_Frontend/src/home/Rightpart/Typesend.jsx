import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { FaSmile } from "react-icons/fa";
import useSendMessage from "../../context/useSendMessage";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../statemanage/useConversation";

function Typesend() {
  const [message, setMessage] = useState("");
  const { loading, sendMessages } = useSendMessage();
  const { socket } = useSocketContext();
  const { selectedConversation } = useConversation();
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Emit typing events
  const handleChange = (e) => {
    setMessage(e.target.value);

    if (socket && selectedConversation) {
      socket.emit("typing", { to: selectedConversation._id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", { to: selectedConversation._id });
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    if (socket && selectedConversation) {
      socket.emit("stop-typing", { to: selectedConversation._id });
    }

    await sendMessages(message.trim());
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="Add emoji"
        >
          <FaSmile size={18} />
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className={`p-2.5 rounded-full flex-shrink-0 transition-all duration-200 ${
            message.trim() && !loading
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-100"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <IoSend size={16} />
          )}
        </button>
      </div>
    </form>
  );
}

export default Typesend;