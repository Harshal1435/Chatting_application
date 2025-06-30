import React, { useEffect } from "react";
import Chatuser from "./Chatuser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import useConversation from "../../statemanage/useConversation.js";
import { useAuth } from "../../context/AuthProvider.jsx";
import { CiMenuFries } from "react-icons/ci";

function Right() {
  const { selectedConversation, setSelectedConversation } = useConversation();

  // Cleanup on unmount
  useEffect(() => {
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  return (
    <div className="w-full bg-slate-900 text-gray-300 h-screen flex flex-col">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          <Chatuser />
          <div className="flex-1 overflow-y-auto">
            <Messages />
          </div>
          <Typesend />
        </>
      )}
    </div>
  );
}

export default Right;

const NoChatSelected = () => {
  const [authUser] = useAuth();

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center px-4 text-center">
      {/* Hamburger menu only visible on small screens */}
      <label
        htmlFor="my-drawer-2"
        className="btn btn-ghost drawer-button lg:hidden absolute top-4 left-4"
      >
        <CiMenuFries className="text-white text-2xl" />
      </label>

      <h1 className="text-lg sm:text-xl text-gray-400">
        Welcome{" "}
        <span className="font-semibold text-white">{authUser.fullname}</span>
        <br />
        <span className="text-sm sm:text-base">
          No chat selected. Please choose someone from your contacts to start
          chatting 💬
        </span>
      </h1>
    </div>
  );
};
