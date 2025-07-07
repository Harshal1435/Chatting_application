import React from "react";
import Chatuser from "./Chatuser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import useConversation from "../../statemanage/useConversation";
import { useAuth } from "../../context/AuthProvider";
import { CiMenuFries } from "react-icons/ci";
import { BsChatSquareText } from "react-icons/bs";
import StatusViewer from "../../components/Status/StatusViewer"; // New component for status tab
 // New component for settings tab

function Right({ activeTab }) {
  const { selectedConversation } = useConversation();

  const renderContent = () => {
    switch (activeTab) {
     
      case "chats":
      default:
        return !selectedConversation ? (
          <NoChatSelected />
        ) : (
          <>
            <Chatuser />
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-700">
              <Messages />
            </div>
            <Typesend />
          </>
        );
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 h-screen flex flex-col border-l border-gray-200 dark:border-gray-700">
      {renderContent()}
    </div>
  );
}

const NoChatSelected = () => {
  const [authUser] = useAuth();

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button lg:hidden absolute top-4 left-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        <CiMenuFries className="text-gray-600 dark:text-gray-300 text-2xl" />
      </label>

      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-blue-100 dark:bg-gray-600 rounded-full">
          <BsChatSquareText className="text-blue-500 dark:text-blue-400 text-4xl" />
        </div>
        
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200">
          Welcome, <span className="text-blue-600 dark:text-blue-400">{authUser.fullname}</span>
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Select a conversation from your contacts to start messaging
        </p>
        
        <div className="text-blue-500 dark:text-blue-400 animate-bounce mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Right;