// WebRTC & Socket Connection Store
export const connections = {};
export const allStreams = [];
window.streams = allStreams;
export const streamsWithSocketId = {};
export const pendingIceCandidates = {};

export function leaveMeeting() {
  // Remove peer connections
  for (const id in connections) {
    if (connections[id]) {
      try {
        connections[id].close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
      delete connections[id];
    }
  }
  // Clear streams
  for (const id in streamsWithSocketId) {
    delete streamsWithSocketId[id];
  }
  // Clear pending candidates
  for (const id in pendingIceCandidates) {
    delete pendingIceCandidates[id];
  }
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
