import { useEffect, useState } from "react";
import axios from "axios";
import { useSocketContext } from "../context/SocketContext";
import { useAuth } from "../context/AuthProvider";
import { UserPlus, Heart, Check, ArrowLeft } from "react-feather";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authUser] = useAuth();
  const { socket } = useSocketContext();
  const navigate = useNavigate();

  const token = (() => { try { return JSON.parse(localStorage.getItem("token")); } catch { return null; } })();
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/notifications`, { headers });
      setNotifications(res.data || []);
    } catch (_) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requesterId, type) => {
    try {
      const endpoint = type === "accept" ? "/api/user/accept" : "/api/user/reject";
      await axios.post(`${BASE_URL}${endpoint}`, { requesterId }, { headers: { ...headers, "Content-Type": "application/json" } });

      if (socket && authUser?.user?._id) {
        socket.emit(type === "accept" ? "follow-accepted" : "follow-rejected", {
          fromUserId: requesterId,
          toUserId: authUser.user._id,
        });
      }

      toast.success(type === "accept" ? "Follow request accepted" : "Request declined");
      fetchNotifications();
    } catch (_) {
      toast.error("Action failed");
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (!socket) return;

    const onNewRequest = () => fetchNotifications();
    const onAccepted  = (d) => toast.success(`${d.by} accepted your follow request`);
    const onRejected  = (d) => toast(`${d.by} declined your follow request`, { icon: "👋" });

    socket.on("new-follow-request",      onNewRequest);
    socket.on("follow-request-accepted", onAccepted);
    socket.on("follow-request-rejected", onRejected);

    return () => {
      socket.off("new-follow-request",      onNewRequest);
      socket.off("follow-request-accepted", onAccepted);
      socket.off("follow-request-rejected", onRejected);
    };
  }, [socket]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)     return "Just now";
    if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}w`;
  };

  const getIcon = (type) => {
    if (type === "follow-request") return <UserPlus size={16} className="text-blue-500" />;
    if (type === "like")           return <Heart size={16} className="text-red-500" />;
    return <Check size={16} className="text-green-500" />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
              <Heart size={24} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No notifications yet</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm">When you have notifications, they'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.seen ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {n.from?.avatar ? (
                      <img src={n.from.avatar} alt={n.from.fullname} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold text-lg">
                        {n.from?.fullname?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{n.from?.fullname}</span>{" "}
                    {n.type === "follow-request" ? "requested to follow you" : n.message || "sent you a notification"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatTime(n.createdAt)}</p>
                </div>

                {/* Actions */}
                {n.type === "follow-request" && n.from && n.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(n.from._id, "accept")}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleAction(n.from._id, "reject")}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
