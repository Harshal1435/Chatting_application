import axios from "axios";
import Cookies from "js-cookie";

const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Resolve token at call-time, not at module load time
const getToken = () => {
  try {
    const stored = localStorage.getItem("ChatApp");
    return stored ? JSON.parse(stored)?.user?.token : Cookies.get("jwt");
  } catch (_) {
    return Cookies.get("jwt");
  }
};

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const createStatus = async (formData) => {
  const response = await axios.post(`${baseurl}/api/status`, formData, {
    headers: { "Content-Type": "multipart/form-data", ...authHeaders() },
    withCredentials: true,
  });
  return response.data;
};

export const getStatuses = async () => {
  const response = await axios.get(`${baseurl}/api/status`, {
    headers: authHeaders(),
    withCredentials: true,
  });
  return response.data;
};

export const viewStatus = async (statusId) => {
  const response = await axios.post(
    `${baseurl}/api/status/${statusId}/view`,
    {},
    { headers: authHeaders(), withCredentials: true }
  );
  return response.data;
};
