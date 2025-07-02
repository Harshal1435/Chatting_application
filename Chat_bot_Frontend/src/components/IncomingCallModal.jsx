import React from "react";
import { useCallContext } from "../context/CallContext";

const IncomingCallModal = () => {
  const { callState, remoteUser, acceptCall, declineCall, roomId } = useCallContext();

  if (callState !== "incoming") return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white p-6 rounded shadow text-center w-80">
        <h2 className="text-lg font-bold">Incoming Call</h2>
        <p className="text-gray-600">From: {remoteUser?.fullName}</p>
        <div className="mt-4 flex justify-around">
          <button onClick={() => acceptCall({ roomId, from: remoteUser })} className="bg-green-500 px-4 py-2 text-white rounded">
            Accept
          </button>
          <button onClick={declineCall} className="bg-red-500 px-4 py-2 text-white rounded">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
