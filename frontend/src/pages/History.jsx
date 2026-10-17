import toast, { Toaster } from "react-hot-toast";
import { useState,useEffect } from "react";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
function History() {
  const [data ,setData] = useState([]);
  let token = localStorage.getItem("token");
  useEffect(()=>{
    if (!token) {
      toast.error("Please Login");
      return;
    }
    let display = async function(){
        let res = await fetch(`${API}/meeting`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          }
        });
        let historyData = await res.json();
        if(!res.ok){
          toast.error(historyData.msg || historyData.error || "Please login again");
          return;
        }
        setData(historyData.data);
    }
    display();
  },[])
  return (
    <>
      <h1>History of meetings</h1>
      <ul>
        {data.map((el) => (
          <li key={el._id}>{el._id}</li>
        ))}
      </ul>
    </>
  );
}
export default History;
