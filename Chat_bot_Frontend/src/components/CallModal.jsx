import React, { useEffect, useRef } from "react";
import { useCallContext } from "../context/CallContext";

const CallModal = () => {
  const { callState, localStream, endCall } = useCallContext();
  const localRef = useRef();

  useEffect(() => {
    if (callState === "active" && localRef.current && localStream.current) {
      localRef.current.srcObject = localStream.current;
    }
  }, [callState, localStream]);

  if (callState !== "active") return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <video ref={localRef} autoPlay muted className="w-2/3 rounded shadow-lg" />
      <button onClick={endCall} className="mt-4 bg-red-600 text-white px-6 py-2 rounded">End Call</button>
    </div>
  );
};

export default CallModal;
