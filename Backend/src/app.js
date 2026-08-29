require("dotenv").config();
const userRouter = require("./routes/user.js");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express(); //to communicate
app.use(express.json()); //transalator from client to server
app.use(cors({ origin: "*" })); //to make the req acceptable cross origin resource sharing
const url = process.env.MONGODB_URI;
const port = process.env.PORT;
app.use(express.urlencoded({ limit: "4kb", extended: true }));
app.get("/home", async (req, res) => {
  return res.json({ name: "manas" });
});
app.get("/getTurn",async(req,res)=>{
  let obj = await fetch(
    `https://teja-webrtc.metered.live/api/v1/turn/credential?secretKey=${process.env.TURN_SECRET}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expiryInSeconds: 3600,
        label: "exampleLabel",
      }),
    },
  );
  let val = await obj.json();
  res.json(val);
})
app.get("/turn",async(req,res)=>{
  let turnObj = await fetch(
    `https://teja-webrtc.metered.live/api/v1/turn/credentials?apiKey=${process.env.TURN_API}`,
  );
  let turnServers = await turnObj.json();
  res.json({data:turnServers});
})
//creating a server and connecting it with app
const http = require("http");
const server = http.createServer(app);
//connecting socketio with the server we created because socketio needs server so we created and
const socketio = require("socket.io");
const io = socketio(server, {
  cors: {
    origin: "*", // or your frontend URL like "http://localhost:3000"
    methods: ["GET", "POST"],
    allowedHeaders:["*"],
    credentials:true
  },
});
mongoose
  .connect(url)
  .then(() => {
    console.log("Mongodb connected successfully");
    //server is listening
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
//connection created between the server and client
let connections = {};//it stores rooms and who is in that room like 
// connections = {
//       room_id_1 or path1 : [client1,client2,client3],
//       room_id_2 or path2 :[client4,client5,client6]
// }
let messages = {};
// messages = {
//  room1:[
//    { "data": "hey!", sender: "John", "socket-id-sender": "xK92mA3b" },
//    { "data": "hello!", sender: "Sarah", "socket-id-sender": "pL73nB9c" },
//  ],
//};
let time = {};
io.on("connection", (socket) => {
    console.log(`${socket.id} is connected with the backend successfully`);
    socket.on("join-call",(path)=>{
      //these all below things happens when the user joins the call
      if (connections[path] == undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      
      console.log(path+"This is from the backend");
      // {
      //   sdifboifnqoifnasond23:[
      //        63ngMY4oOzwXt3luAAAB,Aj1bltpzDI1cTQevAAAB,.......
      //   ],
      //
      // }
      time[path] = new Date();
      //to send the message that new user joined to all the clients that are connected to the specific room
      connections[path].forEach((element) => {
        console.log(element+" "+socket.id);
        if(element!==socket.id){
          io.to(element).emit("user-joined", socket.id);
        }
      });
      if (messages[path] !== undefined) {
        //to send all messages to the curr client of the specific room he joined like all clients messages including the prev ones
        //server side we have to emit
        //client side he will listen on "chat-message"
        //sending all the messages to curr user
        messages[path].forEach((el) => {
          io.to(socket.id).emit(
            "chat-message",
            el["data"],
            el["sender"],
            el["socket-id-sender"],
          );
        });
      }
    })
    
    socket.on("chat-message",(data,sender)=>{
      //to find the roomid using socket id
      Object.entries(connections).forEach(([roomKey,roomValue])=>{
        //roomKey~room1 : roomValue~[client1,client2,client3]

        if(roomValue.includes(socket.id)){
          if(messages[roomKey]===undefined){
            messages[roomKey] = [];
          }
          messages[roomKey].push({
            sender: sender,
            data: data,
            "socket-id-of-sender": socket.id,
          });
          //sending the message to all the users
          connections[roomKey].forEach(el=>{
            io.to(el).emit("chat-message",data,sender,socket.id);
          })
          return;
        }
      })
    })
    socket.on("icecandidate",(toUserId,data)=>{
      if(data.candidate&&data){
        io.to(toUserId).emit("icecandidate",data,socket.id);
      }
    })
    socket.on("disconnect",()=>{
      console.log("disconnected from the server");
      var key;
      Object.entries(connections).forEach(([roomKey,roomVal])=>{
        if(roomVal.includes(socket.id)){
          key = roomKey;
        }
      });
      if(key===undefined){
        return;
      }
      var diffTime = Math.abs(time[key] - new Date());
      connections[key].forEach((el) => {
        io.to(el).emit("user-left", socket.id);
      });
      connections[key] = connections[key].filter((el) => el !== socket.id);
      if(connections[key].length===0){
        delete connections[key];
      }
    })

    //if a's browser wants to send to b's browser 
    //first 'a' sends signal event to server with parameters of a sends (b id,a  message) to server
    //then server receives and send or emit this message to b by using b id which is (toId,message)

    socket.on("signal",(toId,message)=>{
      io.to(toId).emit("signal",socket.id,message);
    })
})
app.use("/auth", userRouter);