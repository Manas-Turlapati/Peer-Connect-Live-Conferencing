import React from 'react';
import Landing from './pages/Landing.jsx';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Room from './pages/Room.jsx';
import History from './pages/History.jsx';
import './App.css';
import toast, { Toaster } from "react-hot-toast";
import VideoMeeting from './pages/VideoMeeting.jsx';
import { useContext,useState } from "react";
import { UserContext } from './UserContext.jsx';
function App(){
  const [login,setLogin] = useState(false);
  const providerValues = {
    login,setLogin
  };
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <UserContext.Provider value={providerValues}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />}></Route>
            <Route path="/register" element={<Register />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/:url" element={<VideoMeeting />}></Route>
            <Route path="/room/:id" element={<Room/>}></Route>
            <Route path="/history" element={<History/>}></Route>
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </>
  );
}

export default App