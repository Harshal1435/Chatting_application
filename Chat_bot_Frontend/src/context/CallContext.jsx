import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  // ── Refs ──────────────────────────────────────────────────────────────────
  const peerConnection   = useRef(null);
  const localStream      = useRef(null);
  const remoteStream     = useRef(new MediaStream());
  const pendingICE       = useRef([]);
  const callTimer        = useRef(null);
  const remoteUserIdRef  = useRef(null); // always-current ref for closures
  const activeCallIdRef  = useRef(null);

  // ── 1-1 Call State ────────────────────────────────────────────────────────
  const [incomingCall,   setIncomingCall]   = useState(null);
  const [activeCall,     setActiveCall]     = useState(false);
  const [callType,       setCallType]       = useState(null);
  const [isCaller,       setIsCaller]       = useState(false);
  const [remoteUserId,   setRemoteUserId]   = useState(null);
  const [callDuration,   setCallDuration]   = useState(0);
  const [callStatus,     setCallStatus]     = useState("idle");
  const [isVideoOn,      setIsVideoOn]      = useState(true);
  const [isMuted,        setIsMuted]        = useState(false);
  const [isScreenSharing,setIsScreenSharing]= useState(false);

  // ── Group Call State ──────────────────────────────────────────────────────
  const [groupCallRoom,  setGroupCallRoom]  = useState(null);  // roomId string
  const [groupCallType,  setGroupCallType]  = useState(null);
  const [groupPeers,     setGroupPeers]     = useState({});    // userId → { pc, stream }
  const [inGroupCall,    setInGroupCall]    = useState(false);
  const groupLocalStream = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const startTimer = () => {
    const start = Date.now();
    callTimer.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - start) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(callTimer.current);
    callTimer.current = null;
    setCallDuration(0);
  };

  const cleanup1to1 = useCallback(() => {
    peerConnection.current?.close();
    peerConnection.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current = new MediaStream();
    pendingICE.current = [];
    setIsScreenSharing(false);
    setIsVideoOn(true);
    setIsMuted(false);
  }, []);

  const processPendingICE = () => {
    if (!peerConnection.current) return;
    pendingICE.current.forEach((c) => {
      peerConnection.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    });
    pendingICE.current = [];
  };

  // ── Create Peer Connection (1-1) ──────────────────────────────────────────
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && remoteUserIdRef.current && socket) {
        socket.emit("webrtc-ice-candidate", { to: remoteUserIdRef.current, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (!remoteStream.current) remoteStream.current = new MediaStream();
      streams[0]?.getTracks().forEach((track) => {
        if (!remoteStream.current.getTracks().some((t) => t.id === track.id)) {
          remoteStream.current.addTrack(track);
        }
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        toast.error("Call connection failed");
        endCall();
      }
    };

    return pc;
  }, [socket]);

  // ── 1-1: Start Call ───────────────────────────────────────────────────────
  const startCall = useCallback(async ({ to, type }) => {
    if (!socket) return;
    try {
      const callId = uuidv4();
      activeCallIdRef.current = callId;
      remoteUserIdRef.current = to;

      setIsCaller(true);
      setCallType(type);
      setRemoteUserId(to);
      setCallStatus("ringing");
      setIsVideoOn(type === "video");
      setIsMuted(false);

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      peerConnection.current = createPC();
      localStream.current.getTracks().forEach((t) =>
        peerConnection.current.addTrack(t, localStream.current)
      );

      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("call-user", {
        from: authUser.user._id,
        to,
        offer,
        callType: type,
        callId,
      });

      setActiveCall(true);
    } catch (err) {
      toast.error("Could not start call: " + err.message);
      cleanup1to1();
      setCallStatus("idle");
    }
  }, [socket, authUser, createPC, cleanup1to1]);

  // ── 1-1: Accept Call ──────────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    try {
      activeCallIdRef.current = incomingCall.callId;
      remoteUserIdRef.current = incomingCall.from;

      setIsCaller(false);
      setCallType(incomingCall.callType);
      setRemoteUserId(incomingCall.from);
      setCallStatus("ongoing");
      setIsVideoOn(incomingCall.callType === "video");
      setIsMuted(false);

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });

      peerConnection.current = createPC();
      localStream.current.getTracks().forEach((t) =>
        peerConnection.current.addTrack(t, localStream.current)
      );

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", {
        callId: incomingCall.callId,
        to: incomingCall.from,
        answer,
      });

      processPendingICE();
      setIncomingCall(null);
      setActiveCall(true);
      startTimer();
    } catch (err) {
      toast.error("Could not accept call: " + err.message);
      cleanup1to1();
      setCallStatus("idle");
    }
  }, [incomingCall, socket, createPC, cleanup1to1]);

  // ── 1-1: Reject Call ──────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;
    socket.emit("reject-call", { callId: incomingCall.callId, to: incomingCall.from });
    setIncomingCall(null);
    setCallStatus("idle");
  }, [incomingCall, socket]);

  // ── 1-1: End Call ─────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (socket && remoteUserIdRef.current && activeCallIdRef.current) {
      socket.emit("end-call", { callId: activeCallIdRef.current, to: remoteUserIdRef.current });
    }
    cleanup1to1();
    stopTimer();
    remoteUserIdRef.current = null;
    activeCallIdRef.current = null;
    setIncomingCall(null);
    setActiveCall(false);
    setCallType(null);
    setIsCaller(false);
    setRemoteUserId(null);
    setCallStatus("idle");
  }, [socket, cleanup1to1]);

  // ── 1-1: Toggle Controls ──────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const track = localStream.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStream.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOn(track.enabled);
  }, []);

  const toggleScreenShare = useCallback(async (enable) => {
    if (!peerConnection.current) return;
    try {
      if (enable) {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const track = screen.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(track);
        track.onended = () => toggleScreenShare(false);
        setIsScreenSharing(true);
      } else {
        const cam = await navigator.mediaDevices.getUserMedia({ video: callType === "video", audio: true });
        const track = cam.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(track);
        localStream.current = cam;
        setIsScreenSharing(false);
      }
    } catch (err) {
      toast.error("Screen share failed: " + err.message);
      setIsScreenSharing(false);
    }
  }, [callType]);

  // ── Group Call: Create peer for one participant ───────────────────────────
  const createGroupPC = useCallback((peerId, roomId, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit("group-ice-candidate", {
          roomId,
          to: peerId,
          from: authUser.user._id,
          candidate,
        });
      }
    };

    const remoteMediaStream = new MediaStream();
    pc.ontrack = ({ track }) => {
      remoteMediaStream.addTrack(track);
      setGroupPeers((prev) => ({
        ...prev,
        [peerId]: { ...prev[peerId], stream: remoteMediaStream },
      }));
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        setGroupPeers((prev) => {
          const updated = { ...prev };
          delete updated[peerId];
          return updated;
        });
      }
    };

    return pc;
  }, [socket, authUser]);

  // ── Group Call: Join ──────────────────────────────────────────────────────
  const joinGroupCall = useCallback(async ({ roomId, type = "video" }) => {
    if (!socket || !authUser?.user?._id) return;
    try {
      groupLocalStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      setGroupCallRoom(roomId);
      setGroupCallType(type);
      setInGroupCall(true);

      socket.emit("join-group-call", { roomId, callType: type });
    } catch (err) {
      toast.error("Could not join group call: " + err.message);
    }
  }, [socket, authUser]);

  // ── Group Call: Leave ─────────────────────────────────────────────────────
  const leaveGroupCall = useCallback(() => {
    if (!socket || !groupCallRoom) return;
    socket.emit("leave-group-call", { roomId: groupCallRoom });

    // Close all peer connections
    setGroupPeers((prev) => {
      Object.values(prev).forEach(({ pc }) => pc?.close());
      return {};
    });

    groupLocalStream.current?.getTracks().forEach((t) => t.stop());
    groupLocalStream.current = null;

    setGroupCallRoom(null);
    setGroupCallType(null);
    setInGroupCall(false);
  }, [socket, groupCallRoom]);

  // ── Socket Listeners ──────────────────────────────────────────────────────
  // Use a ref so socket listeners never need to re-register when endCall changes
  const endCallRef = useRef(null);
  endCallRef.current = endCall;

  useEffect(() => {
    if (!socket || !authUser?.user?._id) return;

    const onIncomingCall = ({ callId, from, offer, callType }) => {
      setIncomingCall({ callId, from, offer, callType });
      setCallStatus("ringing");
    };

    const onCallAccepted = async ({ answer }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        processPendingICE();
        setCallStatus("ongoing");
        startTimer();
      } catch (_) {
        toast.error("Failed to connect call");
        endCallRef.current?.();
      }
    };

    const onCallRejected = () => {
      toast("Call declined", { icon: "📵" });
      endCallRef.current?.();
    };

    const onCallEnded = () => {
      toast("Call ended", { icon: "📞" });
      endCallRef.current?.();
    };

    const onIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      if (peerConnection.current?.remoteDescription) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingICE.current.push(candidate);
      }
    };

    const onCallFailed = ({ message }) => {
      toast.error(message || "Call failed");
      cleanup1to1();
      setCallStatus("idle");
      setActiveCall(false);
    };

    const onGroupExistingParticipants = async ({ roomId, participants, callType }) => {
      if (!groupLocalStream.current) return;
      const stream = groupLocalStream.current;
      for (const peerId of participants) {
        if (peerId === authUser.user._id) continue;
        const pc = createGroupPC(peerId, roomId, stream);
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
        await pc.setLocalDescription(offer);
        socket.emit("group-offer", { roomId, to: peerId, from: authUser.user._id, offer });
        setGroupPeers((prev) => ({ ...prev, [peerId]: { pc, stream: new MediaStream() } }));
      }
    };

    const onGroupUserJoined = async ({ roomId, userId }) => {
      if (!groupLocalStream.current || userId === authUser.user._id) return;
      const stream = groupLocalStream.current;
      const pc = createGroupPC(userId, roomId, stream);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: groupCallType === "video" });
      await pc.setLocalDescription(offer);
      socket.emit("group-offer", { roomId, to: userId, from: authUser.user._id, offer });
      setGroupPeers((prev) => ({ ...prev, [userId]: { pc, stream: new MediaStream() } }));
    };

    const onGroupOffer = async ({ roomId, from, offer }) => {
      if (!groupLocalStream.current) return;
      const stream = groupLocalStream.current;
      const pc = createGroupPC(from, roomId, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("group-answer", { roomId, to: from, from: authUser.user._id, answer });
      setGroupPeers((prev) => ({ ...prev, [from]: { pc, stream: new MediaStream() } }));
    };

    const onGroupAnswer = async ({ from, answer }) => {
      setGroupPeers((prev) => {
        prev[from]?.pc?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
        return prev;
      });
    };

    const onGroupIceCandidate = ({ from, candidate }) => {
      setGroupPeers((prev) => {
        prev[from]?.pc?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        return prev;
      });
    };

    const onGroupUserLeft = ({ userId }) => {
      setGroupPeers((prev) => {
        const updated = { ...prev };
        updated[userId]?.pc?.close();
        delete updated[userId];
        return updated;
      });
    };

    socket.on("incoming-call",                    onIncomingCall);
    socket.on("call-accepted",                    onCallAccepted);
    socket.on("call-rejected",                    onCallRejected);
    socket.on("call-ended",                       onCallEnded);
    socket.on("webrtc-ice-candidate",             onIceCandidate);
    socket.on("call-failed",                      onCallFailed);
    socket.on("group-call-existing-participants", onGroupExistingParticipants);
    socket.on("group-call-user-joined",           onGroupUserJoined);
    socket.on("group-offer",                      onGroupOffer);
    socket.on("group-answer",                     onGroupAnswer);
    socket.on("group-ice-candidate",              onGroupIceCandidate);
    socket.on("group-call-user-left",             onGroupUserLeft);

    return () => {
      socket.off("incoming-call",                    onIncomingCall);
      socket.off("call-accepted",                    onCallAccepted);
      socket.off("call-rejected",                    onCallRejected);
      socket.off("call-ended",                       onCallEnded);
      socket.off("webrtc-ice-candidate",             onIceCandidate);
      socket.off("call-failed",                      onCallFailed);
      socket.off("group-call-existing-participants", onGroupExistingParticipants);
      socket.off("group-call-user-joined",           onGroupUserJoined);
      socket.off("group-offer",                      onGroupOffer);
      socket.off("group-answer",                     onGroupAnswer);
      socket.off("group-ice-candidate",              onGroupIceCandidate);
      socket.off("group-call-user-left",             onGroupUserLeft);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, authUser?.user?._id]);

  // Cleanup on unmount
  useEffect(() => () => { cleanup1to1(); stopTimer(); }, []);

  return (
    <CallContext.Provider value={{
      // 1-1
      localStream, remoteStream,
      incomingCall, activeCall, callType, isCaller, remoteUserId,
      callDuration, callStatus, isVideoOn, isMuted, isScreenSharing,
      startCall, acceptCall, rejectCall, endCall,
      toggleVideo, toggleMute, toggleScreenShare,
      // Group
      groupLocalStream, groupPeers, groupCallRoom, groupCallType, inGroupCall,
      joinGroupCall, leaveGroupCall,
    }}>
      {children}
    </CallContext.Provider>
  );
};
