// src/components/modals/CallModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { useCallContext } from "../context/CallContext";
import { FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";

const CallModal = () => {
  const {
    activeCall,
    callType,
    localStream,
    remoteStream,
    endCall,
    toggleVideo,
    toggleMute,
    toggleScreenShare,
    isScreenSharing,
    isVideoOn,
    isMuted,
    remoteUserId,
  } = useCallContext();

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [timer, setTimer] = useState("00:00");
  const [callDuration, setCallDuration] = useState(0);

  // Update streams
  useEffect(() => {
    if (localRef.current && localStream.current) localRef.current.srcObject = localStream.current;
    if (remoteRef.current && remoteStream.current) remoteRef.current.srcObject = remoteStream.current;
  }, [localStream.current, remoteStream.current]);

  // Timer
  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  useEffect(() => {
    const min = Math.floor(callDuration / 60).toString().padStart(2, "0");
    const sec = (callDuration % 60).toString().padStart(2, "0");
    setTimer(`${min}:${sec}`);
  }, [callDuration]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 text-white p-4">
      {/* Video/Audio */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="relative w-full max-w-2xl h-64 md:h-96 bg-gray-800 rounded-xl overflow-hidden">
          {callType === "video" && (
            <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          {callType === "audio" && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-xl">{remoteUserId}</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-24 right-4 w-32 h-48 md:w-40 md:h-60 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          {callType === "video" && (
            <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6">
        {/* Mute */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? "bg-red-600" : "bg-gray-700"} hover:bg-gray-600 transition`}
        >
          {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>

        {/* Video */}
        {callType === "video" && (
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${!isVideoOn ? "bg-red-600" : "bg-gray-700"} hover:bg-gray-600 transition`}
          >
            {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
          </button>
        )}

        {/* Screen Share */}
        {callType === "video" && (
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${isScreenSharing ? "bg-blue-600" : "bg-gray-700"} hover:bg-gray-600 transition`}
          >
            {isScreenSharing ? <MdStopScreenShare size={20} /> : <MdScreenShare size={20} />}
          </button>
        )}

        {/* End Call */}
        <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition">
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
};

export default CallModal;
