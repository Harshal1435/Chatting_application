
import { useState} from "react";
import useConversation from "../../statemanage/useConversation.js";
import { useSocketContext } from "../../context/SocketContext.jsx";
import { CiMenuFries } from "react-icons/ci";
import EditProfile from "../../components/EditProfile.jsx";
function Chatuser() {
  const { selectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();
const [showEdit, setShowEdit] = useState(false);
  const getOnlineUsersStatus = (userId) => {
    return onlineUsers.includes(userId) ? "Online" : "Offline";
  };

  if (!selectedConversation) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 h-[12vh]">
      {/* Left side: Avatar & Name */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white">
            <img
              src="https://via.placeholder.com/150" // you can replace this with selectedConversation.avatar or other image logic
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
              getOnlineUsersStatus(selectedConversation._id) === "Online"
                ? "bg-green-500"
                : "bg-gray-500"
            } border border-white`}
          />
        </div>
        <div>
          <h1 className="text-white font-medium text-lg capitalize">
            {selectedConversation.username}
          </h1>
          <p className="text-sm text-gray-300">
            {getOnlineUsersStatus(selectedConversation._id)}
          </p>
        </div>
      </div>

      {/* Optional: Right side menu icon */}
      <div onClick={() => setShowEdit(true)} className="text-white text-2xl cursor-pointer hover:text-gray-300 transition">
        <CiMenuFries />
      </div>

      {showEdit && <EditProfile onClose={() => setShowEdit(false)} />}
    </div>
  );
}

export default Chatuser;
