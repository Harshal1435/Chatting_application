import React from "react";
import useConversation from "../../statemanage/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";

function User({ user }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const isSelected = selectedConversation?._id === user._id;
  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(user._id);

  return (
    <div
      className={`cursor-pointer px-4 py-3 hover:bg-slate-700 transition duration-200 ${
        isSelected ? "bg-slate-800" : ""
      }`}
      onClick={() => setSelectedConversation(user)}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative w-12 h-12">
          <img
            src="https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png"
            alt="avatar"
            className="rounded-full w-full h-full object-cover"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-white font-medium text-sm truncate">{user.username}</h1>
          <span className="text-gray-400 text-xs truncate">{user.email}</span>
        </div>
      </div>
    </div>
  );
}

export default User;
