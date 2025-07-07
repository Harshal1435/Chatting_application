import React, { useEffect, useRef, useState } from "react";
import Message from "./Message";
import useGetMessage from "../../context/useGetMessage.js";
import useGetSocketMessage from "../../context/useGetSocketMessage.js";
import useGetSocketSeenMessage from "../../context/useGetSocketSeenMessage.js";
import Loading from "../../components/Loading.jsx";
import { FiMessageSquare } from "react-icons/fi";
import  useConversation  from "../../statemanage/useConversation.js";

function Messages() {
  const { loading, messages } = useGetMessage();
  const { selectedConversation } = useConversation();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useGetSocketMessage();       // 🎧 Listen for incoming messages
  useGetSocketSeenMessage();  // 👁️ Update seen status

  // Auto-scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const threshold = 50; // pixels from bottom
      setIsAtBottom(scrollHeight - (scrollTop + clientHeight) < threshold);
    }
  };

  // Scroll to bottom button handler
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setIsAtBottom(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-700"
      style={{ height: "calc(100vh - 8rem)" }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loading />
        </div>
      ) : messages?.length > 0 ? (
        <>
          <div className="text-center py-4">
            <div className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-300">
              {selectedConversation?.fullname
                ? `Conversation with ${selectedConversation.fullname}`
                : "New conversation"}
            </div>
          </div>

          {messages.map((msg) => (
            <Message key={msg._id} message={msg} />
          ))}
          
          <div ref={messagesEndRef} className="h-4" />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="p-6 bg-gray-200 dark:bg-gray-600 rounded-full mb-4">
            <FiMessageSquare className="text-4xl text-gray-400 dark:text-gray-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
            No messages yet
          </h3>
          <p className="text-gray-400 dark:text-gray-500 max-w-md">
            Send your first message to start the conversation
          </p>
        </div>
      )}

      {/* Scroll to bottom button (only shows when not at bottom) */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed right-8 bottom-24 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all"
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Messages;