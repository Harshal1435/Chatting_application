// src/components/modals/IncomingCallModal.jsx
import React from "react";
import { useCallContext } from "../context/CallContext.jsx";

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall, callType } = useCallContext();

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl text-center shadow-xl">
        <h2 className="text-xl font-bold mb-2">Incoming {callType} Call</h2>
        <p className="text-gray-700 mb-4">From: {incomingCall.from}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={acceptCall}
            className="bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Accept
          </button>
          <button
            onClick={rejectCall}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
