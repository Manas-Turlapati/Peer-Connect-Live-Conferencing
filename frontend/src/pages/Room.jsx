import React, { useEffect, useState, useRef, useCallback } from "react";
import { leaveMeeting } from "../webrtc.js";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import "./Room.css";
import {
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  MessageSquare,
  Copy,
  Check,
  X,
  Send,
  Users,
  Smile
} from "lucide-react";

function Room() {
  const navigate = useNavigate();
  const { id } = useParams();
  const messagesEndRef = useRef(null);

  const [streams, setStreams] = useState([...(window.streams || [])]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [chatToggle, setChatToggle] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const triggerFloatingReaction = useCallback((emoji, sender) => {
    const reactionId = Date.now() + Math.random();
    const xPos = Math.floor(Math.random() * 60) + 20; // 20% to 80% screen width
    setFloatingReactions((prev) => [
      ...prev,
      { id: reactionId, emoji, sender, left: `${xPos}%` },
    ]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3000);
  }, []);

  // Sync streams with global WebRTC state
  useEffect(() => {
    const update = () => {
      setStreams([...(window.streams || [])]);
    };
    window.addEventListener("stream_updated", update);
    update();
    return () => window.removeEventListener("stream_updated", update);
  }, []);

  // Guard: if no local stream, redirect to lobby
  useEffect(() => {
    if (!window.localStream) {
      navigate("/dummy");
    }
  }, [navigate]);

  // Socket chat & reaction listener
  useEffect(() => {
    const socket = window.socket;
    if (!socket) {
      console.log("Socket not available for chat");
      return;
    }
    const receiveMessage = (data, sender, socketIdSender) => {
      if (typeof data === "string" && data.startsWith("[reaction]:")) {
        const emoji = data.replace("[reaction]:", "");
        triggerFloatingReaction(emoji, sender);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          data: data,
          sender: sender,
          socketIdSender: socketIdSender,
        },
      ]);

      setChatToggle((isOpen) => {
        if (!isOpen) {
          setUnreadCount((count) => count + 1);
        }
        return isOpen;
      });
    };

    socket.on("chat-message", receiveMessage);
    return () => {
      socket.off("chat-message", receiveMessage);
    };
  }, [triggerFloatingReaction]);

  // Auto-scroll chat to latest
  useEffect(() => {
    if (chatToggle && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatToggle]);

  function sendReaction(emoji) {
    const socket = window.socket;
    const username = window.username || "Anonymous";
    triggerFloatingReaction(emoji, username);

    if (socket) {
      socket.emit("chat-message", `[reaction]:${emoji}`, username);
    }
    setShowReactions(false);
  }

  function toggleMic() {
    const track = window.localStream?.getAudioTracks()[0];
    if (!track) {
      toast.error("Microphone track not found");
      return;
    }
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
    toast(track.enabled ? "Microphone Unmuted" : "Microphone Muted", {
      icon: track.enabled ? "🎙️" : "🔇",
    });
  }

  function toggleCamera() {
    const track = window.localStream?.getVideoTracks()[0];
    if (!track) {
      toast.error("Video track not found");
      return;
    }
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
    toast(track.enabled ? "Camera Turned On" : "Camera Turned Off", {
      icon: track.enabled ? "📹" : "🚫",
    });
  }

  function sendMessage(e) {
    e.preventDefault();
    const socket = window.socket;
    if (!socket) {
      toast.error("Socket connection lost");
      return;
    }
    const username = window.username || "Anonymous";
    const message = input.trim();
    if (!message) return;

    socket.emit("chat-message", message, username);
    setInput("");
  }

  function copyRoomCode() {
    if (id) {
      const inviteUrl = window.location.href;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Meeting link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleLeave() {
    leaveMeeting();
    toast("You left the meeting", { icon: "👋" });
    navigate("/dummy");
  }

  function handleChatToggle() {
    setChatToggle((prev) => {
      if (!prev) {
        setUnreadCount(0);
      }
      return !prev;
    });
  }

  const streamCount = streams.length || 1;
  const gridClass =
    streamCount === 1 ? "grid-1" : streamCount === 2 ? "grid-2" : "grid-n";

  const hasAudioTrack = Boolean(window.localStream?.getAudioTracks().length);
  const hasVideoTrack = Boolean(window.localStream?.getVideoTracks().length);

  return (
    <div className="glass-room-layout">
      {/* 2D Floating Reactions Overlay */}
      <div className="glass-reactions-container" aria-hidden="true">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="glass-floating-reaction glass"
            style={{ left: r.left }}
          >
            <span>{r.emoji}</span>
            <span className="floating-reaction-name">{r.sender}</span>
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="glass-room-header glass">
        <div className="room-brand-group">
          <div className="room-brand-gem">
            <Video size={18} />
          </div>
          <div className="room-code-pill glass">
            <span>Room:</span>
            <span className="room-code-highlight">{id}</span>
            <button className="room-copy-action" onClick={copyRoomCode} title="Copy meeting link">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        <div className="room-people-pill glass">
          <Users size={14} />
          <span>{streamCount} in room</span>
        </div>
      </header>

      {/* Main Video Stage */}
      <main className="glass-room-stage">
        <div className={`video-grid ${gridClass}`}>
          {streams.map((stream, index) => {
            const isLocal = index === 0;
            const displayName = isLocal
              ? `${window.username || "You"} (You)`
              : `Participant ${index}`;

            return (
              <div
                key={stream.id || index}
                className={`glass-video-card glass ${isLocal ? "is-self" : ""}`}
              >
                {/* Fallback avatar when camera is toggled off */}
                {isLocal && !cameraOn ? (
                  <div className="camera-off-overlay">
                    <div className="glass-avatar-circle">
                      {(window.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <span className="avatar-caption">Camera off</span>
                  </div>
                ) : (
                  <video
                    autoPlay
                    playsInline
                    muted={isLocal}
                    ref={(videoEl) => {
                      if (videoEl && videoEl.srcObject !== stream) {
                        videoEl.srcObject = stream;
                      }
                    }}
                  />
                )}

                {/* Participant badge */}
                <div className="participant-overlay-pill glass">
                  <span
                    className={`participant-mic-status ${
                      isLocal && !micOn ? "is-muted" : "is-active"
                    }`}
                  >
                    {isLocal && !micOn ? <MicOff size={12} /> : <Mic size={12} />}
                  </span>
                  <span>{displayName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Bottom Floating Controls */}
      <nav className="glass-controls-dock glass">
        <button
          className={`dock-control-btn tactile-btn ${!micOn ? "is-muted" : ""}`}
          onClick={toggleMic}
          disabled={!hasAudioTrack}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic size={19} /> : <MicOff size={19} />}
        </button>

        <button
          className={`dock-control-btn tactile-btn ${!cameraOn ? "is-muted" : ""}`}
          onClick={toggleCamera}
          disabled={!hasVideoTrack}
          title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        >
          {cameraOn ? <Camera size={19} /> : <CameraOff size={19} />}
        </button>

        {/* 2D Emoji Reaction Trigger */}
        <div style={{ position: "relative" }}>
          <button
            className={`dock-control-btn tactile-btn ${showReactions ? "is-active" : ""}`}
            onClick={() => setShowReactions((prev) => !prev)}
            title="Send Reaction"
          >
            <Smile size={19} />
          </button>

          {showReactions && (
            <div className="glass-reaction-popover glass">
              {["👏", "❤️", "🔥", "🎉", "👍", "👋"].map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-emoji-btn"
                  onClick={() => sendReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="dock-control-btn tactile-btn"
          onClick={copyRoomCode}
          title="Share Meeting Link"
        >
          {copied ? <Check size={18} color="var(--leaf)" /> : <Copy size={18} />}
        </button>

        <button
          className={`dock-control-btn tactile-btn ${chatToggle ? "is-active" : ""}`}
          onClick={handleChatToggle}
          title="In-call Chat"
        >
          <MessageSquare size={19} />
          {unreadCount > 0 && !chatToggle && (
            <span className="dock-unread-counter">{unreadCount}</span>
          )}
        </button>

        <button
          className="dock-control-btn is-leave tactile-btn"
          onClick={handleLeave}
          title="Leave Meeting"
        >
          <PhoneOff size={18} />
          <span>Leave</span>
        </button>
      </nav>

      {/* Slide-out Chat Drawer */}
      {chatToggle && (
        <aside className="glass-chat-drawer glass">
          <div className="chat-top-header">
            <h3>
              <MessageSquare size={17} color="var(--sky)" />
              <span>Messages</span>
            </h3>
            <button
              className="chat-close-btn tactile-btn"
              onClick={() => setChatToggle(false)}
              aria-label="Close Chat"
            >
              <X size={17} />
            </button>
          </div>

          <div className="chat-messages-scroll">
            {chatMessages.length === 0 ? (
              <div className="chat-empty-hint">
                <p>No messages yet.</p>
                <p style={{ fontSize: "0.78rem" }}>Say hello to everyone in the room!</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.sender === window.username;
                return (
                  <div
                    key={index}
                    className={`glass-chat-bubble ${isMe ? "is-outgoing" : "is-incoming"}`}
                  >
                    <span className="bubble-sender-title">
                      {isMe ? "You" : msg.sender}
                    </span>
                    <p className="bubble-message-text">{msg.data}</p>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              type="text"
              className="chat-input-text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send-btn tactile-btn"
              disabled={!input.trim()}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}

export default Room;
