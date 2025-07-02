import React, { useState } from "react";
import useConversation from "../statemanage/useConversation.js";
import axios from "axios";
import { encryptText } from "../utils/cryptoUtils"; // ⬅️ import the encryption utility

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessage, selectedConversation } = useConversation();
const VITE_API_URL = import.meta.env.VITE_API_URL;
  const sendMessages = async (text) => {
    setLoading(true);
    try {
      if (!selectedConversation) return;

      // ⬅️ Encrypt the message
      const { encryptedData, iv } = await encryptText(text);

      // ⬅️ Send encrypted message and iv
      const res = await axios.post(
        `${VITE_API_URL}/api/message/send/${selectedConversation._id}`,
        {
          encryptedMessage: encryptedData,
          iv,
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
