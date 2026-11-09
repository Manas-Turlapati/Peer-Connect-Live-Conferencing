// WebRTC & Socket Connection Store using Map to prevent prototype pollution
export const connections = new Map();
export const allStreams = [];
window.streams = allStreams;
export const streamsWithSocketId = new Map();
export const pendingIceCandidates = new Map();

export function leaveMeeting() {
  // Remove peer connections
  for (const pc of connections.values()) {
    if (pc) {
      try {
        pc.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
  connections.clear();
  streamsWithSocketId.clear();
  pendingIceCandidates.clear();

  // Stop local media tracks
  if (window.localStream) {
    for (const track of window.localStream.getTracks() || []) {
      track.stop();
    }
  }
  window.localStream = undefined;
  if (window.socket) {
    window.socket.disconnect();
    window.socket = null;
  }
  allStreams.length = 0;
}
