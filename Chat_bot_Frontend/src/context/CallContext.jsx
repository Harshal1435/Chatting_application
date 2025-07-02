// ✅ Updated CallContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";

const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice-candidate", { to: remoteUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) {
        remoteStream.current = stream;
      }
    };

    return pc;
  };

  const startCall = async ({ to, type }) => {
    setCallType(type);
    setRemoteUserId(to);
    localStream.current = await navigator.mediaDevices.getUserMedia({ video: type === "video", audio: true });

    peerConnection.current = createPeerConnection();
    localStream.current.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("call-user", { from: authUser.user._id, to, offer, callType: type });
    setActiveCall(true);
  };

  const acceptCall = async () => {
    setCallType(incomingCall.callType);
    setRemoteUserId(incomingCall.from);
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: incomingCall.callType === "video",
      audio: true
    });

    peerConnection.current = createPeerConnection();
    localStream.current.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answer-call", { to: incomingCall.from, answer });
    setIncomingCall(null);
    setActiveCall(true);
  };

  const endCall = () => {
    socket.emit("end-call", { to: remoteUserId });
    peerConnection.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current = null;
    setActiveCall(false);
    setIncomingCall(null);
    setCallType(null);
    setRemoteUserId(null);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", setIncomingCall);

    socket.on("call-accepted", async ({ answer }) => {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("webrtc-ice-candidate", ({ candidate }) => {
      peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("call-ended", endCall);

    return () => socket.off();
  }, [socket]);

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        callType,
        activeCall,
        incomingCall,
        startCall,
        acceptCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
