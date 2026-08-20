import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
function Landing(){
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    function redirect(){
      if(!token){
        toast.error("Please Login First");
        navigate("/login");
        return;
      }else{
        navigate("/dummy");
        return;
      }
    }
    return (
      <div className="landing-container">
        <nav>
          <div className="landing-nav-title">
            <h2>Video Call</h2>
          </div>
          <div className="landing-nav-links">
            <a href="/dummy">Join as Guest</a>
            <a href="/register">Register</a>
            <button onClick={()=>{navigate("/login")}}>Login</button>
          </div>
        </nav>
        <div className="landing-main-container">
          <div className="landing-sub-container">
            <h1><span>Connect</span> with your <br />Loved Ones</h1>
            <p>Cover a distance by apna video call</p>
            <button onClick={redirect}>Get Started</button>
          </div>
          <div className="landing-image">
            <img
              src="/public/mobile.png"
              alt="image"   
            />
          </div>
        </div>
      </div>
    );
}
export default Landing;