import { useState, useEffect, useRef } from "react";
import { X, Eye } from "lucide-react";
import { viewStatus } from "../../services/statusApi";
import { useSocketContext } from "../../context/SocketContext";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";
const STATUS_DURATION = 5000;

const StatusViewer = ({ statusGroup, onClose, currentUserId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress]         = useState(0);
  const progressRef = useRef(null);
  const { socket } = useSocketContext();

  const statuses = statusGroup?.statuses || [];
  const current  = statuses[currentIndex];

  useEffect(() => {
    if (!current) return;
    if (current.user?._id === currentUserId) return;
    const alreadyViewed = current.viewers?.some(
      (v) => (v.userId?._id || v.userId) === currentUserId
    );
    if (!alreadyViewed) {
      viewStatus(current._id).catch(() => {});
      if (socket) socket.emit("view-status", { statusId: current._id });
    }
  }, [current, currentUserId, socket]);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / STATUS_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(progressRef.current); goNext(); }
    }, 50);
    return () => clearInterval(progressRef.current);
  }, [currentIndex]);

  const goNext = () => {
    if (currentIndex < statuses.length - 1) setCurrentIndex((i) => i + 1);
    else onClose();
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!current) return null;

  const user = statusGroup.user;
  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(current.createdAt)) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full max-h-[100dvh] flex flex-col">

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {statuses.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-0 right-0 z-10 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2">
            <img
              src={user?.avatar || DEFAULT_AVATAR}
              alt={user?.fullname}
              className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{user?.fullname}</p>
              <p className="text-white/60 text-xs">{timeAgo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Media */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {current.mediaType === "video" ? (
            <video key={current._id} src={current.media} autoPlay playsInline className="w-full h-full object-contain" />
          ) : (
            <img key={current._id} src={current.media} alt={current.caption} className="w-full h-full object-contain" />
          )}
        </div>

        {/* Caption */}
        {current.caption && (
          <div className="absolute bottom-16 left-0 right-0 px-4">
            <p className="text-white text-sm text-center bg-black/40 rounded-xl px-3 py-2 backdrop-blur-sm">
              {current.caption}
            </p>
          </div>
        )}

        {/* Viewer count */}
        {user?._id === currentUserId && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white/70 text-xs">
            <Eye size={14} />
            <span>{current.viewers?.length || 0} views</span>
          </div>
        )}

        {/* Tap zones */}
        <button onClick={goPrev} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" aria-label="Previous" />
        <button onClick={goNext} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" aria-label="Next" />
      </div>
    </div>
  );
};

export default StatusViewer;
