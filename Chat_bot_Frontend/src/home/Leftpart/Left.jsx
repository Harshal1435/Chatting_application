import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, MessageSquare, RefreshCw, Settings } from "lucide-react";

import Users from "./Users";
import Updates from "../../components/Status/StatusList";
import Logout from "../../components/Logout";
import ThemeToggle from "../../components/ThemeToggle";

const tabs = [
  { id: "chats", name: "Chats", icon: MessageSquare },
  { id: "updates", name: "Updates", icon: RefreshCw },
  { id: "settings", name: "Settings", icon: Settings },
];

function Left({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("ChatApp"))?.user;

  const renderContent = () => {
    switch (activeTab) {
      case "updates":
        return <Updates />;
      case "settings":
        return <Updates />;
      case "chats":
      default:
        return <Users />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {activeTab === "updates" ? "Updates" : activeTab === "settings" ? "Settings" : "Messages"}
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/notifications")}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/profile/${currentUser?._id}`)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-500 transition-colors"
            title="My Profile"
          >
            <User className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <Logout />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex px-2 gap-1 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

export default Left;
