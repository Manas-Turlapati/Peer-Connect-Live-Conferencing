import { useContext,useEffect,useRef,useState} from "react";
import { UserContext } from "../MyContext.jsx";
import { useParams } from "react-router-dom";
function Room(){
  let [stream,setStream] = useState([...window.streams]);
  console.log(stream);
  useEffect(()=>{
    const update = () => setStream([...window.streams]);
    window.addEventListener("stream_updated", update);
    update();
    return () => window.removeEventListener("stream_updated", update);
  },[])
  let streams = window.streams;
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
    </div>
  );
}
export default Room;