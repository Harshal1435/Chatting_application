import React from "react";
import useConversation from "../../statemanage/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import { motion } from "framer-motion";

function User({ user, activeTab }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;
  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  // Don't show user in communities tab if they're not in a community
  if (activeTab === "Communities" && !user.isCommunity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`px-4 py-3 transition-colors duration-200 ${
        isSelected
          ? "bg-blue-100 dark:bg-gray-700"
          : "hover:bg-gray-100 dark:hover:bg-gray-700"
      } cursor-pointer`}
      onClick={() => setSelectedConversation(user)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={user.avatar || "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png"}
            alt={user.fullname}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h1 className="font-medium text-gray-900 dark:text-white truncate">
              {user.fullname}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {activeTab === "Communities" ? `${user.members?.length || 0} members` : user.email}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default User;