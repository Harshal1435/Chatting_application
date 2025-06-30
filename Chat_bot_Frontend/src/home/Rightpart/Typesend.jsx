import React, { useState } from "react";
import { IoSend } from "react-icons/io5";
import useSendMessage from "../../context/useSendMessage.js";

function Typesend() {
  const [message, setMessage] = useState("");
  const { loading, sendMessages } = useSendMessage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await sendMessages(message.trim());
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 px-4 py-2 h-[8vh]">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow px-4 py-2 rounded-full bg-slate-900 border border-gray-700 text-white outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className={`text-white text-2xl p-2 rounded-full transition duration-200 ${
            loading || !message.trim()
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-blue-600 bg-blue-500"
          }`}
        >
          <IoSend />
        </button>
      </div>
    </form>
  );
}

export default Typesend;
