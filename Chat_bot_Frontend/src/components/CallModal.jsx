// ✅ CallModal.jsx
import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";

export default function CallModal() {
  const { activeCall, callType, localStream, remoteStream, endCall } = useCallContext();
  const localRef = useRef();
  const remoteRef = useRef();

  useEffect(() => {
    if (localRef.current && localStream.current) {
      localRef.current.srcObject = localStream.current;
    }
    if (remoteRef.current && remoteStream.current) {
      remoteRef.current.srcObject = remoteStream.current;
    }
  }, [localStream.current, remoteStream.current]);

  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center">
      <h2 className="text-white text-2xl mb-4">{callType.toUpperCase()} Call</h2>
      <div className="flex flex-col gap-4">
        {callType === "video" && (
          <>
            <video ref={remoteRef} autoPlay playsInline className="w-[90vw] h-[60vh] bg-gray-800" />
            <video ref={localRef} autoPlay muted playsInline className="w-40 h-32 absolute bottom-6 right-6 border border-white shadow-xl" />
          </>
        )}
        {callType === "audio" && (
          <>
            <audio ref={remoteRef} autoPlay className="hidden" />
            <audio ref={localRef} autoPlay muted className="hidden" />
            <p className="text-white text-lg">Audio Call In Progress...</p>
          </>
        )}
        <button
          onClick={endCall}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg shadow-md"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
