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
        socketRef.current.on("user-joined",async (toUserId) => {
          let res = await fetch("http://localhost:3000/turn");
          let val = await res.json();
          //creating the rtc peer connection on the both sides
          //i)configuring the rtcpeerconncetion
          let peerConfigConnections = {
            iceServers: val.data,
          };
          //ii)establishing the rtcPeerConnections between the peers
          const rtcpeerConnection = new RTCPeerConnection(
            peerConfigConnections,
          );
          //iii)store in connections with key as the remote peer's id and object as the rtcpc object because u want to know which config u have used to connect with them
          //so first of all peer1 does peer2id:rtcpcobject of peer1 and peer2 does is peer1id:rtcpc object of peer2
          connections[toUserId] = rtcpeerConnection;
          //connections[toUserId] contains ur rtcPeerConfiguartion only
          //iv)adding the tracks to the rtcPeerConnections
          const userArray = window.localStream.getTracks();
          userArray.forEach((el) => {
            connections[toUserId].addTrack(el, window.localStream);
          });
          //listening on the ice servers
          connections[toUserId].onicecandidate = (event)=>{
            if(event.candidate){
              socketRef.current.emit("icecandidate",toUserId,{
                type:"ice-candidate",
                candidate:event.candidate
              })
            }
          }
          
          //making the sdp session descrption protocol negotiation which means sending an offer and receiving the answer
          //i)creating the offer and setting the local description means telling the packet that its offer not answer
          const offer = await connections[toUserId].createOffer();
          await connections[toUserId].setLocalDescription(offer);
          //ii)sending the offer to the other peer via signalling server which is ur socketRef.current is the signalling server
          //from the other server side the client sends the answer so we can confirm that the sdp negotiation is established
          socketRef.current.emit(
            "signal",
            toUserId,
            JSON.stringify({ sdp: connections[toUserId].localDescription }),
          );
        });
        socketRef.current.on("signal", async (fromUserId, data) => {
          try {
            //fromuserID means peer2's id which while sending we have established the connections which means connections[fromUserId] is nothing but peer1 current rtcpc
            const pc = connections[fromUserId];
            const signalData = JSON.parse(data);
            await pc.setRemoteDescription(signalData.sdp);
            if(signalData.sdp.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socketRef.current.emit(
                "signal",
                fromUserId,
                JSON.stringify({ sdp: pc.localDescription }),
              );
            }
            else if(signalData.sdp.type === "answer") {
              console.log("SDP negotiation completed");
            }
          }catch (err) {
            console.log(err);
          }
        });
        socketRef.current.on("icecandidate", async (data, fromUserId) => {
          try {
            if (data && data.candidate) {
              await connections[fromUserId].addIceCandidate(data.candidate);
            }
          } catch (err) {
            console.log(err);
          }
        });
        socketRef.current.emit("join-call",roomId);
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