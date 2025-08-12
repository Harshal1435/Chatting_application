import { useEffect, useState } from "react";
import axios from "axios";
import { useSocketContext } from "../context/SocketContext";
import { Check, Heart, UserPlus, X } from "react-feather"; // You'll need to install react-icons
import { useAuth } from "../context/AuthProvider";
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
 
  const [authUser] = useAuth();
  const { socket } = useSocketContext();
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
 const token = JSON.parse(localStorage.getItem("token"));
  const fetchNotifications = async () => {
    try {
     
      const res = await axios.get(`${BASE_URL}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Notifications fetched:", res.data);
      
      setNotifications(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    }
  };

const handleAction = async (requesterId, type) => {
  try {
   
    const endpoint = type === "accept" 
      ? "/api/user/accept" 
      : "/api/user/reject";

    await axios.post(
      BASE_URL + endpoint,
      { requesterId }, // ✅ cleaner payload
      { headers: { Authorization: `Bearer ${token}` } }
    );

  if (socket && authUser?.user?._id) {
  socket.emit(
    type === "accept" ? "follow-accepted" : "follow-rejected",
    {
      fromUserId: requesterId,
      toUserId: authUser?.user?._id,
    }
  );
} else {
  console.warn("authUser?.user is missing, cannot emit socket event");
}


    fetchNotifications();
  } catch (err) {
    console.error("❌ Action error:", err?.response?.data || err.message);
  }
};



  useEffect(() => {
    fetchNotifications();

    if (!socket) return;

    socket.on("new-follow-request", (data) => {
      fetchNotifications();
    });

    socket.on("follow-request-accepted", (data) => {
      alert(`${data.by} accepted your follow request`);
    });

    socket.on("follow-request-rejected", (data) => {
      alert(`${data.by} rejected your follow request`);
    });

    return () => {
      socket.off("new-follow-request");
      socket.off("follow-request-accepted");
      socket.off("follow-request-rejected");
    };
  }, [socket]);

  // Function to format time like Instagram (e.g., "2h", "1d", "5w")
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "follow-request":
        return <UserPlus size={18} className="text-gray-800" />;
      case "like":
        return <Heart size={18} className="text-red-500" />;
      default:
        return <Check size={18} className="text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto bg-white">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
            <Heart size={24} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
          <p className="text-gray-500 text-center max-w-[300px]">
            When you have notifications, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((n, idx) => (
            <div
              key={idx}
              className="p-4 flex items-center hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  {n.from?.avatar ? (
                    <img 
                      src={n.from.avatar} 
                      alt={n.from.fullname} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <UserPlus size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex items-center">
                  <span className="font-semibold mr-1">{n.from?.fullname}</span>
                  {getNotificationIcon(n.type)}
                </div>
                <p className="text-sm text-gray-500">
                  {n.type === "follow-request" 
                    ? "requested to follow you" 
                    : n.message || "sent you a notification"}
                </p>
                <span className="text-xs text-gray-400">
                  {formatTime(n.timestamp)}
                </span>
              </div>

              {n.type === "follow-request" && n.from && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleAction(n.from._id, "accept")}
                    className="px-4 py-1 bg-blue-500 text-white text-sm font-semibold rounded"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleAction(n.from._id, "reject")}
                    className="px-4 py-1 bg-gray-200 text-gray-800 text-sm font-semibold rounded"
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
  );
};

export default Notifications;