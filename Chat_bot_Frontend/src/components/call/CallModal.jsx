import React, { useEffect, useRef, useState } from "react";
import { useCallContext } from "../../context/CallContext";
import {
  FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
  FaVideo, FaVideoSlash,
} from "react-icons/fa";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

const CallModal = () => {
  const {
    activeCall, callType, callStatus,
    localStream, remoteStream,
    endCall, toggleVideo, toggleMute, toggleScreenShare,
    isScreenSharing, isVideoOn, isMuted,
    remoteUserId, callDuration, isCaller,
  } = useCallContext();

  const localRef  = useRef(null);
  const remoteRef = useRef(null);

  // Attach streams whenever refs or streams change
  useEffect(() => {
    if (localRef.current && localStream.current) {
      localRef.current.srcObject = localStream.current;
    }
  });

  useEffect(() => {
    if (remoteRef.current && remoteStream.current) {
      remoteRef.current.srcObject = remoteStream.current;
    }
  });

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!activeCall) return null;

  const isVideo = callType === "video";
  const statusLabel =
    callStatus === "ringing" ? (isCaller ? "Calling…" : "Incoming…") :
    callStatus === "ongoing"  ? formatDuration(callDuration) : "Connecting…";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col"
      >
        {/* ── Remote video / audio placeholder ── */}
        <div className="flex-1 relative flex items-center justify-center bg-gray-900">
          {isVideo ? (
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-5xl font-bold text-white">
                {remoteUserId?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <p className="text-white text-xl font-semibold">{remoteUserId}</p>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            {statusLabel}
          </div>

          {/* Local video PiP */}
          {isVideo && (
            <div className="absolute bottom-4 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-gray-800">
              <video
                ref={localRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <FaVideoSlash className="text-gray-400 text-2xl" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-center gap-5 py-6 bg-gray-950">
          {/* Mute */}
          <ControlBtn
            onClick={toggleMute}
            active={isMuted}
            activeColor="bg-red-600"
            label={isMuted ? "Unmute" : "Mute"}
            icon={isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          />

          {/* Video toggle */}
          {isVideo && (
            <ControlBtn
              onClick={toggleVideo}
              active={!isVideoOn}
              activeColor="bg-red-600"
              label={isVideoOn ? "Hide" : "Show"}
              icon={isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            />
          )}

          {/* Screen share */}
          {isVideo && (
            <ControlBtn
              onClick={() => toggleScreenShare(!isScreenSharing)}
              active={isScreenSharing}
              activeColor="bg-blue-600"
              label={isScreenSharing ? "Stop" : "Share"}
              icon={isScreenSharing ? <MdStopScreenShare size={22} /> : <MdScreenShare size={22} />}
            />
          )}

          {/* End call */}
          <button
            onClick={endCall}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg">
              <FaPhoneSlash size={22} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">End</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ControlBtn = ({ onClick, active, activeColor, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${active ? activeColor : "bg-gray-700 hover:bg-gray-600"}`}>
      <span className="text-white">{icon}</span>
    </div>
    <span className="text-xs text-gray-400">{label}</span>
  </button>
);

export default CallModal;
