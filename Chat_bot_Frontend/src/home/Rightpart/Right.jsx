import React from "react";
import Chatuser from "./Chatuser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import useConversation from "../../statemanage/useConversation";
import { useAuth } from "../../context/AuthProvider";
import { BsChatDotsFill } from "react-icons/bs";

function Right({ activeTab }) {
  const { selectedConversation } = useConversation();

  return (
    <div className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 h-screen flex flex-col">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          <Chatuser />
          <Messages />
          <Typesend />
        </>
      )}
    </div>
  );
}

const NoChatSelected = () => {
  const [authUser] = useAuth();
  const firstName = authUser?.user?.fullname?.split(" ")[0] || authUser?.fullname?.split(" ")[0] || "there";

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-6 text-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-5 max-w-sm">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <BsChatDotsFill className="text-blue-500 dark:text-blue-400 text-4xl" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Hey, {firstName}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
            Pick a conversation from the left to start messaging. Your chats are end-to-end encrypted.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-green-700 dark:text-green-400 text-xs font-medium">
            End-to-end encrypted
          </span>
        </div>
      </div>
    </div>
  );
};

export default Right;