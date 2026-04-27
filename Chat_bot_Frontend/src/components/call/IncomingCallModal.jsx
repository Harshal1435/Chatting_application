import React, { useEffect, useRef, useState } from "react";
import { useCallContext } from "../../context/CallContext";
import { FaPhoneAlt, FaPhoneSlash } from "react-icons/fa";
import { BsCameraVideoFill, BsMicFill } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, rejectCall } = useCallContext();
  const ringRef = useRef(null);
  const [callerInfo, setCallerInfo] = useState(null);

  // Look up caller info from localStorage users cache
  useEffect(() => {
    if (!incomingCall) return;
    try {
      const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
      const found = allUsers.find((u) => u._id === incomingCall.from);
      setCallerInfo(found || null);
    } catch (_) {}
  }, [incomingCall]);

  // Play ringtone
  useEffect(() => {
    if (!incomingCall) return;
    ringRef.current = new Audio("/ringtone.mp3");
    ringRef.current.loop = true;
    ringRef.current.play().catch(() => {});
    return () => {
      ringRef.current?.pause();
      ringRef.current = null;
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const callerName = callerInfo?.fullname || "Unknown Caller";
  const callerAvatar = callerInfo?.avatar || DEFAULT_AVATAR;
  const callType = incomingCall.callType || "audio";

  const handleAccept = () => {
    ringRef.current?.pause();
    acceptCall();
  };

  const handleReject = () => {
    ringRef.current?.pause();
    rejectCall();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-white/10">
          {/* Pulsing avatar */}
          <div className="relative mx-auto w-28 h-28 mb-5">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <img
              src={callerAvatar}
              alt={callerName}
              className="w-28 h-28 rounded-full object-cover border-4 border-green-500/50 relative z-10"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
          </div>

          {/* Call type badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 mb-3">
            {callType === "video"
              ? <BsCameraVideoFill className="text-blue-400" />
              : <BsMicFill className="text-green-400" />}
            {callType === "video" ? "Video call" : "Voice call"}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
          <p className="text-gray-400 text-sm mb-8">Incoming {callType} call…</p>

          {/* Buttons */}
          <div className="flex justify-center gap-10">
            <button
              onClick={handleReject}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-700 flex items-center justify-center transition-all shadow-lg shadow-red-600/30">
                <FaPhoneSlash className="text-white text-2xl" />
              </div>
              <span className="text-gray-400 text-xs">Decline</span>
            </button>

            <button
              onClick={handleAccept}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 group-hover:bg-green-600 flex items-center justify-center transition-all shadow-lg shadow-green-500/30 animate-bounce">
                <FaPhoneAlt className="text-white text-2xl" />
              </div>
              <span className="text-gray-400 text-xs">Accept</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallModal;
