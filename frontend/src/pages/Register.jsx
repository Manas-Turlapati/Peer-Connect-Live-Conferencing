import "./Register.css";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
function Register() { 
  let [details,setDetails] = useState({
    regName:"",
    regEmail:"",
    regPassword:"",
    regConfirmPassword:""
  });
  const navigate = useNavigate();
  function fillDetails(e){
    setDetails((prev)=>({
        ...prev,[e.target.name]:e.target.value
    }))
  }
  async function display(e){
    e.preventDefault();
    if(details.regName===""||details.regEmail===""||details.regPassword===""||details.regConfirmPassword===""){
        toast.error("Please Fill the Details");
        return;
    }
    if(details.regPassword.length<6){
        toast.error("Password must have atleast 6 characters");
        return;
    }
    if(details.regPassword!==details.regConfirmPassword){
        toast.error("Password and Confirm Password doesnt match");
        return;
    }
    try{
        let res = await fetch("http://localhost:3000/auth/register",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: details.regName,
                email: details.regEmail,
                password: details.regPassword,
            }),
        })
        let data = await res.json();
        if(!res.ok){
            toast.error(data.msg);
            return;
        }
        toast.success(data.msg);
        setDetails({
          regName: "",
          regEmail: "",
          regPassword: "",
          regConfirmPassword: "",
        });
        navigate("/login");
    }
    catch(err){
        console.log(err);
        return;
    }
  }
  return (
    <div className="registerPageWrapper">
      <div className="registerCard">
        <h1 className="registerTitle">Please Register Here!</h1>
        <div className="registerFieldsWrapper">
          <label htmlFor="regName" className="registerLabel">
            Enter Your Name:
          </label>
          <input
            type="text"
            placeholder="Enter Your Name"
            id="regName"
            name="regName"
            className="registerInput"
            onChange={fillDetails}
            value={details.regName}
          />
          <label htmlFor="regEmail" className="registerLabel">
            Enter Your Email:
          </label>
          <input
            type="email"
            placeholder="Enter Your email"
            id="regEmail"
            name="regEmail"
            className="registerInput"
            onChange={fillDetails}
            value={details.regEmail}
          />

          <label htmlFor="regPassword" className="registerLabel">
            Enter Password:
          </label>
          <input
            type="password"
            id="regPassword"
            name="regPassword"
            className="registerInput"
            onChange={fillDetails}
            value={details.regPassword}
          />

          <label htmlFor="regConfirmPassword" className="registerLabel">
            Confirm Password:
          </label>
          <input
            type="password"
            id="regConfirmPassword"
            name="regConfirmPassword"
            className="registerInput"
            onChange={fillDetails}
            value={details.regConfirmPassword}
          />

          <div className="registerBtnWrapper">
            <button className="registerSubmitBtn" onClick={display}>
              Submit
            </button>
          </div>
          <br />
          <p>
            Already Registered ?{" "}
            <Link to="/login" className="LoginLink">
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
