import { useState, useEffect } from "react";
import { Plus, Eye, Check, X } from "lucide-react";
import { useSocketContext } from "../../context/SocketContext";
import StatusCreator from "./StatusCreator";
import StatusViewer from "./StatusViewer";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";

const StatusList = ({ currentUser }) => {
  const [statuses, setStatuses] = useState([]);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewedStatusIds, setViewedStatusIds] = useState(new Set());

  const { socket } = useSocketContext();
  const { authUser } = useAuth();
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchStatuses = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("token"));
      const { data } = await axios.get(`${baseurl}/api/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allStatuses = Object.values(data).flat();
      setStatuses(allStatuses);
      
      // Track viewed statuses
      const viewedIds = new Set();
      allStatuses.forEach(status => {
        if (status.viewers?.some(v => v.userId === currentUser?._id)) {
          viewedIds.add(status._id);
        }
      });
      setViewedStatusIds(viewedIds);
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();

    if (!socket) return;

    socket.emit("join-status-room");

    socket.on("new-status", (newStatus) => {
      setStatuses(prev => [newStatus, ...prev]);
    });

    socket.on("status-viewed", ({ statusId, viewerId }) => {
      setStatuses(prev =>
        prev.map(status =>
          status._id === statusId
            ? {
                ...status,
                viewers: [...(status.viewers || []), { userId: viewerId }]
              }
            : status
        )
      );
      if (viewerId === currentUser?._id) {
        setViewedStatusIds(prev => new Set(prev).add(statusId));
      }
    });

    return () => {
      socket.off("new-status");
      socket.off("status-viewed");
    };
  }, [socket, currentUser]);

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    
    // Mark as viewed if not already
    if (!viewedStatusIds.has(status._id) && 
        status.user?._id !== currentUser?._id && 
        socket) {
      socket.emit("view-status", { statusId: status._id });
      setViewedStatusIds(prev => new Set(prev).add(status._id));
    }
  };

  const groupStatusesByUser = () => {
    const grouped = {};
    statuses.forEach((status) => {
      const user = status.user || status.userId;
      if (!user?._id) return;

      if (!grouped[user._id]) {
        grouped[user._id] = {
          user,
          statuses: [],
          hasUnviewed: false
        };
      }
      grouped[user._id].statuses.push(status);
      if (!viewedStatusIds.has(status._id) && user._id !== currentUser?._id) {
        grouped[user._id].hasUnviewed = true;
      }
    });
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 bg-[#f0f2f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00a884]"></div>
      </div>
    );
  }

  const groupedStatuses = groupStatusesByUser();

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="p-3 bg-[#f0f2f5] flex justify-between items-center border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Status</h2>
      </div>

      {/* My Status */}
      <div 
        className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
        onClick={() => setShowCreator(true)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-12 h-12 rounded-full overflow-hidden ${viewedStatusIds.size === 0 ? 'ring-2 ring-[#00a884]' : 'ring-1 ring-gray-300'}`}>
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#00a884] flex items-center justify-center text-white font-semibold">
                  {currentUser?.fullname?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center text-white">
              <Plus size={14} />
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-800">My Status</p>
            <p className="text-sm text-gray-500">Tap to add status update</p>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      {groupedStatuses.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 bg-[#f0f2f5]">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recent updates
            </h3>
          </div>
          {groupedStatuses.map(({ user, statuses: userStatuses, hasUnviewed }) => (
            <div
              key={user._id}
              onClick={() => handleStatusClick(userStatuses[0])}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            >
              <div className={`relative mr-3 ${hasUnviewed ? "ring-2 ring-[#00a884]" : "ring-1 ring-gray-300"} rounded-full`}>
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#00a884] flex items-center justify-center text-white font-semibold">
                      {user.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {hasUnviewed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00a884] rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullname}</p>
                <p className="text-sm text-gray-500 truncate">
                  {new Date(userStatuses[0].createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 bg-[#f0f2f5]">
          No status updates available
        </div>
      )}

      <StatusCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
      />

      {selectedStatus && (
        <StatusViewer
          status={selectedStatus}
          onClose={() => setSelectedStatus(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default StatusList;