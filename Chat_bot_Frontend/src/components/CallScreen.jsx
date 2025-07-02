// ✅ CallScreen.jsx — Optional fullscreen version (alternative to CallModal)
import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";
import { useNavigate } from "react-router-dom";

const CallScreen = () => {
  const {
    remoteUserId,
    callType,
    localStream,
    remoteStream,
    activeCall,
    endCall,
  } = useCallContext();

  const localRef = useRef();
  const remoteRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (localRef.current && localStream.current) {
      localRef.current.srcObject = localStream.current;
    }
    if (remoteRef.current && remoteStream.current) {
      remoteRef.current.srcObject = remoteStream.current;
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    if (!activeCall) navigate("/");
  }, [activeCall]);

  if (!activeCall) return null;

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {callType === "video" && (
          <>
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="absolute bottom-5 right-5 w-40 h-32 rounded shadow-lg"
            />
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </>
        )}

        {callType === "audio" && (
          <>
            <audio ref={localRef} autoPlay muted />
            <audio ref={remoteRef} autoPlay />
            <p className="text-white text-xl">Audio Call In Progress...</p>
          </>
        )}

        <button
          onClick={endCall}
          className="absolute bottom-10 bg-red-600 text-white px-6 py-2 rounded-full shadow-lg"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default CallScreen;
