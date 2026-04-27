import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getStatuses } from "../../services/statusApi";
import { useSocketContext } from "../../context/SocketContext";
import StatusCreator from "./StatusCreator";
import StatusViewer from "./StatusViewer";
import LoadingSpinner from "../ui/LoadingSpinner";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

const groupByUser = (statuses) => {
  const map = {};
  statuses.forEach((s) => {
    const uid = s.user?._id;
    if (!uid) return;
    if (!map[uid]) map[uid] = { user: s.user, statuses: [] };
    map[uid].statuses.push(s);
  });
  return Object.values(map);
};

const StatusList = ({ currentUser }) => {
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [viewing, setViewing]         = useState(null);
  const { socket } = useSocketContext();

  const fetchStatuses = async () => {
    try {
      const data = await getStatuses();
      const list = Array.isArray(data) ? data : data?.statuses ?? [];
      setGroups(groupByUser(list));
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatuses(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join-status-room");

    const onNewStatus = (newStatus) => {
      setGroups((prev) => {
        const uid = newStatus.user?._id;
        if (!uid) return prev;
        const existing = prev.find((g) => g.user._id === uid);
        if (existing) {
          return prev.map((g) =>
            g.user._id === uid ? { ...g, statuses: [newStatus, ...g.statuses] } : g
          );
        }
        return [{ user: newStatus.user, statuses: [newStatus] }, ...prev];
      });
    };

    const onStatusViewed = ({ statusId, viewerId }) => {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          statuses: g.statuses.map((s) =>
            s._id === statusId
              ? { ...s, viewers: [...(s.viewers || []), { userId: viewerId }] }
              : s
          ),
        }))
      );
    };

    socket.on("new-status",    onNewStatus);
    socket.on("status-viewed", onStatusViewed);
    return () => {
      socket.off("new-status",    onNewStatus);
      socket.off("status-viewed", onStatusViewed);
    };
  }, [socket]);

  const hasUnviewed = (group) =>
    group.statuses.some(
      (s) =>
        s.user?._id !== currentUser?._id &&
        !s.viewers?.some((v) => (v.userId?._id || v.userId) === currentUser?._id)
    );

  const formatTime = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const myGroup     = groups.find((g) => g.user._id === currentUser?._id);
  const otherGroups = groups.filter((g) => g.user._id !== currentUser?._id);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* My Status */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          My Status
        </p>
        <button onClick={() => setShowCreator(true)} className="flex items-center gap-3 w-full">
          <div className="relative flex-shrink-0">
            <img
              src={currentUser?.avatar || DEFAULT_AVATAR}
              alt="me"
              className={`w-12 h-12 rounded-full object-cover ${myGroup ? "ring-2 ring-blue-500" : "ring-2 ring-gray-200 dark:ring-gray-600"}`}
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
              <Plus size={10} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">My Status</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {myGroup
                ? `${myGroup.statuses.length} update${myGroup.statuses.length !== 1 ? "s" : ""} · ${formatTime(myGroup.statuses[0].createdAt)}`
                : "Tap to add status update"}
            </p>
          </div>
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 mx-4" />

      {/* Recent Updates */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="medium" />
          </div>
        ) : otherGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No recent updates from contacts</p>
          </div>
        ) : (
          <>
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Recent Updates
            </p>
            {otherGroups.map((group) => {
              const unviewed = hasUnviewed(group);
              const latest   = group.statuses[0];
              return (
                <button
                  key={group.user._id}
                  onClick={() => setViewing(group)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={group.user.avatar || DEFAULT_AVATAR}
                      alt={group.user.fullname}
                      className={`w-12 h-12 rounded-full object-cover ${unviewed ? "ring-2 ring-green-500" : "ring-2 ring-gray-200 dark:ring-gray-600"}`}
                      onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    {unviewed && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{group.user.fullname}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTime(latest.createdAt)}
                      {group.statuses.length > 1 && ` · ${group.statuses.length} updates`}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {latest.mediaType === "video" ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">▶</div>
                    ) : (
                      <img src={latest.media} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      <StatusCreator isOpen={showCreator} onClose={() => { setShowCreator(false); fetchStatuses(); }} />
      {viewing && <StatusViewer statusGroup={viewing} currentUserId={currentUser?._id} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default StatusList;
