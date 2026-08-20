import { useContext,useEffect,useRef} from "react";
import { UserContext } from "../MyContext.jsx";
import { useParams } from "react-router-dom";
function Room(){
    let videoRef = useRef(null);
    let {id} = useParams();
    useEffect(()=>{
        videoRef.current.srcObject = window.localStream;
    },[]);
    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: 300 }}
      ></video>
    );

}
export default Room;