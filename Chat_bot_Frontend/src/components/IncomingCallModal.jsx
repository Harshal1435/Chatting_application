// ✅ IncomingCallModal.jsx — Displays incoming call with accept/reject
import React from "react";
import { useCallContext } from "../context/CallContext";

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, endCall } = useCallContext();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl text-center shadow-2xl w-80">
        <h2 className="text-xl font-bold mb-2">Incoming {incomingCall.callType} Call</h2>
        <p className="text-gray-700 mb-4">From: {incomingCall.from}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={acceptCall}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md"
          >
            Accept
          </button>
          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;