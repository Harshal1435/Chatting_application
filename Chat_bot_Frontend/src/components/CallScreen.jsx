// src/components/CallScreen.jsx
import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";
import { useNavigate } from "react-router-dom";

const CallScreen = () => {
  const {
    activeCall,
    callType,
    localStream,
    remoteStream,
    endCall,
    remoteUserId,
    isVideoOn,
  } = useCallContext();

  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  // Set streams
  useEffect(() => {
    if (localRef.current && localStream.current) localRef.current.srcObject = localStream.current;
    if (remoteRef.current && remoteStream.current) remoteRef.current.srcObject = remoteStream.current;
  }, [localStream.current, remoteStream.current]);

  if (!activeCall) {
    navigate("/"); // Redirect if no active call
    return null;
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center relative">
      {/* Remote video/audio */}
      <div className="w-full h-full flex items-center justify-center">
        {callType === "video" ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <audio ref={remoteRef} autoPlay />
        )}

        {/* Local video small overlay */}
        {callType === "video" && isVideoOn && (
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-4 right-4 w-32 h-48 rounded-lg border-2 border-white shadow-lg"
          />
        )}
      </div>

      {/* End call button */}
      <button
        onClick={endCall}
        className="absolute bottom-10 bg-red-600 text-white px-6 py-2 rounded-full shadow-lg"
      >
        End Call
      </button>
    </div>
  );
};

export default CallScreen;
