import {useRef,useState} from 'react';
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
//get the signalling server because 2 peers are not able to sajre
let server_url = "http://localhost:3000";
// connections = { "socketId123": pc1, "socketId456": pc2 }
//it is a purely js object that stores socketid and its pc pc is the peer connection
//pc is js object that contains local ip address,public ip which stun sends back
let connections = {};
let allStreams = [];
window.streams = allStreams;
let pendingIceCandidates = {};
//what stun server are we talking about now we declare the stun server which we are going to use
function VideoMeeting(){
    const navigate = useNavigate();
    let roomId = useRef("");
    var socketRef = useRef();
    //our video that we can see and remaining peoples we will define an array which is a ref means it doesnt render when the component renders
    let localVideoRef = useRef();
    //asking for username if someone logging as guest
    let [askForUsername,setAskForUsername] = useState(true);
    let [username,setUsername] = useState("");
    let[room,setRoomId] = useState("");
    let[join,setJoin] = useState(false);
    let getMedia = async(create)=>{
      connectToSocketServer(create);
    }
    function connectToSocketServer(create){
      socketRef.current = io(server_url);
      socketRef.current.on("connect", () => {
        
        let path = create?roomId.current:room;
        socketRef.current.emit("join-call",path);
        socketRef.current.on("user-joined",async (remotePeerId) => {
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
          connections[remotePeerId] = rtcpeerConnection;
          //connections[toUserId] contains ur rtcPeerConfiguartion only
          //iv)adding the tracks to the rtcPeerConnections
          const userArray = window.localStream.getTracks();
          
          userArray.forEach((el) => {
            connections[remotePeerId].addTrack(el, window.localStream);
          });
          connections[remotePeerId].ontrack = (event)=>{
          const remoteStream = event.streams[0];
              if(remoteStream && !allStreams.some((stream)=>stream.id===remoteStream.id)){
                allStreams.push(remoteStream);
                window.dispatchEvent(new CustomEvent("stream_updated"))
              }
          }
          //listening on the ice servers
          connections[remotePeerId].onicecandidate = (event)=>{
            if(event.candidate){
              socketRef.current.emit("icecandidate",remotePeerId,{
                type:"ice-candidate",
                candidate:event.candidate
              })
            }
          }
          //making the sdp session descrption protocol negotiation which means sending an offer and receiving the answer
          //i)creating the offer and setting the local description means telling the packet that its offer not answer
          const offer = await connections[remotePeerId].createOffer();
          await connections[remotePeerId].setLocalDescription(offer);
          //ii)sending the offer to the other peer via signalling server which is ur socketRef.current is the signalling server
          //from the other server side the client sends the answer so we can confirm that the sdp negotiation is established
          socketRef.current.emit(
            "signal",
            remotePeerId,
            JSON.stringify({ sdp: connections[remotePeerId].localDescription }),
          );

        });
       
        socketRef.current.on("signal", async (fromUserId, data) => {
          // console.log(fromUserId);
          try {
            //fromuserID means peer2's id which while sending we have established the connections which means connections[fromUserId] is nothing but peer1 current rtcpc
            let pc = connections[fromUserId];
            const signalData = JSON.parse(data);
            if (!pc) {
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
              connections[fromUserId] = rtcpeerConnection;
              pc = rtcpeerConnection;
              //connections[toUserId] contains ur rtcPeerConfiguartion only
              //iv)adding the tracks to the rtcPeerConnections
              const userArray = window.localStream.getTracks();
              userArray.forEach((el) => {
                connections[fromUserId].addTrack(el, window.localStream);
              });
              connections[fromUserId].ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (
                  remoteStream &&
                  !allStreams.some((stream) => stream.id === remoteStream.id)
                ) {
                  allStreams.push(remoteStream);
                  window.dispatchEvent(new CustomEvent("stream_updated"));
                }
              };
              //listening on the ice servers
              connections[fromUserId].onicecandidate = (event) => {
                if (event.candidate) {
                  socketRef.current.emit("icecandidate",fromUserId, {
                    type: "ice-candidate",
                    candidate: event.candidate,
                  });
                }
              };
            }
            await pc.setRemoteDescription(
              new RTCSessionDescription(signalData.sdp),
            );
            if (pendingIceCandidates[fromUserId]) {
              for (const candidate of pendingIceCandidates[fromUserId]) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } 
              delete pendingIceCandidates[fromUserId];
            }

            if(signalData.sdp.type === "offer") {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              // console.log(pc);
              socketRef.current.emit(
                "signal",
                fromUserId,
                JSON.stringify({ sdp: pc.localDescription }),
              );
            }
            else if(signalData.sdp.type === "answer") {
              // console.log(connections[fromUserId]);
              console.log("SDP negotiation completed");
            }
          }catch (err) {
            console.log(err);
          }
        });
        socketRef.current.on("icecandidate", async (data, fromUserId) => {
          try {
            if(!data||!data.candidate) return;
            if (!connections[fromUserId]) {
              if (!pendingIceCandidates[fromUserId]) {
                pendingIceCandidates[fromUserId] = [];
              }
              pendingIceCandidates[fromUserId].push(data.candidate);

              console.log("ICE candidate queued for:", fromUserId);
              return;
            }
            if (data && data.candidate) {
              await connections[fromUserId].addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (err) {
            console.log(err); 
          }
        });
        socketRef.current.emit("chat-message","Hi!Everyone I am Manas",askForUsername?username:"");
      });

    }
    let getPermission = async function(){ 
      let userMediaStream;
      try{
        userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio:true
        });
      }
      catch(err){
        console.log(err);
      }
      if (!userMediaStream) {
        try {
          userMediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch (err) {
          console.log(err);
        }
      }

      // 3. if that failed too, try mic only
      if (!userMediaStream) {
        try {
          userMediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        } catch (err) {
          console.log(err);
        }
      }
      if(userMediaStream){
        window.localStream = userMediaStream;//here localVideoRef.current means <video> dom element
        localVideoRef.current.srcObject= userMediaStream;
        allStreams.push(userMediaStream);
      }
    }
    
    
    
    async function connect(create){
      setAskForUsername(false);
      if(username===""){
        setAskForUsername(true);
        toast.error("Username is required!")
        return;
      }
      await getPermission();
      if(!window.localStream){
        toast.error("Access Denied!");
        return;
      }
      toast.success("Connection Successfull!");

      await getMedia(create);
      create?navigate(`/room/${roomId.current}`):navigate(`/room/${room}`);
    }
    return (
      <div>
        <h1>Enter the lobby</h1>
        <br />
        <TextField
          id="outlined-basic"
          label="Enter the Name"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <br />
        <Button
          variant="contained"
          style={{ margin: "12px" }}
          onClick={async()=>{
            roomId.current = uuidv4();
            setJoin(false);
          
            await connect(true);
          }}
          
        >
          Create
        </Button>
        <Button
          variant="contained"
          onClick={() =>{ 
            setJoin(true);
          }}
          style={{ margin: "12px" }}
        >
          Join
        </Button>
        <br />
        {join && (
          <>
            <TextField
              id="outlined-basic"
              label="Enter Room ID"
              variant="outlined"
              value={room}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <Button
              variant="contained"
              style={{ margin: "12px" }}
              onClick={async()=>{await connect(false)}}
            >Connect</Button>
          </>
        )}
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