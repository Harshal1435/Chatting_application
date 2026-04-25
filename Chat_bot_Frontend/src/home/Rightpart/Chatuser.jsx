import React, { useState } from "react";
import useConversation from "../../statemanage/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { MdCall, MdVideoCall, MdMoreVert, MdArrowBack } from "react-icons/md";
import { useCallContext } from "../../context/CallContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

function Chatuser() {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers, typingUsers } = useSocketContext();
  const { startCall } = useCallContext();
  const [showMenu, setShowMenu] = useState(false);

  if (!selectedConversation) return null;

  const isOnline = onlineUsers.includes(selectedConversation._id);
  const isTyping = typingUsers[selectedConversation._id];

  const handleCallClick = async (type) => {
    await startCall({ to: selectedConversation._id, type });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Left: back + avatar + name */}
      <div className="flex items-center gap-3">
        {/* Back button (mobile) */}
        <button
          onClick={() => setSelectedConversation(null)}
          className="lg:hidden p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Back"
        >
          <MdArrowBack className="text-xl" />
        </button>

        <Link to={`/profile/${selectedConversation._id}`} className="flex items-center gap-3 group">
          <div className="relative">
            <img
              src={selectedConversation.avatar || DEFAULT_AVATAR}
              alt={selectedConversation.fullname}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-400 transition-all"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
              {selectedConversation.fullname}
            </p>
            <AnimatePresence mode="wait">
              {isTyping ? (
                <motion.p
                  key="typing"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1"
                >
                  typing
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                </motion.p>
              ) : (
                <motion.p
                  key="status"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {isOnline ? "● Online" : "Offline"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleCallClick("audio")}
          className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          aria-label="Voice call"
        >
          <MdCall className="text-xl" />
        </button>
        <button
          onClick={() => handleCallClick("video")}
          className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          aria-label="Video call"
        >
          <MdVideoCall className="text-2xl" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="More options"
          >
            <MdMoreVert className="text-xl" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-20 border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <Link
                    to={`/profile/${selectedConversation._id}`}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    View Profile
                  </Link>
                  <button className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Mute Notifications
                  </button>
                  <button className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Clear Chat
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Chatuser;