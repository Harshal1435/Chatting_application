import React, { useEffect, useState } from "react";
import useConversation from "../statemanage/useConversation.js";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "./AuthProvider.jsx";

const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const [authUser] = useAuth();
  const { messages, setMessage, selectedConversation } = useConversation();
   const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  useEffect(() => {
    const getMessages = async () => {

    const token = Cookies.get("jwt") || localStorage.getItem("ChatApp")?.user?.token;
        
           const newtoken = authUser?.user?.token || token;
       

      setLoading(true);
      if (selectedConversation && selectedConversation._id) {
        try {
          const res = await axios.get(
            `${baseurl}/api/message/get/${selectedConversation._id}`,{
                headers: {
            Authorization: `Bearer ${newtoken}`,
          },
            }

          );
          setMessage(res.data);
          setLoading(false);
        } catch (error) {
          console.log("Error in getting messages", error);
          setLoading(false);
        }
      }
    };
    getMessages();
  }, [selectedConversation, setMessage]);
  return { loading, messages };
};

export default useGetMessage;
