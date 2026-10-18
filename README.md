# Peer Connect

Real-time video conferencing in the browser, built on WebRTC with a Socket.io signaling server.

🔗 **Live demo:** `<your-deployed-url>`

## Features

- Peer-to-peer video and audio calls over WebRTC
- Create or join a room with a room ID
- In-call live chat
- Mic and camera toggle
- Meeting history list
- STUN and TURN servers for connecting across restrictive networks (NAT/firewalls)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React |
| Backend | Node.js, Express |
| Real-time signaling | Socket.io |
| Media | WebRTC (`RTCPeerConnection`, `getUserMedia`) |
| NAT traversal | STUN + TURN (ICE) |

## Flow Diagram
<img width="1536" height="1024" alt="Complete WebRTC Flow Infographic" src="https://github.com/user-attachments/assets/00f91b95-1d0a-4d57-a6f4-55bf9d6335f8" />



## How It Works

1. A user joins a room, and the browser requests camera and mic access via `getUserMedia`.
2. Socket.io relays the signaling data (offer, answer, ICE candidates) between peers.
3. Peers establish an `RTCPeerConnection` and stream media directly to each other.
4. If a direct connection fails, the TURN server relays the media.

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/<your-username>/Peer-Connect-Live-Conferencing.git
cd Peer-Connect-Live-Conferencing

# backend
cd server
npm install

# frontend
cd ../client
npm install
```

### Environment Variables

Create `.env` files:

**server/.env**
```env
PORT=5000
CLIENT_URL=http://localhost:3000
```

**client/.env**
```env
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_STUN_URL=<stun-server-url>
REACT_APP_TURN_URL=<turn-server-url>
REACT_APP_TURN_USERNAME=<username>
REACT_APP_TURN_CREDENTIAL=<credential>
```

### Run

```bash
# terminal 1
cd server
npm start

# terminal 2
cd client
npm start
```

Open `http://localhost:3000` in two browser tabs and join the same room.

## Project Structure
