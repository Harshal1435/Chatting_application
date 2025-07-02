// src/context/CallContext.jsx
import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuth } from "./AuthProvider";

const CallContext = createContext();
export const useCallContext = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const [authUser] = useAuth();

  const [callState, setCallState] = useState("idle");
  const [remoteUser, setRemoteUser] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [peerId, setPeerId] = useState(null);

  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());

  const initLocalStream = async (type = "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true
    });
    localStream.current = stream;
    return stream;
  };

  const startCall = async ({ targetId, targetChatId, type }) => {
    const roomId = `${authUser.user._id}-${targetId}-${Date.now()}`;
    const stream = await initLocalStream(type);
    setRoomId(roomId);
    setCallState("calling");

    socket.emit("startCall", {
      roomId,
      targetChatId,
      targetId,
      user: authUser.user,
      peerId: socket.id,
      myMicStatus: true,
      myCamStatus: type === "video",
    });
  };

  const acceptCall = async ({ roomId, from }) => {
    setRoomId(roomId);
    setRemoteUser(from);
    setCallState("active");
    const stream = await initLocalStream();
    socket.emit("acceptCall", {
      roomId,
      user: authUser.user,
      accepterPeerId: socket.id,
      callerPeerId: from.peerId,
    });
  };

  const declineCall = () => {
    socket.emit("declineCall", {
      roomId,
      user: authUser.user,
      targetId: remoteUser?._id,
    });
    setCallState("idle");
  };

  const endCall = () => {
    if (roomId) {
      socket.emit("endCall", { roomId });
    }
    localStream.current?.getTracks().forEach(t => t.stop());
    setCallState("idle");
    setRoomId(null);
    setRemoteUser(null);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", ({ roomId, caller }) => {
      setRoomId(roomId);
      setRemoteUser(caller);
      setCallState("incoming");
    });

    socket.on("callActive", () => setCallState("active"));
    socket.on("callDeclined", () => setCallState("idle"));
    socket.on("callTerminated", () => endCall());

    return () => {
      socket.off("incomingCall");
      socket.off("callActive");
      socket.off("callDeclined");
      socket.off("callTerminated");
    };
  }, [socket]);

  return (
    <CallContext.Provider
      value={{
        startCall,
        acceptCall,
        declineCall,
        endCall,
        localStream,
        remoteStream,
        callState,
        remoteUser,
        roomId,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
