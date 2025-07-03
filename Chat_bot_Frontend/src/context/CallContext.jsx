// ✅ Call Context with Working Incoming Call Logic
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";
import toast from "react-hot-toast";

const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const callTimer = useRef(null);
  const callStartTime = useRef(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState("idle");
  const [callError, setCallError] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const createPeerConnection = () => {
    try {
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
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStream.current.getTracks().some((t) => t.id === track.id)) {
            remoteStream.current.addTrack(track);
          }
        });
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === "disconnected" ||
          pc.iceConnectionState === "failed"
        ) {
          handleCallError("Connection lost");
        }
      };

      return pc;
    } catch (error) {
      handleCallError("Failed to create peer connection");
      return null;
    }
  };

  const handleCallError = (error) => {
    console.error("Call error:", error);
    setCallError(error);
    endCall();
  };

  const startCallTimer = () => {
    callStartTime.current = new Date();
    callTimer.current = setInterval(() => {
      setCallDuration(
        Math.floor((new Date() - callStartTime.current) / 1000)
      );
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimer.current) {
      clearInterval(callTimer.current);
      callTimer.current = null;
    }
    callStartTime.current = null;
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
      remoteStream.current = new MediaStream();
      setIsScreenSharing(false);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  const endCall = () => {
    if (remoteUserId) {
      socket.emit("end-call", { to: remoteUserId });
    }
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

  const startCall = async ({ to, type }) => {
    try {
      setIsCaller(true);
      setCallType(type);
      setRemoteUserId(to);
      setCallStatus("ringing");

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      peerConnection.current = createPeerConnection();
      if (!peerConnection.current) return;

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

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
      });

      setActiveCall(true);
    } catch (error) {
      handleCallError("Failed to start call: " + error.message);
    }
  };

  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      setIsCaller(false);
      setCallType(incomingCall.callType);
      setRemoteUserId(incomingCall.from);
      setCallStatus("ongoing");

      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });

      peerConnection.current = createPeerConnection();
      if (!peerConnection.current) return;

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer-call", {
        to: incomingCall.from,
        answer,
      });

      setIncomingCall(null);
      setActiveCall(true);
      startCallTimer();
    } catch (error) {
      handleCallError("Failed to accept call: " + error.message);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("reject-call", { to: incomingCall.from });
      setIncomingCall(null);
      setCallStatus("idle");
    }
  };

  const toggleVideo = async (enable) => {
    if (!localStream.current) return;
    const videoTrack = localStream.current.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = enable;
  };

  const toggleMute = (enable) => {
    if (!localStream.current) return;
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = enable;
  };

  useEffect(() => {
    if (!socket || !authUser?.user?._id) return;

    socket.on("incoming-call", ({ from, offer, callType }) => {
      console.log("📞 Incoming call from:", from);
      setIncomingCall({ from, offer, callType });
      setCallStatus("ringing");
    });

    socket.on("call-accepted", async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setCallStatus("ongoing");
        startCallTimer();
      }
    });

    socket.on("call-rejected", () => {
      toast.error("Call was rejected");
      endCall();
    });

    socket.on("call-ended", () => {
      toast.error("Call ended");
      endCall();
    });

    socket.on("webrtc-ice-candidate", ({ candidate }) => {
      if (peerConnection.current && candidate) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("webrtc-ice-candidate");
    };
  }, [socket, authUser]);

  useEffect(() => {
    return () => {
      cleanupCallResources();
      stopCallTimer();
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        incomingCall,
        remoteUserId,
        isCaller,
        callType,
        activeCall,
        callDuration,
        callStatus,
        callError,
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
