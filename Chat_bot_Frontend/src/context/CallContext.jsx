// src/context/CallContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";
import { toast } from "react-hot-toast";


const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  // WebRTC Refs
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const pendingIceCandidates = useRef([]);

  // Call state
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("idle");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const callTimer = useRef(null);

  // ICE Servers
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      // TURN server example (replace with your own)
      // { urls: "turn:YOUR_SERVER_IP:3478", username: "user", credential: "pass" },
    ],
  };

  // ---------------- WebRTC ----------------
  const createPeerConnection = () => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteUserId) {
          socket.emit("webrtc-ice-candidate", {
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStream.current.getTracks().some((t) => t.id === track.id)) {
            remoteStream.current.addTrack(track);
          }
        });
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          endCall();
        }
      };

      return pc;
    } catch (err) {
      console.error("PeerConnection error:", err);
      return null;
    }
  };

  const processPendingIceCandidates = () => {
    if (peerConnection.current && pendingIceCandidates.current.length > 0) {
      pendingIceCandidates.current.forEach((candidate) => {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      });
      pendingIceCandidates.current = [];
    }
  };

  // ---------------- Call Timer ----------------
  const startCallTimer = () => {
    callTimer.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };
  const stopCallTimer = () => {
    clearInterval(callTimer.current);
    callTimer.current = null;
    setCallDuration(0);
  };

  // ---------------- Start Call ----------------
  const startCall = async ({ to, type }) => {
    try {
      setIsCaller(true);
      setCallType(type);
      setRemoteUserId(to);
      setCallStatus("ringing");
      setIsVideoOn(type === "video");
      setIsMuted(false);

      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      // Create Peer
      peerConnection.current = createPeerConnection();
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      await peerConnection.current.setLocalDescription(offer);

      // Emit socket call
      socket.emit("call-user", {
        from: authUser.user._id,
        to,
        offer,
        callType: type,
      });

      setActiveCall(true);
    } catch (err) {
      console.error("Start call error:", err);
      toast.error("Failed to start call");
      endCall();
    }
  };

  // ---------------- Accept Call ----------------
  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      setIsCaller(false);
      setRemoteUserId(incomingCall.from);
      setCallType(incomingCall.callType);
      setCallStatus("ongoing");
      setIsVideoOn(incomingCall.callType === "video");
      setIsMuted(false);

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });

      peerConnection.current = createPeerConnection();
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: incomingCall.from,
        callId: incomingCall.callId,
        answer,
      });

      processPendingIceCandidates();
      setIncomingCall(null);
      setActiveCall(true);
      startCallTimer();
    } catch (err) {
      console.error("Accept call error:", err);
      toast.error("Failed to accept call");
      endCall();
    }
  };

  // ---------------- Reject Call ----------------
  const rejectCall = () => {
    if (!incomingCall) return;

    socket.emit("reject-call", { to: incomingCall.from, callId: incomingCall.callId });
    setIncomingCall(null);
    setCallStatus("idle");
  };

  // ---------------- End Call ----------------
  const endCall = () => {
    if (remoteUserId) {
      socket.emit("end-call", { to: remoteUserId });
    }

    peerConnection.current?.close();
    peerConnection.current = null;

    localStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current?.getTracks().forEach((t) => t.stop());

    setActiveCall(false);
    setIncomingCall(null);
    setRemoteUserId(null);
    setCallType(null);
    setIsCaller(false);
    setCallStatus("ended");
    stopCallTimer();
  };

  // ---------------- Toggle Video / Mute ----------------
  const toggleVideo = () => {
    if (!localStream.current) return;
    const videoTrack = localStream.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const toggleMute = () => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  // ---------------- Socket Events ----------------
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (data) => {
      setIncomingCall(data);
      setCallStatus("ringing");
    });

    socket.on("call-accepted", ({ answer }) => {
      if (peerConnection.current) {
        peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("ongoing");
        startCallTimer();
      }
    });

    socket.on("call-rejected", () => {
      toast.error("Call rejected");
      endCall();
    });

    socket.on("call-ended", () => {
      toast.error("Call ended");
      endCall();
    });

    socket.on("webrtc-ice-candidate", ({ candidate }) => {
      if (peerConnection.current?.remoteDescription) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      } else {
        pendingIceCandidates.current.push(candidate);
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("webrtc-ice-candidate");
    };
  }, [socket, remoteUserId]);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callType,
        remoteUserId,
        isCaller,
        callDuration,
        callStatus,
        localStream,
        remoteStream,
        peerConnection,
        isVideoOn,
        isMuted,
        isScreenSharing,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleVideo,
        toggleMute,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
