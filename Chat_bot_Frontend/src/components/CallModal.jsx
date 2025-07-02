import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";

const CallModal = () => {
  const {
    activeCall,
    callType,
    localStream,
    remoteStream,
    endCall,
  } = useCallContext();

  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    console.log("🎥 CallModal Mounted");

    if (localRef.current && localStream.current instanceof MediaStream) {
      localRef.current.srcObject = localStream.current;
      console.log("✅ Local stream set");
    }

    if (remoteRef.current && remoteStream.current instanceof MediaStream) {
      remoteRef.current.srcObject = remoteStream.current;
      console.log("✅ Remote stream set");
    }
  }, [localStream.current, remoteStream.current]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col justify-center items-center z-50 text-white">
      <h2 className="text-2xl font-bold mb-4">{callType} Call</h2>

      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-sm mb-1">You</p>
          {callType === "video" ? (
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="w-64 h-48 bg-black rounded-xl"
            />
          ) : (
            <audio ref={localRef} autoPlay muted />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm mb-1">Remote</p>
          {callType === "video" ? (
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className="w-64 h-48 bg-black rounded-xl"
            />
          ) : (
            <audio ref={remoteRef} autoPlay />
          )}
        </div>
      </div>

      <button
        onClick={endCall}
        className="mt-6 px-4 py-2 bg-red-600 rounded-lg"
      >
        End Call
      </button>
    </div>
  );
};

export default CallModal;
