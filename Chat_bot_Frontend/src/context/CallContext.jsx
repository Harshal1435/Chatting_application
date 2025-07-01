import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";

const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null); // audio or video
  const [isCaller, setIsCaller] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState(null);

  // ✅ Create peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
    };

    return pc;
  };

  // ✅ End Call
  const endCall = () => {
    socket.emit("end-call", { to: remoteUserId });

    peerConnection.current?.close();
    peerConnection.current = null;

    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;

    remoteStream.current = new MediaStream();

    setIncomingCall(null);
    setRemoteUserId(null);
    setCallType(null);
    setIsCaller(false);
    setActiveCall(false);
  };

  // ✅ Start Call (Caller)
  const startCall = async ({ to, type = "audio" }) => {
    setIsCaller(true);
    setCallType(type);
    setRemoteUserId(to);

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });

    peerConnection.current = createPeerConnection();
    localStream.current.getTracks().forEach((track) =>
      peerConnection.current.addTrack(track, localStream.current)
    );

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("call-user", {
      from: authUser.user._id,
      to,
      offer,
      callType: type,
    });

    setActiveCall(true);
  };

  // ✅ Accept Call (Receiver)
  const acceptCall = async () => {
    setIsCaller(false);
    setCallType(incomingCall.callType);
    setRemoteUserId(incomingCall.from);

    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: incomingCall.callType === "video",
      audio: true,
    });

    peerConnection.current = createPeerConnection();
    localStream.current.getTracks().forEach((track) =>
      peerConnection.current.addTrack(track, localStream.current)
    );

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
  };

  // ✅ Reject Call
  const rejectCall = () => {
    if (incomingCall) {
      socket.emit("reject-call", { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  // ✅ Incoming socket listeners
  useEffect(() => {
    if (!socket || !authUser?.user?._id) return;

    socket.on("incoming-call", ({ from, offer, callType }) => {
      setIncomingCall({ from, offer, callType });
    });

    socket.on("call-accepted", async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("call-rejected", () => {
      alert("Call was rejected");
      endCall();
    });

    socket.on("call-ended", () => {
      alert("Call ended");
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

  return (
    <CallContext.Provider
      value={{
        // streams
        localStream,
        remoteStream,

        // call data
        incomingCall,
        remoteUserId,
        isCaller,
        callType,
        activeCall,

        // actions
        startCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
