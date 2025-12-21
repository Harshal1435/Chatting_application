import React, { useState } from "react";
import useConversation from "../../statemanage/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { useCall } from "../../context/CallContext.jsx";
import ProfileView from "../../components/ProfileView.jsx";
import CallUI from "../../components/CallUI.jsx";
import { CiMenuFries } from "react-icons/ci";
import { MdCall, MdVideoCall, MdMoreVert } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

function Chatuser() {
  const { selectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();
  const { startCall, incomingCall, currentCall } = useCall();

  const [showEdit, setShowEdit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!selectedConversation) return null;

  const isOnline = onlineUsers.includes(selectedConversation._id);
  const status = isOnline ? "Online" : "Offline";

  // ================= CALL HANDLER =================
  const handleCallClick = (type) => {
    if (!selectedConversation) return;
    startCall(selectedConversation._id, type); // type = "audio" or "video"
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  return (
    <>
      {/* ================= CHAT HEADER ================= */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Link to={`/profile/${selectedConversation._id}`}>
              <img
                src={
                  selectedConversation.avatar ||
                  "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png"
                }
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </Link>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedConversation.fullname}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`text-xs ${
                  isOnline ? "text-green-500" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {status}
              </span>
              {isOnline && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
            </div>
          </div>
        </div>

        {/* ================= CALL BUTTONS & MENU ================= */}
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
          <button
            onClick={() => handleCallClick("audio")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Voice call"
          >
            <MdCall className="text-xl text-blue-500" />
          </button>
          <button
            onClick={() => handleCallClick("video")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Video call"
          >
            <MdVideoCall className="text-xl text-blue-500" />
          </button>

          <div className="relative">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="More options"
            >
              <MdMoreVert className="text-xl" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => {
                      setShowEdit(true);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    View Profile
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Mute Notifications
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Clear Chat
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ================= PROFILE VIEW ================= */}
      <AnimatePresence>
        {showEdit && selectedConversation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProfileView
              userId={selectedConversation._id}
              onClose={() => setShowEdit(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CALL UI ================= */}
      {(incomingCall || currentCall) && (
        <CallUI targetUserId={selectedConversation._id} />
      )}
    </>
  );
}

export default Chatuser;
