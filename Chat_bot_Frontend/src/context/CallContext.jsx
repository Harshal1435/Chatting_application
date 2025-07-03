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

  // Refs for WebRTC components
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(new MediaStream());
  const callTimer = useRef(null);
  const callStartTime = useRef(null);
  const pendingIceCandidates = useRef([]);

  // State variables
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [isCaller, setIsCaller] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'ringing', 'ongoing', 'ended'
  const [callError, setCallError] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Configuration for ICE servers (STUN/TURN)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // Add your TURN server configuration if needed
    ],
    iceCandidatePoolSize: 10
  };

  // Create peer connection with error handling
  const createPeerConnection = () => {
    try {
      const pc = new RTCPeerConnection(iceServers);

      pc.onicecandidate = (event) => {
        if (event.candidate && remoteUserId) {
          console.log('Sending ICE candidate:', event.candidate);
          socket.emit("webrtc-ice-candidate", {
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('Track received:', event.track.kind);
        if (!remoteStream.current) {
          remoteStream.current = new MediaStream();
        }
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStream.current.getTracks().some(t => t.id === track.id)) {
            remoteStream.current.addTrack(track);
            console.log(`Added ${track.kind} track to remote stream`);
          }
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || 
            pc.iceConnectionState === 'failed') {
          handleCallError('Connection lost');
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
      };

      pc.onsignalingstatechange = () => {
        console.log('Signaling state:', pc.signalingState);
      };

      return pc;
    } catch (error) {
      console.error('Peer connection creation error:', error);
      handleCallError('Failed to create peer connection');
      return null;
    }
  };

  // Process pending ICE candidates
  const processPendingIceCandidates = () => {
    if (peerConnection.current && pendingIceCandidates.current.length > 0) {
      console.log('Processing pending ICE candidates');
      pendingIceCandidates.current.forEach(candidate => {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(err => console.error('Error adding ICE candidate:', err));
      });
      pendingIceCandidates.current = [];
    }
  };

  // Handle call errors
  const handleCallError = (error) => {
    console.error('Call error:', error);
    setCallError(error);
    toast.error(error);
    endCall();
  };

  // Start call timer
  const startCallTimer = () => {
    callStartTime.current = new Date();
    callTimer.current = setInterval(() => {
      setCallDuration(Math.floor((new Date() - callStartTime.current) / 1000));
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (callTimer.current) {
      clearInterval(callTimer.current);
      callTimer.current = null;
    }
    callStartTime.current = null;
    setCallDuration(0);
  };

  // Clean up resources
  const cleanupCallResources = () => {
    try {
      console.log('Cleaning up call resources');
      
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }

      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach(track => track.stop());
        remoteStream.current = new MediaStream();
      }

      setIsScreenSharing(false);
      setIsVideoOn(true);
      setIsMuted(false);
      pendingIceCandidates.current = [];
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // End Call
  const endCall = () => {
    console.log('Ending call');
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
    setCallStatus('ended');
    
    // Reset to idle after a delay
    setTimeout(() => setCallStatus('idle'), 2000);
  };

  // Toggle screen sharing
  const toggleScreenShare = async (enable) => {
    try {
      if (!peerConnection.current) {
        throw new Error('Peer connection not established');
      }

      if (enable) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false // Typically screen share doesn't include audio
        });

        // Keep the original audio track if available
        if (localStream.current) {
          const audioTrack = localStream.current.getAudioTracks()[0];
          if (audioTrack) {
            screenStream.addTrack(audioTrack);
          }
        }

        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        } else {
          peerConnection.current.addTrack(videoTrack, screenStream);
        }

        // Handle when user stops sharing via browser UI
        videoTrack.onended = () => toggleScreenShare(false);

        // Store the screen stream to clean up later
        localStream.current = screenStream;
        setIsScreenSharing(true);
        return true;
      } else {
        // Stop screen sharing and restore camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true
        });

        // Replace video track back to camera
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnection.current.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Clean up screen stream
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => track.stop());
        }

        localStream.current = stream;
        setIsScreenSharing(false);
        return true;
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Screen sharing failed: ' + error.message);
      setIsScreenSharing(false);
      return false;
    }
  };

  // Start Call (Caller)
  const startCall = async ({ to, type }) => {
    try {
      setIsCaller(true);
      setCallType(type);
      setRemoteUserId(to);
      setCallStatus('ringing');
      setIsVideoOn(type === 'video');
      setIsMuted(false);

      // Get user media
      console.log('Requesting user media');
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      // Create peer connection
      console.log('Creating peer connection');
      peerConnection.current = createPeerConnection();
      if (!peerConnection.current) return;

      // Add tracks to connection
      console.log('Adding tracks to connection');
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      // Create and set local description
      console.log('Creating offer');
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      
      console.log('Setting local description');
      await peerConnection.current.setLocalDescription(offer);

      // Emit call event
      console.log('Emitting call-user event');
      socket.emit("call-user", {
        from: authUser.user._id,
        to,
        offer,
        callType: type,
      });

      setActiveCall(true);
    } catch (error) {
      handleCallError('Failed to start call: ' + error.message);
    }
  };

  // Accept Call (Receiver)
  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      setIsCaller(false);
      setCallType(incomingCall.callType);
      setRemoteUserId(incomingCall.from);
      setCallStatus('ongoing');
      setIsVideoOn(incomingCall.callType === 'video');
      setIsMuted(false);

      // Get user media
      console.log('Requesting user media for accept');
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === "video",
        audio: true,
      });

      // Create peer connection
      console.log('Creating peer connection for accept');
      peerConnection.current = createPeerConnection();
      if (!peerConnection.current) return;

      // Add tracks to connection
      console.log('Adding tracks to connection for accept');
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      // Set remote description
      console.log('Setting remote description');
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      // Create and set local description
      console.log('Creating answer');
      const answer = await peerConnection.current.createAnswer();
      console.log('Setting local description for answer');
      await peerConnection.current.setLocalDescription(answer);

      // Emit answer
      console.log('Emitting answer-call event');
      socket.emit("answer-call", {
        to: incomingCall.from,
        answer,
      });

      // Process any pending ICE candidates
      processPendingIceCandidates();

      setIncomingCall(null);
      setActiveCall(true);
      startCallTimer();
    } catch (error) {
      handleCallError('Failed to accept call: ' + error.message);
    }
  };

  // Reject Call
  const rejectCall = () => {
    if (incomingCall) {
      console.log('Rejecting call');
      socket.emit("reject-call", { to: incomingCall.from });
      setIncomingCall(null);
      setCallStatus('idle');
      cleanupCallResources();
    }
  };

  // Toggle video during call
  const toggleVideo = async (enable) => {
    try {
      if (!localStream.current) return;
      
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enable;
        setIsVideoOn(enable);
        
        // If turning video on and we're screen sharing, refresh the stream
        if (enable && isScreenSharing) {
          await toggleScreenShare(true);
        }
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast.error('Failed to toggle video');
    }
  };

  // Toggle mute during call
  const toggleMute = (enable) => {
    if (!localStream.current) return;
    
    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !enable;
      setIsMuted(enable);
    }
  };

  // Incoming socket listeners
  useEffect(() => {
    if (!socket || !authUser?.user?._id) return;

    const handleIncomingCall = ({ from, offer, callType }) => {
      console.log('Incoming call from:', from);
      setIncomingCall({ from, offer, callType });
      setCallStatus('ringing');
    };

    const handleCallAccepted = async ({ answer }) => {
      console.log('Call accepted with answer:', answer);
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          setCallStatus('ongoing');
          startCallTimer();
          processPendingIceCandidates();
        } catch (error) {
          handleCallError('Failed to set remote description: ' + error.message);
        }
      }
    };

    const handleCallRejected = () => {
      console.log('Call rejected');
      toast.error("Call was rejected");
      endCall();
    };

    const handleCallEnded = () => {
      console.log('Call ended by remote');
      toast.error("Call ended");
      endCall();
    };

    const handleIceCandidate = ({ candidate }) => {
      console.log('Received ICE candidate:', candidate);
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(err => console.error('Error adding ICE candidate:', err));
      } else {
        console.log('Storing ICE candidate for later');
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
  useEffect(() => {
    return () => {
      cleanupCallResources();
      stopCallTimer();
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        // streams
        localStream,
        remoteStream,
peerConnection,
        // call data
        incomingCall,
        remoteUserId,
        isCaller,
        callType,
        activeCall,
        callDuration,
        callStatus,
        callError,
        isScreenSharing,
        isVideoOn,
        isMuted,

        // actions
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