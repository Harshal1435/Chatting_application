import React, { useState } from "react";
import useConversation from "../../statemanage/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import EditProfile from "../../components/EditProfile.jsx";
import { CiMenuFries } from "react-icons/ci";
import { MdCall, MdVideoCall } from "react-icons/md";
import { useCallContext } from "../../context/CallContext.jsx";

function Chatuser() {
  const { selectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();
  const { startCall } = useCallContext();

  const [showEdit, setShowEdit] = useState(false);

  if (!selectedConversation) return null;

  const status = onlineUsers.includes(selectedConversation._id)
    ? "Online"
    : "Offline";

  const handleCallClick = async (type) => {
    await startCall({ to: selectedConversation._id, type }); // Uses CallContext
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
        <div className="flex items-center gap-4">
          <img
            src={selectedConversation.avatar}
            alt="avatar"
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-medium">{selectedConversation.username}</p>
            <span className="text-sm text-gray-400">{status}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <MdCall
            className="text-2xl cursor-pointer hover:text-green-400"
            onClick={() => handleCallClick("audio")}
          />
          <MdVideoCall
            className="text-2xl cursor-pointer hover:text-blue-400"
            onClick={() => handleCallClick("video")}
          />
          <CiMenuFries
            className="text-2xl cursor-pointer hover:text-gray-300"
            onClick={() => setShowEdit(true)}
          />
        </div>
      </div>

      {showEdit && <EditProfile onClose={() => setShowEdit(false)} />}
    </>
  );
}

export default Chatuser;
