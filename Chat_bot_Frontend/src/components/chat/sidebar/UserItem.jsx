import useConversation from "../../../store/useConversation";
import { useSocketContext } from "../../../context/SocketContext";

const DEFAULT_AVATAR =
  "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

/**
 * UserItem — one row in the chat list.
 * Shows avatar, online dot, name, status line, and optional Friend badge.
 */
function UserItem({ user, isFriend = false }) {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();

  const isSelected = selectedConversation?._id === user._id;
  const isOnline   = onlineUsers.includes(user._id);

  return (
    <div
      onClick={() => setSelectedConversation(user)}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      {/* Avatar + online dot */}
      <div className="relative flex-shrink-0">
        <img
          src={user.avatar || DEFAULT_AVATAR}
          alt={user.fullname}
          className="w-11 h-11 rounded-full object-cover"
          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        {/* Row 1: name + Friend badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={`font-medium text-sm truncate ${
              isSelected
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {user.fullname}
          </span>

          {isFriend && (
            <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 leading-none">
              Friend
            </span>
          )}
        </div>

        {/* Row 2: online / email */}
        <p
          className={`text-xs truncate mt-0.5 ${
            isOnline
              ? "text-green-500 dark:text-green-400"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {isOnline ? "● Online" : user.email}
        </p>
      </div>
    </div>
  );
}

export default UserItem;
