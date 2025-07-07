"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Check, X } from "lucide-react";
import { useSocketContext } from "../../context/SocketContext";
import StatusCreator from "./StatusCreator";
import StatusViewer from "./StatusViewer";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";

const StatusList = ({ currentUsers }) => {
  const [statuses, setStatuses] = useState([]);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewedStatusIds, setViewedStatusIds] = useState(new Set());

  const { socket } = useSocketContext();
  const { authUser } = useAuth();
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const currentUsers1 = localStorage.getItem("ChatApp").user
  console.log("status::",currentUsers1)
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
        if (status.viewers?.some(v => v.userId === currentUsers1?._id)) {
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
      if (viewerId === currentUsers1?._id) {
        setViewedStatusIds(prev => new Set(prev).add(statusId));
      }
    });

    return () => {
      socket.off("new-status");
      socket.off("status-viewed");
    };
  }, [socket, currentUsers1]);

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    
    // Mark as viewed if not already
    if (!viewedStatusIds.has(status._id) && 
        status.user?._id !== currentUsers1?._id && 
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
      if (!viewedStatusIds.has(status._id) && user._id !== currentUsers1?._id) {
        grouped[user._id].hasUnviewed = true;
      }
    });
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const groupedStatuses = groupStatusesByUser();

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Status</h2>
      </div>

      {/* My Status */}
      <div 
        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setShowCreator(true)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 ring-2 ring-blue-500">
              {currentUsers1?.avatar ? (
                <img
                  src={currentUsers1.avatar}
                  alt={currentUsers1.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {currentUsers1?.fullname?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
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
        <div className="divide-y divide-gray-100">
          <div className="p-3 bg-gray-50">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recent updates
            </h3>
          </div>
          {groupedStatuses.map(({ user, statuses: userStatuses, hasUnviewed }) => (
            <div
              key={user._id}
              onClick={() => handleStatusClick(userStatuses[0])}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
            >
              <div className={`relative mr-3 ${hasUnviewed ? "ring-2 ring-green-500" : "ring-1 ring-gray-300"} rounded-full`}>
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {user.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {hasUnviewed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
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
              <div className="flex items-center text-gray-400">
                {userStatuses[0].viewers?.length > 0 && (
                  <>
                    <Eye size={14} className="mr-1" />
                    <span className="text-xs">
                      {userStatuses[0].viewers.length}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
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
          currentUsers1={currentUsers1}
        />
      )}
    </div>
  );
};

export default StatusList;