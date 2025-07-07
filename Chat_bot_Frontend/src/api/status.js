import axios from 'axios';
import { useAuth } from "../context/AuthProvider";
import Cookies from "js-cookie";

const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token =  localStorage.getItem("ChatApp")?.user?.token|| Cookies.get("jwt") 
// Function to create a new status post
export const createStatus = async (formData) => {


  try {
    const response = await axios.post(`${baseurl}/api/status`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Fetch all statuses
export const getStatuses = async () => {
  try {
    const response = await axios.get(`${baseurl}/api/status`, {
      withCredentials: true,
      headers:{
          Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Mark a status as viewed
export const viewStatus = async (statusId) => {
  try {
    const response = await axios.post(`${baseurl}/api/status/${statusId}/view`, {}, {
      withCredentials: true,
          headers:{
          Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};
