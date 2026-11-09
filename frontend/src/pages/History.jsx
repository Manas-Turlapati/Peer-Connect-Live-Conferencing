import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  Calendar, 
  Copy, 
  Check, 
  ExternalLink,
  Video
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function History() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      toast.error("Please login to view history");
      navigate("/login");
      return;
    }
    let display = async function () {
      try {
        let res = await fetch(`${API}/meeting`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        let historyData = await res.json();
        if (res.ok) {
          setData(historyData.data || []);
        } else {
          setData([]);
        }
      } catch (err) {
        console.log("History fetch note:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    display();
  }, [token, navigate]);

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    toast.success("Room code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <main className="glass-lobby-view">
      <section className="glass-history-panel glass">
        <div className="glass-history-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              to="/dummy"
              className="glass-back-btn tactile-btn"
              style={{ margin: 0, padding: "6px 14px" }}
              title="Back to Green Room"
            >
              <ArrowLeft size={15} />
              <span>Lobby</span>
            </Link>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              Session History
            </h1>
          </div>

          <div className="room-people-pill glass">
            <Video size={13} color="var(--leaf)" />
            <span>{data.length} Total</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-dim)" }}>
            <p>Loading your past meetings...</p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-dim)" }}>
            <HistoryIcon size={36} color="var(--gold)" style={{ marginBottom: "14px" }} />
            <h3 style={{ color: "var(--ink)", marginBottom: "6px", fontFamily: "var(--font-display)" }}>
              No previous meetings recorded
            </h3>
            <p style={{ fontSize: "0.9rem", maxWidth: "340px", margin: "0 auto 20px", color: "var(--ink-dim)" }}>
              Meetings you host while signed in will be archived here with one-click rejoin codes.
            </p>
            <button
              className="btn-glass btn-glass-primary tactile-btn"
              onClick={() => navigate("/dummy")}
            >
              Host a Meeting Now
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.map((el) => {
              const meetingCode = el.meetingCode || el._id;
              const formattedDate = el.date 
                ? new Date(el.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) 
                : "Recent Session";

              return (
                <div key={el._id} className="glass-history-item">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem", color: "var(--sky)" }}>
                      {meetingCode}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--ink-dim)" }}>
                      <Calendar size={13} />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      className="btn-glass btn-glass-secondary tactile-btn"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => copyCode(meetingCode)}
                      title="Copy Code"
                    >
                      {copiedId === meetingCode ? <Check size={13} color="var(--leaf)" /> : <Copy size={13} />}
                      <span>{copiedId === meetingCode ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      className="btn-glass btn-glass-primary tactile-btn"
                      style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      onClick={() => navigate(`/room/${meetingCode}`)}
                      title="Rejoin Room"
                    >
                      <span>Join</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default History;
