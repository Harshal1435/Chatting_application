import React, { useEffect } from "react";
import { useCallContext } from "../context/CallContext";
import { useNavigate } from "react-router-dom";

const CallScreen = () => {
  const navigate = useNavigate();
  const {
    localVideoRef,
    remoteVideoRef,
    callType,
    activeCall,
    endCall,
    incomingCall,
  } = useCallContext();

  // Optional: redirect if no active call
  useEffect(() => {
    if (!activeCall && !incomingCall) {
      navigate("/");
    }
  }, [activeCall, incomingCall, navigate]);

  const handleEndCall = () => {
    endCall();
    navigate("/");
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {callType === "video" && (
          <>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="absolute bottom-5 right-5 w-40 h-32 rounded shadow-lg"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full object-cover"
            />
          </>
        )}
        {callType === "audio" && (
          <>
            <audio ref={localVideoRef} autoPlay muted />
            <audio ref={remoteVideoRef} autoPlay />
            <p className="text-white text-2xl">Audio Call In Progress...</p>
          </>
        )}
        <button
          onClick={handleEndCall}
          className="absolute bottom-10 bg-red-600 text-white px-6 py-2 rounded-full shadow-lg"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default CallScreen;
