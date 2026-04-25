import React from "react";
import useConversation from "../../statemanage/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import { motion } from "framer-motion";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;
  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
      onClick={() => setSelectedConversation(user)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={user.avatar || DEFAULT_AVATAR}
          alt={user.fullname}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent"
          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className={`font-medium text-sm truncate ${
            isSelected
              ? "text-blue-700 dark:text-blue-300"
              : "text-gray-900 dark:text-white"
          }`}>
            {user.fullname}
          </span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${
          isOnline
            ? "text-green-500 dark:text-green-400"
            : "text-gray-400 dark:text-gray-500"
        }`}>
          {isOnline ? "Online" : user.email}
        </p>
      </div>
    </motion.div>
  );
}

export default User;