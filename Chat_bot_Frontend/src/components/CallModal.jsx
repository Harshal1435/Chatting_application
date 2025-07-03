import React, { useEffect, useRef, useState } from "react";
import { useCallContext } from "../context/CallContext";
import { FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { useAuth } from "../context/AuthProvider";

const CallModal = () => {
  const {
    activeCall,
    callType,
    localStream,
    remoteStream,
    endCall,
    isCaller,
    callDuration,
    callStatus,
    toggleVideo,
    toggleMute,
    remoteUserId,
    toggleScreenShare,
    isScreenSharing,
  } = useCallContext();

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState("00:00");
  const [authUser] = useAuth();
  const [isScreenShareLoading, setIsScreenShareLoading] = useState(false);

  // Format call duration
  useEffect(() => {
    const minutes = Math.floor(callDuration / 60).toString().padStart(2, '0');
    const seconds = (callDuration % 60).toString().padStart(2, '0');
    setTimer(`${minutes}:${seconds}`);
  }, [callDuration]);

  // Handle stream changes
  useEffect(() => {
    const setupStreams = () => {
      if (localRef.current && localStream.current) {
        localRef.current.srcObject = localStream.current;
      }
      if (remoteRef.current && remoteStream.current) {
        remoteRef.current.srcObject = remoteStream.current;
      }
    };

    setupStreams();

    // Handle track additions to remote stream
    const handleTrackAdded = (event) => {
      if (remoteRef.current) {
        remoteRef.current.srcObject = event.streams[0];
      }
    };

    if (remoteStream.current) {
      remoteStream.current.addEventListener('addtrack', handleTrackAdded);
    }

    return () => {
      if (remoteStream.current) {
        remoteStream.current.removeEventListener('addtrack', handleTrackAdded);
      }
    };
  }, [localStream.current, remoteStream.current]);

  // Handle screen sharing
  const handleScreenShare = async () => {
    setIsScreenShareLoading(true);
    try {
      await toggleScreenShare(!isScreenSharing);
    } catch (error) {
      console.error("Screen share error:", error);
    } finally {
      setIsScreenShareLoading(false);
    }
  };

  // Toggle video with state sync
  const handleToggleVideo = () => {
    const newState = !isVideoOn;
    toggleVideo(newState);
    setIsVideoOn(newState);
  };

  // Toggle mute with state sync
  const handleToggleMute = () => {
    const newState = !isMuted;
    toggleMute(newState);
    setIsMuted(newState);
  };

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 text-white p-4">
      {/* Call header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            callStatus === 'ongoing' ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="font-medium">
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </span>
          <span className="text-gray-300">{timer}</span>
        </div>
        <div className="text-gray-300">
          {isCaller ? 'Calling...' : `Incoming from ${remoteUserId}`}
        </div>
      </div>

      {/* Video/Audio containers */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-center gap-4">
        {/* Remote stream */}
        <div className="relative w-full max-w-2xl h-64 md:h-96  rounded-xl overflow-hidden">
          {callType === "video" ? (
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">
                  {remoteUserId?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-xl">{remoteUserId}</p>
            </div>
          )}
        </div>

        {/* Local stream */}
        <div className="absolute bottom-24 right-4 w-32 h-48 md:w-40 md:h-60 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          {callType === "video" ? (
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-indigo-700">
              <span className="text-2xl">
                {authUser?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Call controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6">
        {/* Mute button */}
        <button
          onClick={handleToggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'} hover:bg-gray-600 transition`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        </button>

        {/* Video toggle (only for video calls) */}
        {callType === "video" && (
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full ${!isVideoOn ? 'bg-red-600' : 'bg-gray-700'} hover:bg-gray-600 transition`}
            aria-label={isVideoOn ? "Turn off video" : "Turn on video"}
          >
            {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
          </button>
        )}

        {/* Screen share (only for video calls) */}
        {callType === "video" && (
          <button
            onClick={handleScreenShare}
            disabled={isScreenShareLoading || !isVideoOn}
            className={`p-3 rounded-full ${
              isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'
            } hover:bg-gray-600 transition ${
              isScreenShareLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={isScreenSharing ? "Stop screen share" : "Share screen"}
          >
            {isScreenSharing ? <MdStopScreenShare size={20} /> : <MdScreenShare size={20} />}
          </button>
        )}

        {/* End call button */}
        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition"
          aria-label="End call"
        >
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
};

export default CallModal;