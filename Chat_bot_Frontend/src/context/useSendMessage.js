import React, { useState } from "react";
import useConversation from "../statemanage/useConversation.js";
import axios from "axios";
import { encryptText } from "../utils/cryptoUtils"; // ⬅️ import the encryption utility
import { useAuth } from "./AuthProvider.jsx";
import Cookies from "js-cookie";
const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();
    const [authUser] = useAuth(); // ⬅️ Get the authenticated user
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const sendMessages = async (text) => {
    setLoading(true);

    try {
       const token = Cookies.get("jwt") 
     
        const newtoken = authUser?.user?.token || token;
  
        console.log("ndskjmdk",authUser?.user?.token)
      if (!selectedConversation) return;

      // ⬅️ Encrypt the message
      const { encryptedData, iv } = await encryptText(text);

      // ⬅️ Send encrypted message and iv
    const res = await axios.post(
  `${baseurl}/api/message/send/${selectedConversation._id}`,
  {
    encryptedMessage: encryptedData,
    iv,
  },
  {
    headers: {
      Authorization: `Bearer ${newtoken}`,
    },
  }
);


      // ⬅️ Append to message state
      setMessage([...messages, res.data]);
    } catch (error) {
      console.log("Error in sendMessages", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessages };
};

export default useSendMessage;
