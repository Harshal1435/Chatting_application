import { useState, useRef, useEffect } from "react";
import { Reply, Forward, Smile, MoreVertical, Pin } from "lucide-react";
import useMessageExtended from "../../../hooks/useMessageExtended";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * Message Actions — appears on hover above the message bubble.
 * Uses only Tailwind gray/white classes so it respects dark mode.
 */
const MessageActions = ({ message, onReply, onForward }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { addReaction, togglePinMessage } = useMessageExtended();
  const containerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowReactions(false);
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleReaction = async (emoji) => {
    await addReaction(message._id, emoji);
    setShowReactions(false);
  };

  const handlePin = async () => {
    await togglePinMessage(message._id);
    setShowMenu(false);
  };

  return (
    <div
      ref={containerRef}
      className="
        opacity-0 group-hover:opacity-100 focus-within:opacity-100
        transition-opacity duration-150
        absolute -top-8 right-1 z-20
        flex items-center gap-0.5
        bg-white dark:bg-gray-700
        border border-gray-200 dark:border-gray-600
        rounded-full shadow-md px-1 py-0.5
      "
    >
      {/* Reply */}
      <ActionBtn title="Reply" onClick={() => onReply?.(message)}>
        <Reply size={13} />
      </ActionBtn>

      {/* Forward */}
      <ActionBtn title="Forward" onClick={() => onForward?.(message)}>
        <Forward size={13} />
      </ActionBtn>

      {/* Reactions */}
      <div className="relative">
        <ActionBtn title="React" onClick={() => { setShowReactions((v) => !v); setShowMenu(false); }}>
          <Smile size={13} />
        </ActionBtn>

        {showReactions && (
          <div className="absolute bottom-full mb-1 right-0 flex gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg px-2 py-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-base hover:scale-125 transition-transform leading-none"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* More */}
      <div className="relative">
        <ActionBtn title="More" onClick={() => { setShowMenu((v) => !v); setShowReactions(false); }}>
          <MoreVertical size={13} />
        </ActionBtn>

        {showMenu && (
          <div className="absolute bottom-full mb-1 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl py-1 min-w-[110px]">
            <MenuItem icon={<Pin size={13} />} label="Pin" onClick={handlePin} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Small helpers ─────────────────────────────────────────────────────────── */

const ActionBtn = ({ children, title, onClick }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-1.5 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
  >
    {children}
  </button>
);

const MenuItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
  >
    {icon}
    {label}
  </button>
);

export default MessageActions;
