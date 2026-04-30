import { useState } from "react";
import { Reply, Forward, Smile, MoreVertical, Edit, Pin } from "lucide-react";
import useMessageExtended from "../../../hooks/useMessageExtended";

/**
 * Message Actions Component
 * Shows action buttons for messages (reply, forward, reactions, etc.)
 */
const MessageActions = ({ message, onReply, onForward }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { addReaction, togglePinMessage } = useMessageExtended();

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReaction = async (emoji) => {
    await addReaction(message._id, emoji);
    setShowReactions(false);
  };

  const handlePin = async () => {
    await togglePinMessage(message._id);
    setShowMenu(false);
  };

  return (
    <div className="message-actions opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-2 bg-base-200 rounded-lg shadow-lg p-1 flex gap-1 z-10">
      {/* Reply Button */}
      <button
        onClick={() => onReply && onReply(message)}
        className="btn btn-ghost btn-xs btn-circle"
        title="Reply"
      >
        <Reply size={14} />
      </button>

      {/* Forward Button */}
      <button
        onClick={() => onForward && onForward(message)}
        className="btn btn-ghost btn-xs btn-circle"
        title="Forward"
      >
        <Forward size={14} />
      </button>

      {/* Reactions Button */}
      <div className="relative">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="btn btn-ghost btn-xs btn-circle"
          title="React"
        >
          <Smile size={14} />
        </button>

        {showReactions && (
          <div className="absolute top-full mt-1 right-0 bg-base-100 rounded-lg shadow-xl p-2 flex gap-1 z-20">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="btn btn-ghost btn-xs text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* More Options */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="btn btn-ghost btn-xs btn-circle"
          title="More"
        >
          <MoreVertical size={14} />
        </button>

        {showMenu && (
          <div className="absolute top-full mt-1 right-0 bg-base-100 rounded-lg shadow-xl py-1 min-w-[120px] z-20">
            <button
              onClick={handlePin}
              className="w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-2 text-sm"
            >
              <Pin size={14} />
              Pin
            </button>
            <button
              onClick={() => {
                /* Edit functionality */
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-2 text-sm"
            >
              <Edit size={14} />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageActions;
