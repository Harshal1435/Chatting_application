// ✅ CallModal.jsx — Automatically shows local & remote stream during active call
import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";

export default function CallModal() {
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
    if (localRef.current && localStream.current) {
      localRef.current.srcObject = localStream.current;
    }
    if (remoteRef.current && remoteStream.current) {
      remoteRef.current.srcObject = remoteStream.current;
    }
  }, [localStream, remoteStream]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
        <h2 className="text-xl font-bold mb-4">{callType.toUpperCase()} Call</h2>
        <div className="flex flex-col items-center gap-4">
          <div>
            <p className="text-sm font-medium">You</p>
            {callType === "video" ? (
              <video ref={localRef} autoPlay muted playsInline className="w-32 h-24 rounded-md bg-black" />
            ) : (
              <audio ref={localRef} autoPlay muted />
            )}
          </div>

          <div>
            <p className="text-sm font-medium">Remote</p>
            {callType === "video" ? (
              <video ref={remoteRef} autoPlay playsInline className="w-48 h-36 rounded-md bg-black" />
            ) : (
              <audio ref={remoteRef} autoPlay />
            )}
          </div>

          <button
            onClick={endCall}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 mt-4 rounded-full shadow-lg"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
