import "./Login.css";
import {useState} from 'react';
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
function Login() {
  let [details,setDetails] = useState({
    loginName:"",
    loginPassword:""
  });
  const navigate = useNavigate();
  function fillDetails(e){
    setDetails((prev)=>({
        ...prev,[e.target.name]:e.target.value
    }))
  }
  async function display(e){
    e.preventDefault();
    if(details.loginName===""||details.loginPassword===""){
        toast.error("Please fill the required details!");
        return;
    }
    try{
        let res = await fetch("http://localhost:3000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: details.loginName,
            password: details.loginPassword,
          }),
        });
        let data = await res.json();
        if(!data.token){
            toast.error(data.msg);
            return;
        }
        localStorage.setItem("token",data.token);
        toast.success("Welcome Back!");
        navigate("/dummy");
        setDetails(
            {
                loginName:"",
                loginPassword:""
            }
        )
    }
    catch(err){
        console.log(err);

    }
  }

  return (
    <div className="loginPageWrapper">
      <div className="loginCard">
        <h1 className="loginTitle">Please Login Here!</h1>
        <div className="loginFieldsWrapper">
          <label htmlFor="loginName" className="loginLabel">
            Enter Your Name:
          </label>
          <input
            type="text"
            placeholder="Enter Your Name"
            id="loginName"
            name="loginName"
            className="loginInput"
            onChange={fillDetails}
            value={details.loginName}
          />

          <label htmlFor="loginPassword" className="loginLabel">
            Enter Password:
          </label>
          <input
            type="password"
            id="loginPassword"
            name="loginPassword"
            className="loginInput"
            onChange={fillDetails}
            value={details.loginPassword}
          />
          <div className="loginBtnWrapper">
            <button className="loginSubmitBtn" onClick={display}>
              Submit
            </button>
          </div>
          <br />
          <p>
            New User ?{" "}
            <Link to="/register" className="RegisterLink">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
