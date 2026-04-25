import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";
import {
  FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
  FaVideo, FaVideoSlash,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_1280.png";

// Single participant tile
const ParticipantTile = ({ userId, stream }) => {
  const videoRef = useRef(null);
  const allUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
  const user = allUsers.find((u) => u._id === userId);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video flex items-center justify-center">
      {stream && stream.getVideoTracks().length > 0 ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <img
            src={user?.avatar || DEFAULT_AVATAR}
            alt={user?.fullname || userId}
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
          />
          <span className="text-white text-sm font-medium">
            {user?.fullname || "Participant"}
          </span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
        {user?.fullname || "Participant"}
      </div>
    </div>
  );
};

// Local video tile
const LocalTile = ({ stream, isVideoOn }) => {
  const videoRef = useRef(null);
  const me = JSON.parse(localStorage.getItem("ChatApp"))?.user;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video flex items-center justify-center">
      {isVideoOn && stream ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <img
            src={me?.avatar || DEFAULT_AVATAR}
            alt="You"
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
          />
          <span className="text-white text-sm font-medium">You</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
        You
      </div>
    </div>
  );
};

const GroupCallModal = () => {
  const {
    inGroupCall, groupCallType, groupPeers, groupLocalStream,
    leaveGroupCall, toggleMute, toggleVideo, isMuted, isVideoOn,
  } = useCallContext();

  if (!inGroupCall) return null;

  const peers = Object.entries(groupPeers); // [[userId, { pc, stream }]]
  const totalTiles = peers.length + 1; // +1 for local

  const gridCols =
    totalTiles <= 1 ? "grid-cols-1" :
    totalTiles <= 2 ? "grid-cols-2" :
    totalTiles <= 4 ? "grid-cols-2" :
    "grid-cols-3";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold">Group {groupCallType === "video" ? "Video" : "Voice"} Call</h2>
            <p className="text-gray-400 text-xs">{totalTiles} participant{totalTiles !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Video grid */}
        <div className={`flex-1 grid ${gridCols} gap-2 p-4 overflow-auto`}>
          {/* Local tile */}
          <LocalTile stream={groupLocalStream.current} isVideoOn={isVideoOn} />

          {/* Remote tiles */}
          {peers.map(([userId, { stream }]) => (
            <ParticipantTile key={userId} userId={userId} stream={stream} />
          ))}

          {/* Empty state */}
          {peers.length === 0 && (
            <div className="flex items-center justify-center text-gray-500 text-sm col-span-full">
              Waiting for others to join…
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5 py-5 bg-gray-950 border-t border-white/10">
          <ControlBtn
            onClick={toggleMute}
            active={isMuted}
            activeColor="bg-red-600"
            label={isMuted ? "Unmute" : "Mute"}
            icon={isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
          />

          {groupCallType === "video" && (
            <ControlBtn
              onClick={toggleVideo}
              active={!isVideoOn}
              activeColor="bg-red-600"
              label={isVideoOn ? "Hide" : "Show"}
              icon={isVideoOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
            />
          )}

          <button onClick={leaveGroupCall} className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg">
              <FaPhoneSlash size={20} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">Leave</span>
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

export default GroupCallModal;
