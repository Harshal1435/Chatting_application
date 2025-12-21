import { useCall } from "../context/CallContext";

export default function CallUI({ targetUserId }) {
  const {
    startCall,
    acceptCall,
    endCall,
    inCall,
    callType,
    localVideoRef,
    remoteVideoRef,
    callerId,
  } = useCall();

  return (
    <div>
      <div>
        <video ref={localVideoRef} autoPlay muted width="200" />
        <video ref={remoteVideoRef} autoPlay width="200" />
      </div>

      {!inCall && !callerId && (
        <>
          <button onClick={() => startCall(targetUserId, "audio")}>
            Audio Call
          </button>
          <button onClick={() => startCall(targetUserId, "video")}>
            Video Call
          </button>
        </>
      )}

      {callerId && !inCall && (
        <>
          <p>Incoming Call...</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={endCall}>Reject</button>
        </>
      )}

      {inCall && (
        <button onClick={endCall}>End Call</button>
      )}
    </div>
  );
}
