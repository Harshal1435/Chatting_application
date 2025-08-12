import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";

import Search from "./Search";
import Users from "./Users";
import Updates from "../../components/Status/StatusList";

import Logout from "../../components/Logout";
import ThemeToggle from "../../components/ThemeToggle";

function Left({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  // ✅ Get user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("ChatApp"))?.user;

  const tabs = [
    { id: "chats", name: "Chats" },
    { id: "updates", name: "Updates" },
    { id: "settings", name: "Settings" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "updates":
        return <Updates />;
      case "settings":
        return <Updates />; // Replace with settings later
      case "chats":
      default:
        return (
          <>
            <Search />
            <Users />
          </>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
        <div className="flex p-4 justify-between items-center">
          <h1 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {activeTab === "updates"
              ? "Updates"
              : activeTab === "settings"
              ? "Settings"
              : "Chats"}
          </h1>

          <div className="flex items-center gap-3">
            {/* 🔔 Notifications */}
            <button
              onClick={() => navigate("/notifications")}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-500"
              title="Notifications"
            >
              <Bell className="w-6 h-6" />
            </button>

            {/* 👤 Profile */}
            <button
              onClick={() => navigate(`/profile/${currentUser?._id}`)}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-500"
              title="My Profile"
            >
              <User className="w-6 h-6" />
            </button>

            {/* 🌙 Theme */}
            <ThemeToggle />

            {/* 🔓 Logout */}
            <Logout />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center font-medium text-sm relative ${
                activeTab === tab.id
                  ? "text-gray-800 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-green-500 rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {renderContent()}
      </div>
    </div>
  );
}

export default Left;
