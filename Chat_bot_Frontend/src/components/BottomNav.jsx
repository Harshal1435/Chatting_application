import { MessageSquare, Users, Phone, Settings ,Moon,Sun} from "lucide-react";
import { BsPeopleFill, BsCameraVideo } from "react-icons/bs";
import { FaCircle, FaMicrophone } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link, useLocation } from "react-router-dom";

const BottomNav = ({ unreadCount = 0 }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const tabs = [
    {
      name: "Chats",
      icon: <MessageSquare size={22} />,
      activeIcon: <MessageSquare size={22} className="text-green-500" />,
      badge: unreadCount > 0 ? unreadCount : null,
      to: "/",
    },
    {
      name: "Updates",
      icon: (
        <div className="relative">
          <Users size={22} />
          {unreadCount > 0 && (
            <FaCircle className="absolute -top-1 -right-1 text-green-500 text-xs" />
          )}
        </div>
      ),
      activeIcon: (
        <div className="relative">
          <Users size={22} className="text-green-500" />
          {unreadCount > 0 && (
            <FaCircle className="absolute -top-1 -right-1 text-green-500 text-xs" />
          )}
        </div>
      ),
      to: "/status",
    },
    {
      name: "Communities",
      icon: <BsPeopleFill size={20} />,
      activeIcon: <BsPeopleFill size={20} className="text-green-500" />,
      to: "/communities",
    },
    {
      name: "Calls",
      icon: <Phone size={22} />,
      activeIcon: <Phone size={22} className="text-green-500" />,
      to: "/calls",
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center py-2">
          {tabs.map((tab, index) => (
            <Link
              to={tab.to}
              key={index}
              className={`flex flex-col items-center justify-center relative px-2 py-1 ${
                isActive(tab.to) ? "text-green-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {isActive(tab.to) ? tab.activeIcon : tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              <span className="text-[10px] mt-1">{tab.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Side Navigation */}
      <div className="hidden md:flex flex-col w-24 lg:w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 overflow-y-auto">
          {tabs.map((tab, index) => (
            <Link
              to={tab.to}
              key={index}
              className={`flex items-center p-4 ${
                isActive(tab.to)
                  ? "bg-gray-100 dark:bg-gray-800 text-green-500"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="relative">
                {isActive(tab.to) ? tab.activeIcon : tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="ml-4 hidden lg:inline-block">{tab.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {theme === 'light' ? (
              <>
                <Moon size={20} />
                <span className="ml-4 hidden lg:inline-block">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={20} />
                <span className="ml-4 hidden lg:inline-block">Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Call Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 text-center">
            <div className="bg-green-100 dark:bg-green-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMicrophone size={30} className="text-green-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Voice Call</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Who would you like to call?
            </p>
            <button
              onClick={() => setShowVoiceModal(false)}
              className="bg-green-500 text-white px-4 py-2 rounded-full w-full"
            >
              Start Call
            </button>
            <button
              onClick={() => setShowVoiceModal(false)}
              className="mt-2 text-gray-500 dark:text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;