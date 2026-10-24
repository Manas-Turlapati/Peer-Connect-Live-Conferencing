import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { 
  Video, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Smile, 
  Radio, 
  LogIn,
  Mic,
  Camera,
  MessageSquare,
  PhoneOff
} from "lucide-react";

function Landing() {
  const navigate = useNavigate();
  const [quickName, setQuickName] = useState("");
  const [quickRoom, setQuickRoom] = useState("");

  function handleStartInstant() {
    if (!quickName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    const newRoomId = uuidv4();
    window.username = quickName.trim();
    localStorage.setItem("username", quickName.trim());
    navigate(`/room/${newRoomId}`);
  }

  function handleJoinCode() {
    if (!quickName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    if (!quickRoom.trim()) {
      toast.error("Please enter a room code");
      return;
    }
    window.username = quickName.trim();
    localStorage.setItem("username", quickName.trim());
    navigate(`/room/${quickRoom.trim()}`);
  }

  return (
    <div className="glass-landing">
      {/* Floating Island Navigation */}
      <header className="glass-nav-container">
        <nav className="glass-nav glass">
          <Link to="/" className="glass-brand">
            <div className="glass-brand-gem">
              <Video size={17} strokeWidth={2.5} />
            </div>
            <span className="glass-brand-name">
              Peer<span>Connect</span>
            </span>
          </Link>

          <div className="glass-nav-auth">
            <Link to="/dummy" className="btn-glass btn-glass-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              Lobby
            </Link>
            <Link to="/register" className="btn-glass btn-glass-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              Sign Up
            </Link>
            <Link to="/login" className="btn-glass btn-glass-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="glass-hero">
        <h1 className="glass-hero-title">
          Conferencing, distilled to <span>pure connection.</span>
        </h1>

        <p className="glass-hero-description">
          Direct, private video & audio calls right in your browser.
          No downloads, no account required to join, and no middleman servers storing your stream.
        </p>

        {/* Fast Action Launcher Card */}
        <div className="glass-launcher-card glass">
          <div className="launcher-grid">
            <div className="glass-input-wrapper">
              <label className="glass-input-label" htmlFor="heroName">
                Your Name
              </label>
              <input
                id="heroName"
                className="glass-input"
                type="text"
                placeholder="e.g. Alex"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
              />
            </div>

            <div className="glass-input-wrapper">
              <label className="glass-input-label" htmlFor="heroRoom">
                Room Code (Optional)
              </label>
              <input
                id="heroRoom"
                className="glass-input"
                type="text"
                placeholder="Paste room ID to join"
                value={quickRoom}
                onChange={(e) => setQuickRoom(e.target.value)}
              />
            </div>
          </div>

          <div className="launcher-actions">
            <button
              className="btn-glass btn-glass-primary"
              onClick={handleStartInstant}
            >
              <span>Start Instant Call</span>
              <ArrowRight size={17} />
            </button>

            <button
              className="btn-glass btn-glass-secondary"
              onClick={handleJoinCode}
            >
              <span>Join with Code</span>
            </button>
          </div>
        </div>

        {/* Live Stage Showcase */}
        <div className="glass-stage-card glass">
          <div className="stage-top-strip">
            <div className="stage-window-controls">
              <span className="stage-window-dot dot-close" />
              <span className="stage-window-dot dot-min" />
              <span className="stage-window-dot dot-max" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem", color: "var(--ink-dim)", letterSpacing: "0.06em" }}>
              LIVE CALL PREVIEW
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--leaf)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="glass-pulse-dot" />
              <span>ACTIVE</span>
            </div>
          </div>

          <div className="stage-body-content">
            <div className="stage-grid-preview">
              <div className="stage-video-tile">
                <img 
                  src="/pexels-steve-29101877.jpg" 
                  alt="Video participant preview"
                  onError={(e) => { e.currentTarget.src = "/mobile.png"; }}
                />
                <div className="stage-tile-badge">
                  <span>Marcus Vance (Speaking)</span>
                </div>
              </div>

              <div className="stage-video-tile">
                <img 
                  src="/pexels-steve-29708303.jpg" 
                  alt="Video participant preview 2"
                  onError={(e) => { e.currentTarget.src = "/mobile.png"; }}
                />
                <div className="stage-tile-badge">
                  <span>Elena Rostova</span>
                </div>
              </div>
            </div>

            <div className="stage-dock-bar glass">
              <div className="stage-dock-icon is-active"><Mic size={17} /></div>
              <div className="stage-dock-icon is-active"><Camera size={17} /></div>
              <div className="stage-dock-icon"><Smile size={17} /></div>
              <div className="stage-dock-icon"><MessageSquare size={17} /></div>
              <div className="stage-dock-icon is-danger"><PhoneOff size={17} /></div>
            </div>
          </div>
        </div>
      </main>

      {/* Architectural Bento Grid */}
      <section className="glass-bento-section">
        <div className="bento-header-block">
          <div className="bento-header-tag">Features</div>
          <h2 className="bento-main-title">Crafted for Smooth, Private Conversations</h2>
        </div>

        <div className="bento-layout-grid">
          <div className="glass-bento-card glass">
            <div className="bento-card-gem">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3>Direct Browser Encryption</h3>
              <p>
                Media streams route directly between peer browsers with zero interception. 
                Your conversations never touch or record onto centralized relay clouds.
              </p>
            </div>
          </div>

          <div className="glass-bento-card glass">
            <div className="bento-card-gem leaf-gem">
              <Smile size={22} />
            </div>
            <div>
              <h3>2D Floating Reaction Physics</h3>
              <p>
                Burst emojis into real-time space over the stage. 
                Express agreement, applause, or laughter without unmuting your audio.
              </p>
            </div>
          </div>

          <div className="glass-bento-card glass">
            <div className="bento-card-gem gold-gem">
              <Zap size={22} />
            </div>
            <div>
              <h3>Lightweight & Smooth</h3>
              <p>
                Optimized for fluid performance on phones, tablets, and laptops 
                without draining your battery or causing fan noise.
              </p>
            </div>
          </div>

          <div className="glass-bento-card glass">
            <div className="bento-card-gem">
              <Radio size={22} />
            </div>
            <div>
              <h3>Zero-Friction Room Access</h3>
              <p>
                Share a simple 6-character room code or full URL. Guests join 
                instantly without needing to create an account or install anything.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
