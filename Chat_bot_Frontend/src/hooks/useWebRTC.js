// hooks/useWebRTC.js
import { useRef } from "react";

const useWebRTC = (socket, remoteUserId) => {
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peer = useRef(null);

  const setupMedia = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return localStream.current;
  };

  const callUser = async () => {
    await setupMedia();
    peer.current = new RTCPeerConnection();

    localStream.current.getTracks().forEach(track => {
      peer.current.addTrack(track, localStream.current);
    });

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("call-user", { to: remoteUserId, offer });

    peer.current.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: remoteUserId, candidate: e.candidate });
      }
    };

    peer.current.ontrack = e => {
      remoteStream.current.srcObject = e.streams[0];
    };
  };

  const answerCall = async (offer) => {
    await setupMedia();
    peer.current = new RTCPeerConnection();

    localStream.current.getTracks().forEach(track => {
      peer.current.addTrack(track, localStream.current);
    });

    await peer.current.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);

    socket.emit("answer-call", { to: remoteUserId, answer });

    peer.current.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: remoteUserId, candidate: e.candidate });
      }
    };

    peer.current.ontrack = e => {
      remoteStream.current.srcObject = e.streams[0];
    };
  };

  const handleAnswer = async (answer) => {
    await peer.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const addCandidate = (candidate) => {
    peer.current.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return {
    localStream,
    remoteStream,
    callUser,
    answerCall,
    handleAnswer,
    addCandidate
  };
};

export default useWebRTC;
