import React, { useState } from "react";
import { IoSend } from "react-icons/io5";
import { FaSmile, FaPaperclip } from "react-icons/fa";
import useSendMessage from "../../context/useSendMessage";
import { useTheme } from "../../context/ThemeContext";

function Typesend() {
  const [message, setMessage] = useState("");
  const { loading, sendMessages } = useSendMessage();
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await sendMessages(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-gray-100 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Add attachment"
        >
          <FaPaperclip size={20} />
        </button>

        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Add emoji"
        >
          <FaSmile size={20} />
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow px-4 py-2 rounded-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className={`p-2 rounded-full transition-all duration-200 ${
            loading || !message.trim()
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800"
          }`}
          aria-label="Send message"
        >
          <IoSend size={20} />
        </button>
      </div>
    </form>
  );
}

export default Typesend;