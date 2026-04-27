import { useEffect, useState } from "react";
import useConversation from "../store/useConversation.js";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../context/AuthProvider.jsx";

const useGetMessage = () => {
  const [loading, setLoading] = useState(false);
  const [authUser] = useAuth();
  const { messages, setMessage, selectedConversation } = useConversation();
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!selectedConversation?._id) return;

    const getMessages = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        const newtoken = authUser?.user?.token || token;

        const res = await axios.get(
          `${baseurl}/api/message/get/${selectedConversation._id}`,
          { headers: { Authorization: `Bearer ${newtoken}` } }
        );
        setMessage(res.data);
      } catch (error) {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, [selectedConversation, setMessage]);

  return { loading, messages };
};

export default useGetMessage;
