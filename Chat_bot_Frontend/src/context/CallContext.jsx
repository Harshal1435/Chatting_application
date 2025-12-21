import { createContext, useContext, useRef, useState, useEffect } from "react";
import { useSocketContext } from "./SocketContext"; // ✅ Correct import
import { rtcConfig } from "./rtcConfig";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children, userId }) => {
  const { socket } = useSocketContext(); // ✅ Get socket here

  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [callId, setCallId] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join", userId);

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", endCall);
    socket.on("call-ended", endCall);
    socket.on("webrtc-ice-candidate", handleIce);

    return () => socket.removeAllListeners();
  }, [socket]);

  const createPeer = async (type, targetId) => {
    peerRef.current = new RTCPeerConnection(rtcConfig);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((t) => peerRef.current.addTrack(t, stream));

    peerRef.current.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    peerRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc-ice-candidate", {
          to: targetId,
          candidate: e.candidate,
        });
      }
    };
  };

  const startCall = async (to, type) => {
    setCallType(type);
    await createPeer(type, to);

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.emit("call-user", {
      from: userId,
      to,
      offer,
      callType: type,
    });
  };

  const handleIncomingCall = async ({ callId, from, offer, callType }) => {
    setCallerId(from);
    setCallId(callId);
    setCallType(callType);

    await createPeer(callType, from);
    await peerRef.current.setRemoteDescription(offer);
  };

  const acceptCall = async () => {
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socket.emit("answer-call", {
      callId,
      to: callerId,
      answer,
    });

    setInCall(true);
  };

  const handleCallAccepted = async ({ callId, answer }) => {
    setCallId(callId);
    await peerRef.current.setRemoteDescription(answer);
    setInCall(true);
  };

  const handleIce = async ({ candidate }) => {
    if (candidate) {
      await peerRef.current.addIceCandidate(candidate);
    }
  };

  const endCall = () => {
    peerRef.current?.close();
    peerRef.current = null;
    setInCall(false);
    setCallId(null);
    setCallerId(null);
  };

  return (
    <CallContext.Provider
      value={{
        startCall,
        acceptCall,
        endCall,
        inCall,
        callType,
        localVideoRef,
        remoteVideoRef,
        callerId,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
