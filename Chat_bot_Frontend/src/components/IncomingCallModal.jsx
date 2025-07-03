// src/components/modals/IncomingCallModal.jsx
import React, { useEffect, useState } from "react";
import { useCallContext } from "../context/CallContext"; // ✅ update path if needed
import { FaPhoneAlt, FaPhoneSlash } from "react-icons/fa";
import { BsCameraVideoFill, BsMicFill } from "react-icons/bs";

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCallContext();
  const [ringing, setRinging] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setRinging((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if(incomingCall ) {
    console.log("Incoming call:", incomingCall);
  } else {
    console.log("No incoming call");
  }


  if (!incomingCall) return null;

  const callerName = incomingCall.fullname || incomingCall.from || "Unknown";
  const callType = incomingCall.callType || "audio";

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-center shadow-2xl w-full max-w-md animate-fade-in">
        {/* Avatar */}
        <div className="relative mx-auto mb-6">
          <div
            className={`w-32 h-32 rounded-full bg-indigo-900 flex items-center justify-center mx-auto transition-all duration-300 ${
              ringing ? "ring-4 ring-opacity-80 ring-indigo-500" : "ring-2 ring-opacity-60 ring-indigo-400"
            }`}
          >
            {incomingCall.photo ? (
              <img
                src={incomingCall.photo}
                alt={callerName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-white">
                {callerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Call type badge */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-3 py-1 rounded-full border border-gray-700 flex items-center">
            {callType === "video" ? (
              <BsCameraVideoFill className="text-indigo-400 mr-1" />
            ) : (
              <BsMicFill className="text-indigo-400 mr-1" />
            )}
            <span className="text-xs text-gray-300 font-medium">{callType} call</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
        <p className="text-gray-400 mb-8">is calling...</p>

        {/* Call Controls */}
        <div className="flex justify-center gap-6">
          <button
            onClick={rejectCall}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-red-500/30 flex flex-col items-center"
          >
            <FaPhoneSlash className="text-2xl" />
            <span className="text-xs mt-1">Decline</span>
          </button>
          <button
            onClick={acceptCall}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-green-500/30 flex flex-col items-center"
          >
            <FaPhoneAlt className="text-2xl" />
            <span className="text-xs mt-1">Accept</span>
          </button>
        </div>

        {/* Wave animation */}
        <div className="mt-8 relative h-4 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-indigo-900/30 rounded-full">
            <div className="absolute top-0 left-0 h-full w-full bg-indigo-500/30 rounded-full animate-wave"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
