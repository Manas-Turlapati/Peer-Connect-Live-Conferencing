import { useContext,useEffect,useRef} from "react";
import { UserContext } from "../MyContext.jsx";
import { useParams } from "react-router-dom";
function Room(){
  const streams = window.streams;
  console.log(
    "Streams being rendered:",
    streams.map((stream) => stream.id),
  );
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