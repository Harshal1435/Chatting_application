import React, { useEffect, useState } from "react";
import useConversation from "../statemanage/useConversation.js";
import axios from "axios";
const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();
  const VITE_API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      if (selectedConversation && selectedConversation._id) {
        try {
          const res = await axios.get(
            `${VITE_API_URL}/api/message/get/${selectedConversation._id}`
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
