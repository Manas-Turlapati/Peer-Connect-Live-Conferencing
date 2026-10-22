import React, { useRef, useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { UserContext } from "../UserContext";
import {
  connections,
  allStreams,
  streamsWithSocketId,
  pendingIceCandidates,
} from "../webrtc.js";
import { 
  Video, 
  User, 
  PlusCircle, 
  LogIn, 
  History as HistoryIcon, 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  ArrowRight,
  ArrowLeft,
  LogOut,
  CheckCircle2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const server_url = `${API}`;

function VideoMeeting() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const roomId = useRef("");
  const socketRef = useRef();
  const localVideoRef = useRef();

  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || window.username || "";
  });
  const [room, setRoomId] = useState("");
  const [join, setJoin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Pre-load camera stream for lobby preview
  useEffect(() => {
    let isMounted = true;
    async function initPreview() {
      if (window.localStream) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }
        setHasCamera(window.localStream.getVideoTracks().length > 0);
        setHasMic(window.localStream.getAudioTracks().length > 0);
        return;
      }
      try {
        const stream = await navigator.mediaDevices?.getUserMedia({
          video: true,
          audio: true,
        });
        if (isMounted && stream) {
          window.localStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          if (!allStreams.includes(stream)) {
            allStreams.push(stream);
          }
          setHasCamera(stream.getVideoTracks().length > 0);
          setHasMic(stream.getAudioTracks().length > 0);
        }
      } catch (err) {
        console.log("Audio/Video preview init notice:", err?.message || err);
        try {
          const videoOnly = await navigator.mediaDevices?.getUserMedia({ video: true });
          if (isMounted && videoOnly) {
            window.localStream = videoOnly;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = videoOnly;
            }
            if (!allStreams.includes(videoOnly)) {
              allStreams.push(videoOnly);
            }
            setHasCamera(true);
          }
        } catch (e) {
          console.log("Camera preview not granted initially:", e?.message || e);
        }
      }
    }
    initPreview();
    return () => {
      isMounted = false;
    };
  }, []);

  function togglePreviewMic() {
    const track = window.localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
    }
  }

  function togglePreviewVideo() {
    const track = window.localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  }

  const getMedia = async (create) => {
    connectToSocketServer(create);
  };

  async function socketConnection(id) {
    try {
      let res = await fetch(`${API}/turn`);
      let val = await res.json();
      let peerConfigConnections = {
        iceServers: val.data,
      };

      const rtcpeerConnection = new RTCPeerConnection(peerConfigConnections);
      connections[id] = rtcpeerConnection;

      if (window.localStream) {
        window.localStream.getTracks().forEach((el) => {
          connections[id].addTrack(el, window.localStream);
        });
      }

      connections[id].ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream && !allStreams.some((stream) => stream.id === remoteStream.id)) {
          allStreams.push(remoteStream);
          streamsWithSocketId[id] = remoteStream;
          window.dispatchEvent(new CustomEvent("stream_updated"));
        }
      };

      connections[id].onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("icecandidate", id, {
            type: "ice-candidate",
            candidate: event.candidate,
          });
        }
      };
    } catch (e) {
      console.log("Defaulting to standard STUN:", e);
      const rtcpeerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      connections[id] = rtcpeerConnection;
      if (window.localStream) {
        window.localStream.getTracks().forEach((el) => {
          connections[id].addTrack(el, window.localStream);
        });
      }
    }
  }

  function connectToSocketServer(create) {
    try {
      socketRef.current = io(server_url);
      window.socket = socketRef.current;

      socketRef.current.on("connect", () => {
        let path = create ? roomId.current : room;
        socketRef.current.emit("join-call", path, username);
        streamsWithSocketId[socketRef.current.id] = window.localStream;
        socketRef.current.emit(
          "chat-message",
          `${username} joined the chat!`,
          username ? username : "",
        );

        socketRef.current.on("user-joined", async (remotePeerId) => {
          await socketConnection(remotePeerId);
          const offer = await connections[remotePeerId].createOffer();
          await connections[remotePeerId].setLocalDescription(offer);
          socketRef.current.emit(
            "signal",
            remotePeerId,
            JSON.stringify({ sdp: connections[remotePeerId].localDescription }),
          );
        });

        socketRef.current.on("signal", async (fromUserId, data) => {
          try {
            let pc = connections[fromUserId];
            const signalData = JSON.parse(data);
            if (!pc) {
              await socketConnection(fromUserId);
              pc = connections[fromUserId];
            }
            await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            if (pendingIceCandidates[fromUserId]) {
              for (const candidate of pendingIceCandidates[fromUserId]) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              delete pendingIceCandidates[fromUserId];
            }
            if (signalData.sdp.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socketRef.current.emit(
                "signal",
                fromUserId,
                JSON.stringify({ sdp: pc.localDescription }),
              );
            }
          } catch (err) {
            console.error(err);
          }
        });

        socketRef.current.on("icecandidate", async (data, fromUserId) => {
          try {
            if (!data || !data.candidate) return;
            if (!connections[fromUserId]) {
              if (!pendingIceCandidates[fromUserId]) {
                pendingIceCandidates[fromUserId] = [];
              }
              pendingIceCandidates[fromUserId].push(data.candidate);
              return;
            }
            await connections[fromUserId].addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error(err);
          }
        });

        socketRef.current.on("user-left", async (disconnectedUserId) => {
          try {
            let disconnectedStream = streamsWithSocketId[disconnectedUserId];
            const index = allStreams.indexOf(disconnectedStream);
            if (index !== -1) {
              allStreams.splice(index, 1);
            }
            if (connections[disconnectedUserId]) {
              connections[disconnectedUserId].close();
              delete connections[disconnectedUserId];
            }
            delete streamsWithSocketId[disconnectedUserId];
            delete pendingIceCandidates[disconnectedUserId];
            window.dispatchEvent(new CustomEvent("stream_updated"));
          } catch (err) {
            console.error(err);
          }
        });
      });
    } catch (e) {
      console.log("Socket init notice:", e);
    }
  }

  const getPermission = async function () {
    if (window.localStream) return;
    let userMediaStream;
    try {
      userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      console.log(err);
    }
    if (!userMediaStream) {
      try {
        userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        console.log(err);
      }
    }
    if (!userMediaStream) {
      try {
        userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.log(err);
      }
    }
    if (userMediaStream) {
      window.localStream = userMediaStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = userMediaStream;
      }
      if (!allStreams.includes(userMediaStream)) {
        allStreams.push(userMediaStream);
      }
      setHasCamera(userMediaStream.getVideoTracks().length > 0);
      setHasMic(userMediaStream.getAudioTracks().length > 0);
    }
  };

  async function connect(create) {
    if (username.trim() === "") {
      toast.error("Please enter your name first");
      return;
    }
    if (!create && room.trim() === "") {
      toast.error("Please enter a room code");
      return;
    }

    setIsConnecting(true);
    await getPermission();

    if (!window.localStream) {
      toast.error("Camera or microphone permission is required to enter");
      setIsConnecting(false);
      return;
    }

    if (create && localStorage.getItem("token")) {
      try {
        let token = localStorage.getItem("token");
        await fetch(`${API}/meeting`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: roomId.current,
          }),
        });
      } catch (err) {
        console.log("Meeting record note:", err);
      }
    }

    toast.success("Entering studio...");
    await getMedia(create);
    window.username = username;
    localStorage.setItem("username", username);

    if (create) {
      navigate(`/room/${roomId.current}`);
    } else {
      navigate(`/room/${room.trim()}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    if (user && user.setLogin) {
      user.setLogin(false);
    }
    toast.success("Signed out");
    navigate("/");
  }

  return (
    <div className="glass-lobby-view">
      <div className="glass-lobby-grid">
        {/* Left Side: Liquid Glass Video Mirror */}
        <div className="glass-video-panel glass">
          <div className="glass-video-viewport">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
            />
            {/* Live Audio Activity Meter Bar */}
            <div className="glass-vu-meter-bar">
              <div 
                className="glass-vu-fill" 
                style={{ width: hasMic && micEnabled ? "65%" : "0%" }} 
              />
            </div>
          </div>

          <div className="glass-video-footer">
            <div className="glass-status-tag">
              <span className="glass-pulse-dot" />
              <span>{hasCamera ? "Camera Active" : "Camera Initializing"}</span>
            </div>

            <div className="glass-toggle-bar">
              <button
                className={`glass-toggle-pill tactile-btn ${!micEnabled ? "is-muted" : ""}`}
                onClick={togglePreviewMic}
                title="Toggle Mic Preview"
              >
                {micEnabled ? <Mic size={15} /> : <MicOff size={15} />}
                <span>{micEnabled ? "Mic On" : "Muted"}</span>
              </button>

              <button
                className={`glass-toggle-pill tactile-btn ${!videoEnabled ? "is-muted" : ""}`}
                onClick={togglePreviewVideo}
                title="Toggle Camera Preview"
              >
                {videoEnabled ? <Camera size={15} /> : <CameraOff size={15} />}
                <span>{videoEnabled ? "Video On" : "Off"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Liquid Glass Console Panel */}
        <div className="glass-console-panel glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link to="/" className="glass-back-btn tactile-btn" style={{ margin: 0 }}>
              <ArrowLeft size={14} />
              <span>Home</span>
            </Link>

            {user?.login && (
              <button
                onClick={handleLogout}
                className="glass-signout-btn tactile-btn"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          <div className="console-title-group">
            <h2>{user?.login && username ? `Welcome, ${username}` : "Studio Green Room"}</h2>
            <p>Verify your device preview before entering the conference room.</p>
          </div>

          <div className="console-button-stack">
            <div className="glass-input-wrapper">
              <label className="glass-input-label" htmlFor="lobbyName">
                <User size={14} />
                <span>Your Name in Call</span>
              </label>
              <input
                id="lobbyName"
                className="glass-input"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus={!username}
              />
            </div>

            <button
              className="btn-glass btn-glass-primary tactile-btn"
              disabled={isConnecting}
              onClick={async () => {
                roomId.current = uuidv4();
                setJoin(false);
                await connect(true);
              }}
            >
              <PlusCircle size={18} />
              <span>{isConnecting ? "Connecting..." : "Host Instant Meeting"}</span>
            </button>

            <button
              className="btn-glass btn-glass-secondary tactile-btn"
              onClick={() => setJoin((prev) => !prev)}
            >
              <LogIn size={17} />
              <span>{join ? "Hide Code Input" : "Join Existing Room"}</span>
            </button>

            {join && (
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <input
                  className="glass-input"
                  type="text"
                  placeholder="Paste room code..."
                  value={room}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      await connect(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  className="btn-glass btn-glass-primary tactile-btn"
                  disabled={isConnecting}
                  onClick={async () => {
                    await connect(false);
                  }}
                  style={{ padding: "0 20px", flexShrink: 0, gap: "6px" }}
                >
                  <span>Join</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Diagnostic checklist */}
            <div style={{ marginTop: "8px", padding: "14px", background: "rgba(10, 12, 18, 0.45)", borderRadius: "var(--r-md)", border: "1px solid var(--glass-edge)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Device Readiness
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", color: "var(--ink)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={14} color="var(--leaf)" />
                  <span>Microphone: {hasMic ? "Detected" : "Searching"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={14} color="var(--leaf)" />
                  <span>Camera: {hasCamera ? "Active" : "Searching"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={14} color="var(--leaf)" />
                  <span>Connection: Direct Peer-to-Peer</span>
                </div>
              </div>
            </div>

            {user?.login && (
              <button
                className="btn-glass btn-glass-secondary tactile-btn"
                style={{ width: "100%", marginTop: "4px" }}
                onClick={() => navigate("/history")}
              >
                <HistoryIcon size={16} />
                <span>View Meeting History</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoMeeting;
