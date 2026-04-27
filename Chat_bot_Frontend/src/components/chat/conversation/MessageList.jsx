import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import useGetMessages from "../../../hooks/useGetMessages.js";
import useGetSocketMessage from "../../../hooks/useGetSocketMessage.js";
import useGetSocketSeenMessage from "../../../hooks/useGetSocketSeenMessage.js";
import LoadingSpinner from "../../ui/LoadingSpinner.jsx";
import { FiMessageSquare } from "react-icons/fi";
import { MdKeyboardArrowDown } from "react-icons/md";
import useConversation from "../../../store/useConversation.js";

function Messages() {
  const { loading, messages } = useGetMessages();
  const { selectedConversation } = useConversation();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useGetSocketMessage();
  useGetSocketSeenMessage();

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
      setIsAtBottom(true);
    }
  }, [selectedConversation]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setIsAtBottom(scrollHeight - (scrollTop + clientHeight) < 60);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  // Group messages by date
  const groupedMessages = messages?.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString([], {
      weekday: "long", month: "short", day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-2 py-3 space-y-0.5 bg-gray-50 dark:bg-gray-900"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner size="large" />
          </div>
        ) : messages?.length > 0 ? (
          <>
            {Object.entries(groupedMessages || {}).map(([date, msgs]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                    {date}
                  </span>
                </div>
                {msgs.map((msg) => (
                  <MessageBubble key={msg._id} message={msg} />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-2" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FiMessageSquare className="text-2xl text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Say hi to {selectedConversation?.fullname?.split(" ")[0]}!
            </p>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 bottom-4 p-2.5 bg-white dark:bg-gray-700 text-blue-500 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all"
          aria-label="Scroll to bottom"
        >
          <MdKeyboardArrowDown className="text-xl" />
        </button>
      )}
    </div>
  );
}

export default Messages;