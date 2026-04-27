import { useEffect, useRef } from "react";
import { useCallContext } from "../../context/CallContext";
import {
  FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
  FaVideo, FaVideoSlash,
} from "react-icons/fa";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";

const CallModal = () => {
  const {
    activeCall, callType, callStatus,
    localStream, remoteStream, remoteTrackVersion,
    endCall, toggleVideo, toggleMute, toggleScreenShare,
    isScreenSharing, isVideoOn, isMuted,
    remoteUserId, callDuration, isCaller,
  } = useCallContext();

  const localRef  = useRef(null);
  const remoteRef = useRef(null);

  // ── Attach local stream — only when the stream object itself changes ──────
  useEffect(() => {
    const el = localRef.current;
    if (!el || !localStream.current) return;
    if (el.srcObject !== localStream.current) {
      el.srcObject = localStream.current;
    }
  }, [localStream.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Attach remote stream — re-runs when new tracks arrive ─────────────────
  // remoteTrackVersion increments in CallContext every time ontrack fires,
  // giving us a stable trigger without running on every render.
  useEffect(() => {
    const el = localRef.current; // intentional: we check remoteRef below
    const remoteEl = remoteRef.current;
    const stream   = remoteStream.current;
    if (!remoteEl || !stream) return;
    if (remoteEl.srcObject !== stream) {
      remoteEl.srcObject = stream;
    }
    if (stream.getTracks().length > 0 && remoteEl.paused) {
      remoteEl.play().catch(() => {});
    }
  }, [remoteTrackVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (s) => {
    const m   = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!activeCall) return null;

  const isVideo = callType === "video";
  const statusLabel =
    callStatus === "ringing" ? (isCaller ? "Calling…" : "Incoming…") :
    callStatus === "ongoing"  ? formatDuration(callDuration) : "Connecting…";

  return (
    // No AnimatePresence/motion here — animation was causing re-render flicker
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">

      {/* ── Remote area ── */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">

        {isVideo ? (
          // Keep the video element always mounted so srcObject assignment is stable
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-5xl font-bold text-white select-none">
              {remoteUserId?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <p className="text-white text-xl font-semibold">{remoteUserId}</p>
          </div>
        )}

        {/* Status badge — isolated so timer re-renders don't touch video */}
        <StatusBadge label={statusLabel} />

        {/* Local PiP — only for video calls */}
        {isVideo && (
          <div className="absolute bottom-4 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-gray-800">
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <FaVideoSlash className="text-gray-400 text-2xl" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-center gap-5 py-6 bg-gray-950 flex-shrink-0">
        <ControlBtn
          onClick={toggleMute}
          active={isMuted}
          activeColor="bg-red-600"
          label={isMuted ? "Unmute" : "Mute"}
          icon={isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
        />

        {isVideo && (
          <ControlBtn
            onClick={toggleVideo}
            active={!isVideoOn}
            activeColor="bg-red-600"
            label={isVideoOn ? "Hide" : "Show"}
            icon={isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
          />
        )}

        {isVideo && (
          <ControlBtn
            onClick={() => toggleScreenShare(!isScreenSharing)}
            active={isScreenSharing}
            activeColor="bg-blue-600"
            label={isScreenSharing ? "Stop" : "Share"}
            icon={isScreenSharing ? <MdStopScreenShare size={22} /> : <MdScreenShare size={22} />}
          />
        )}

        <button onClick={endCall} className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg">
            <FaPhoneSlash size={22} className="text-white" />
          </div>
          <span className="text-xs text-gray-400">End</span>
        </button>
      </div>
    </div>
  );
};

// Isolated component so the timer label re-renders without touching the video tree
const StatusBadge = ({ label }) => (
  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium pointer-events-none">
    {label}
  </div>
);

const ControlBtn = ({ onClick, active, activeColor, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${active ? activeColor : "bg-gray-700 hover:bg-gray-600"}`}>
      <span className="text-white">{icon}</span>
    </div>
    <span className="text-xs text-gray-400">{label}</span>
  </button>
);

export default CallModal;
