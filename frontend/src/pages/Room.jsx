import {useEffect,useState} from "react";
import { leaveMeeting } from "./VideoMeeting";
import { useNavigate } from "react-router-dom";
import './Room.css';
function Room(){ 
  const navigate = useNavigate();
  let [streams,setStreams] = useState([...window.streams]);
  let [micOn, setMicOn] = useState(true);
  let [cameraOn, setCameraOn] = useState(true);
  let [chatToggle,setchatToggle] = useState(false); 
  let [chatMessages,setChatMessages] = useState([]);
  let [input,setInput] = useState("");
  useEffect(()=>{
    const update = () => setStreams([...window.streams]);
    window.addEventListener("stream_updated", update);
    update();
    return () => window.removeEventListener("stream_updated", update);
  },[])
  useEffect(() => {
    if (!window.localStream) {
      navigate("/dummy");
    }
  },[]);
  useEffect(()=>{
    const socket = window.socket;
    if(!socket){
      console.log("socket not available");
      return;
    }
    const receiveMessage = (data, sender, socketIdSender) => {
      console.log("CHAT RECEIVED:", data, sender);
      setChatMessages((prev) => [
        ...prev,
        {
          data: data,
          sender: sender,
          socketIdSender: socketIdSender,
        },
      ]);
    };
    socket.on("chat-message",receiveMessage)
    return () => {
      socket.off("chat-message", receiveMessage);
    };
  },[])
  let audioTrack = window.localStream?.getAudioTracks()[0];
  let videoTrack = window.localStream?.getVideoTracks()[0];
  function toggleMic(){
    if(!audioTrack){
      return;
    }
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  }
  function toggleCamera(){
    if(!videoTrack){
      return;
    }
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  }
  function sendMessage(e){
    e.preventDefault();
    const socket = window.socket;
    if(!socket){
      return;
    }
    const username = window.username;
    if(!username){
      console.log("username is not defined");
      return;
    }
    
    const message = input.trim();
    if (!message) {
      return;
    }
    console.log(input);
    socket.emit("chat-message",message,username);
    setInput("");
  }
  
    return (
      <div>
        {streams.map((stream, index) => (
          <video
            key={stream.id}
            autoPlay
            playsInline
            muted={index === 0}
            ref={(video) => {
              if (video && video.srcObject !== stream) {
                video.srcObject = stream;
              }
            }}
          />
        ))}
        <div>
          <button onClick={toggleMic} disabled={!audioTrack}>
            {micOn ? "Mute" : "Unmute"}
          </button>
          <button onClick={toggleCamera} disabled={!videoTrack}>
            {cameraOn ? "Camera Off" : "Camera On"}
          </button>
          <button
            onClick={() => {
              leaveMeeting();
              navigate("/dummy");
            }}
          >
            Leave the Meeting
          </button>
          <button
            onClick={() => {
              setchatToggle(!chatToggle);
            }}
          >
            Chat
          </button>
          {chatToggle && (
            <div className="chat-container">
              <div className="chat-header">
                <h3>Chat</h3>
                <button onClick={() => setChatToggle(false)}>✕</button>
              </div>
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="chat-message">
                    <strong>{msg.sender}</strong>
                    <i>
                      <p style={{ color: "black" }}>{msg.data}</p>
                    </i>
                  </div>
                ))}
              </div>
              <form className="chat-input" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(el) => setInput(el.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
}
export default Room;