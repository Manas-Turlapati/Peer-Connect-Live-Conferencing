import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import VideoMeeting from "./pages/VideoMeeting.jsx";
import Room from "./pages/Room.jsx";
import History from "./pages/History.jsx";
import { UserContext } from "./UserContext.jsx";
import "./App.css";

function App() {
  const [login, setLogin] = useState(() => {
    return Boolean(localStorage.getItem("token"));
  });

  const providerValues = {
    login,
    setLogin,
  };

  return (
    <UserContext.Provider value={providerValues}>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "rgba(24, 25, 29, 0.88)",
            color: "#eaf0ff",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "14px",
            fontSize: "0.9rem",
            fontWeight: "500",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
            padding: "10px 18px",
          },
          success: {
            iconTheme: {
              primary: "#8affc1",
              secondary: "#020203",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff6b81",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <div className="cosmic-canvas">
        <div className="cosmic-nebula">
          <div className="nebula-glow-1" />
          <div className="nebula-glow-2" />
        </div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/:url" element={<VideoMeeting />} />
            <Route path="/room/:id" element={<Room />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </BrowserRouter>
      </div>
    </UserContext.Provider>
  );
}

export default App;
