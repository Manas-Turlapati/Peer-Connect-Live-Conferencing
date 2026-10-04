import {useEffect,useState} from "react";
import { leaveMeeting } from "./VideoMeeting";
import { useNavigate } from "react-router-dom";
function Room(){ 
  const navigate = useNavigate();
  let [streams,setStreams] = useState([...window.streams]);
  let [micOn, setMicOn] = useState(true);
  let [cameraOn, setCameraOn] = useState(true);
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
  }, []);
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
          <button onClick={()=>{leaveMeeting();navigate("/dummy")}}>
            Leave the Meeting
          </button>
        </div>
      </div>
    );
}
export default Room;