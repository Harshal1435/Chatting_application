import React, { useEffect, useRef } from "react";
import Message from "./Message";
import useGetMessage from "../../context/useGetMessage.js";
import useGetSocketMessage from "../../context/useGetSocketMessage.js";
import useGetSocketSeenMessage from "../../context/useGetSocketSeenMessage.js";
import Loading from "../../components/Loading.jsx";

function Messages() {
  const { loading, messages } = useGetMessage();

  useGetSocketMessage();       // 🎧 Listen for incoming messages
  useGetSocketSeenMessage();  // 👁️ Update seen status

  const bottomRef = useRef();

  useEffect(() => {
    if (bottomRef.current) {
      setTimeout(() => {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto px-2 py-2"
      style={{ height: "calc(92vh - 8vh)" }}
    >
      {loading ? (
        <Loading />
      ) : messages?.length > 0 ? (
        <>
          {messages.map((msg, index) => (
            <div key={msg._id}>
              <Message message={msg} />
            </div>
          ))}
          <div ref={bottomRef} />
        </>
      ) : (
        <p className="text-center text-gray-400 mt-[20%]">
          Say hi 👋 to start the conversation
        </p>
      )}
    </div>
  );
}

export default Messages;
