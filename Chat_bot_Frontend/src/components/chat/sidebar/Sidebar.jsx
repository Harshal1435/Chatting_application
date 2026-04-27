import { useNavigate } from "react-router-dom";
import { Bell, User, MessageSquare, RefreshCw, Settings, Moon, Sun, Lock } from "lucide-react";
import UserList from "./UserList";
import StatusList from "../../status/StatusList";
import Logout from "../../ui/Logout";
import ThemeToggle from "../../ui/ThemeToggle";
import { useAuth } from "../../../context/AuthProvider";
import { useTheme } from "../../../context/ThemeContext";

const tabs = [
  { id: "chats", name: "Chats", icon: MessageSquare },
  { id: "updates", name: "Updates", icon: RefreshCw },
  { id: "settings", name: "Settings", icon: Settings },
];

function Left({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const [authUser] = useAuth();
  const currentUser = authUser?.user;

  const renderContent = () => {
    switch (activeTab) {
      case "updates":
        return <StatusList currentUser={currentUser} />;
      case "settings":
        return <SettingsPanel />;
      case "chats":
      default:
        return <UserList />;
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

// ── Settings Panel ────────────────────────────────────────────────────────────
const SettingsPanel = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [authUser] = useAuth();
  const currentUser = authUser?.user;

  const rows = [
    {
      label: "Theme",
      desc: theme === "dark" ? "Dark mode on" : "Light mode on",
      icon: theme === "dark" ? <Moon size={18} /> : <Sun size={18} />,
      action: toggleTheme,
    },
    {
      label: "My Profile",
      desc: "View and edit your profile",
      icon: <User size={18} />,
      action: () => navigate(`/profile/${currentUser?._id}`),
    },
    {
      label: "Privacy",
      desc: "Manage account privacy",
      icon: <Lock size={18} />,
      action: () => navigate(`/profile/${currentUser?._id}`),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 px-2 py-3 gap-1">
      {/* Profile card */}
      <button
        onClick={() => navigate(`/profile/${currentUser?._id}`)}
        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors mb-2"
      >
        <img
          src={currentUser?.avatar || "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png"}
          alt={currentUser?.fullname}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => { e.target.src = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png"; }}
        />
        <div className="text-left">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{currentUser?.fullname}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{currentUser?.email}</p>
        </div>
      </button>

      <div className="border-t border-gray-100 dark:border-gray-700 mb-2" />

      {rows.map((row) => (
        <button
          key={row.label}
          onClick={row.action}
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0">
            {row.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{row.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};