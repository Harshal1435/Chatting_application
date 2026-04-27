import { useState } from "react";
import useConversation from "../store/useConversation.js";
import axios from "axios";
import { encryptText } from "../utils/cryptoUtils";
import { useAuth } from "./AuthProvider.jsx";
import Cookies from "js-cookie";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();
  const [authUser] = useAuth();
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const sendMessages = async (text) => {
    if (!selectedConversation) return;
    setLoading(true);

    try {
      const token = Cookies.get("jwt");
      const newtoken = authUser?.user?.token || token;

      const { encryptedData, iv } = await encryptText(text);

      const res = await axios.post(
        `${baseurl}/api/message/send/${selectedConversation._id}`,
        { encryptedMessage: encryptedData, iv },
        { headers: { Authorization: `Bearer ${newtoken}` } }
      );

      setMessage([...messages, res.data]);
    } catch (error) {
      // message failed to send — could show a toast here
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendMessages };
};

export default useSendMessage;