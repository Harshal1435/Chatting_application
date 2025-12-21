import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";
import toast from "react-hot-toast";

const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  // Refs
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingIceCandidates = useRef([]);

  // State
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [isCaller, setIsCaller] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [callStatus, setCallStatus] = useState("idle"); // 'idle', 'ringing', 'ongoing'
  const [callDuration, setCallDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const callTimer = useRef(null);

  // ICE servers
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };

  // -------------------- UTILITIES --------------------
  const startCallTimer = () => {
    callTimer.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimer.current) clearInterval(callTimer.current);
    callTimer.current = null;
    setCallDuration(0);
  };

  const cleanupCallResources = () => {
    try {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach((track) => track.stop());
        remoteStream.current = new MediaStream();
      }

      setIsScreenSharing(false);
      setIsVideoOn(true);
      setIsMuted(false);
      pendingIceCandidates.current = [];
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  const handleCallError = (msg) => {
    toast.error(msg);
    endCall();
  };

  const processPendingIceCandidates = () => {
    if (peerConnection.current && pendingIceCandidates.current.length > 0) {
      pendingIceCandidates.current.forEach((c) => {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
      });
      pendingIceCandidates.current = [];
    }
  };

  // -------------------- PEER CONNECTION --------------------
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteUserId) {
        socket.emit("webrtc-ice-candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (!remoteStream.current) remoteStream.current = new MediaStream();
      event.streams[0].getTracks().forEach((track) => {
        if (!remoteStream.current.getTracks().some((t) => t.id === track.id)) {
          remoteStream.current.addTrack(track);
        }
      });
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream.current;
    };

    return pc;
  };

  // -------------------- CALL ACTIONS --------------------
  const startCall = async ({ to, type }) => {
    try {
      setIsCaller(true);
      setCallType(type);
      setRemoteUserId(to);
      setCallStatus("ringing");
      setIsVideoOn(type === "video");

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;

      peerConnection.current = createPeerConnection();
      localStream.current.getTracks().forEach((t) => peerConnection.current.addTrack(t, localStream.current));

      const offer = await peerConnection.current.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === "video" });
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", { from: authUser.user._id, to, offer, callType: type });
      setActiveCall(true);
    } catch (err) {
      handleCallError("Failed to start call: " + err.message);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      setIsCaller(false);
      setCallType(incomingCall.callType);
      setRemoteUserId(incomingCall.from);
      setCallStatus("ongoing");
      setIsVideoOn(incomingCall.callType === "video");

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;

      peerConnection.current = createPeerConnection();
      localStream.current.getTracks().forEach((t) => peerConnection.current.addTrack(t, localStream.current));

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", { to: incomingCall.from, answer });

      processPendingIceCandidates();
      setIncomingCall(null);
      setActiveCall(true);
      startCallTimer();
    } catch (err) {
      handleCallError("Failed to accept call: " + err.message);
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;
    socket.emit("reject-call", { to: incomingCall.from });
    setIncomingCall(null);
    setCallStatus("idle");
    cleanupCallResources();
  };

  const endCall = () => {
    if (remoteUserId) socket.emit("end-call", { to: remoteUserId });
    cleanupCallResources();
    stopCallTimer();
    setIncomingCall(null);
    setRemoteUserId(null);
    setCallType(null);
    setIsCaller(false);
    setActiveCall(false);
    setCallStatus("ended");

    setTimeout(() => setCallStatus("idle"), 2000);
  };

  const toggleVideo = (enable) => {
    if (!localStream.current) return;
    const track = localStream.current.getVideoTracks()[0];
    if (track) track.enabled = enable;
    setIsVideoOn(enable);
  };

  const toggleMute = (enable) => {
    if (!localStream.current) return;
    const track = localStream.current.getAudioTracks()[0];
    if (track) track.enabled = !enable;
    setIsMuted(enable);
  };

  const toggleScreenShare = async (enable) => {
    try {
      if (!peerConnection.current) throw new Error("Peer connection not established");

      if (enable) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) screenStream.addTrack(audioTrack);

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
        else peerConnection.current.addTrack(videoTrack, screenStream);

        videoTrack.onended = () => toggleScreenShare(false);
        localStream.current = screenStream;
        setIsScreenSharing(true);
      } else {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: callType === "video", audio: true });
        const videoTrack = camStream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);

        localStream.current.getTracks().forEach((t) => t.stop());
        localStream.current = camStream;
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error("Screen share error:", err);
      toast.error("Screen sharing failed");
      setIsScreenSharing(false);
    }
  };

  // -------------------- SOCKET LISTENERS --------------------
  useEffect(() => {
    if (!socket || !authUser?.user?._id) return;

    const handleIncomingCall = ({ from, offer, callType }) => {
      setIncomingCall({ from, offer, callType });
      setCallStatus("ringing");
    };

    const handleCallAccepted = async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("ongoing");
        startCallTimer();
        processPendingIceCandidates();
      }
    };

    const handleCallRejected = () => {
      toast.error("Call rejected");
      endCall();
    };

    const handleCallEnded = () => {
      toast.error("Call ended");
      endCall();
    };

    const handleIceCandidate = ({ candidate }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      } else {
        pendingIceCandidates.current.push(candidate);
      }
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);
    socket.on("webrtc-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
    };
  }, [socket, authUser]);

  // Cleanup on unmount
  useEffect(() => () => { cleanupCallResources(); stopCallTimer(); }, []);

  return (
    <CallContext.Provider
      value={{
        localVideoRef,
        remoteVideoRef,
        localStream,
        remoteStream,
        peerConnection,
        incomingCall,
        activeCall,
        remoteUserId,
        isCaller,
        callType,
        callStatus,
        callDuration,
        isScreenSharing,
        isVideoOn,
        isMuted,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleVideo,
        toggleMute,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
