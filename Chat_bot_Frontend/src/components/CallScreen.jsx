import React, { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useCallContext } from "../context/CallContext";
import { useNavigate } from "react-router-dom";

const CallScreen = () => {
  const { socket } = useSocketContext();
  const {
    remoteUserId,
    callType,
    webRTCAnswer,
    iceCandidates,
    resetCall,
  } = useCallContext();
  const navigate = useNavigate();

  const localRef = useRef();
  const remoteRef = useRef();
  const pc = useRef(null);

  useEffect(() => {
    const startCall = async () => {
      pc.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.current.ontrack = (event) => {
        if (remoteRef.current) {
          remoteRef.current.srcObject = event.streams[0];
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      stream.getTracks().forEach((track) => {
        pc.current.addTrack(track, stream);
      });

      localRef.current.srcObject = stream;

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      socket.emit("call-user", {
        to: remoteUserId,
        offer,
        type: callType,
      });
    };

    startCall();
  }, [remoteUserId, callType, socket]);

  useEffect(() => {
    if (webRTCAnswer) {
      pc.current.setRemoteDescription(new RTCSessionDescription(webRTCAnswer));
    }
  }, [webRTCAnswer]);

  useEffect(() => {
    iceCandidates.forEach((candidate) => {
      pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }, [iceCandidates]);

  const handleEndCall = () => {
    socket.emit("end-call", { to: remoteUserId });
    resetCall();
    navigate("/");
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {callType === "video" && (
          <>
            <video ref={localRef} autoPlay muted className="absolute bottom-5 right-5 w-40 h-32 rounded shadow-lg" />
            <video ref={remoteRef} autoPlay className="w-full h-full object-cover" />
          </>
        )}
        {callType === "audio" && (
          <>
            <audio ref={localRef} autoPlay muted />
            <audio ref={remoteRef} autoPlay />
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