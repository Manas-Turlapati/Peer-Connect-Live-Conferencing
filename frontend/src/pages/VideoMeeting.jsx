import {React,useRef,useState,useEffect} from 'react';
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Experimental_CssVarsProvider } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
//get the signalling server because 2 peers are not able to sajre
let server_url = "http://localhost:3000";
// connections = { "socketId123": pc1, "socketId456": pc2 }
//it is a purely js object that stores socketid and its pc pc is the peer connection
//pc is js object that contains local ip address,public ip which stun sends back
let connections = {};
//what stun server are we talking about now we declare the stun server which we are going to use



function VideoMeeting(){
    const navigate = useNavigate();
    let roomId = uuidv4();
    var socketRef = useRef();
    //socket id we will store our id
    let socketIdRef = useRef();
    //our video that we can see and remaining peoples we will define an array which is a ref means it doesnt render when the component renders
    let localVideoRef = useRef();
    //switching for the video permission
    let [videoPermission,setVideoPermission] = useState(true);//.
    //switching on and off audio permission
    let [audioPermission,setAudioPermission] = useState(true);//.
    //switching on and off video
    let [video,setVideo] = useState(true);
    //switching on and off audio
    let [audio,setAudio] = useState(true);
    //switching on and off screen share
    let [screenShare,setScreenShare] = useState();
    //showing options like pop up below
    let [popup,showPop] = useState();
    //screenshare available because when one person share screen others cannot 
    let [screenShareAvailable,setScreenShareAvailable] = useState(false);
    //all the messages from all the clients
    let [messages,setMessages] = useState([]);
    //the message that we are going to write
    let [message,setMessage] = useState("");
    //message notification that new message has been occured
    let [newMessageNotification,setnewMessageNotification] = useState(0);
    //asking for username if someone logging as guest
    let [askForUsername,setAskForUsername] = useState(true);
    let [username,setUsername] = useState("");
    let [videos,setVideos] = useState([]);
    // if(isChrome()===false){
    // }connect
    let videoStream = null;
    let audioStream = null;
    
    
    //step1 is to get the iceservers from anywhere
    async function fetchData() {
      let res = await fetch("http://localhost:3000/turn");
      let val = await res.json();
      //step1
      let peerConfigConnections = {
        iceServers: val.data,
      };
      console.log(peerConfigConnections);
      //step2 is to save these iceservers such that u are telling the browser to store these servers because they will be used in future

      const peerConnection = new RTCPeerConnection(peerConfigConnections);
      console.log(peerConnection);
    }
    fetchData();
    // const peerConnection = RTCPeerConnection(peerConfigConnections);
  

    let getUserMedia = ()=>{
      if((audioPermission&&audio)||(video&&videoPermission)){
        navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(()=>{
          getUserMediaSuccess();
        })
        .then((stream)=>{
        })
        .catch((err)=>{
          console.log(err);
        })
      }else{
        try{
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((e)=>e.stop());
        }
        catch(err){
          console.log(err);
        }
      
      }
    }
    
    let getMedia = async()=>{
      setVideo(videoPermission);
      setAudio(audioPermission);
      connectToSocketServer();
    }
    function connectToSocketServer(){
      socketRef.current = io(server_url);
      socketRef.current.on("connect", () => {
        console.log(`${socketRef.current.id} is connected with the frontend successfully`);
        socketRef.current.emit("join-call",roomId);
        socketRef.current.emit("signal",socketRef.current.id,"signal has been sent successfully");
        socketRef.current.emit("chat-message","Hi!Everyone I am Manas",askForUsername?username:"");
      });
    }
    let getPermission = async function(){
      try{
        try{
          videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          //video permission
          if (videoStream) {
            setVideoPermission(true);
          } else {
            setVideoPermission(false);
          }
        }
        catch(err){
          console.log(err);
        }
        try{
          audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          //audio permission
          if (audioStream) {
            setAudioPermission(true);
          } else {
            setAudioPermission(false);
          }
        }
        
        catch(err){
          console.log(err);
        }
        //combined stream both audio and video
        //here videoStream only works videoPermission and audioPermission only works after rerender until then they are unknown 
        //so we use !!videoStream and !!audioStream to exactly get when we need to send the userMedia
        let userMediaStream;
        if(videoStream||audioStream){
          try{
            userMediaStream = await navigator.mediaDevices.getUserMedia({
              video:!!videoStream,
              audio:!!audioStream,
            });
          }
          catch(err){
            console.log(err);
          }
        }
        if(userMediaStream){
          window.localStream = userMediaStream;//when u navigate from one page to other page we use navigator so what happens is the the dom element which is stored in the useRef.current that is your video tag gets destroyed and u cant pass the ref as a state variable so we need to pass the stream so to store the  stream i have used window.localStream so its like somewhat similar to the localStorage like u can access from the other page as stream = window.localStream
          //here localVideoRef.current means <video> dom element
          localVideoRef.current.srcObject= userMediaStream;

        }
      }
      catch(err){
        console.log(err);
      }
    }
    async function connect(){
      setAskForUsername(false);
      if(username===""){
        setAskForUsername(true);
        toast.error("Username is required!")
        return;
      }
      toast.success("Connection Successfull!");
      
      await getPermission();
      await getMedia();
      setTimeout(()=>{
        navigate(`/room/${roomId}`);
      },5000)
    }
    return (
      <div>
        <h1>Enter the lobby</h1>
        <br />
        <TextField
          id="outlined-basic"
          label="Outlined"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <br />
        <Button variant="contained" onClick={connect}>
          Connect
        </Button>
        <br />
        <br />
        <div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: 300 }}
          />
        </div>
      </div>
    );
}
export default VideoMeeting;