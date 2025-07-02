import React, { useEffect, useState } from "react";
import axios from "axios";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const VITE_API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const storedData = localStorage.getItem("ChatApp");
        if (!storedData) {
          console.error("ChatApp data not found in localStorage");
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedData);
        const token = userData?.user?.token;
     console.log("useGetAllUsers token", token);
        if (!token) {
          console.error("No token found in user data");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${VITE_API_URL}/api/user/allusers`, {
          withCredentials: true, // ✅ only needed if you're also using cookies
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAllUsers(response.data);
      } catch (error) {
        console.log("Error in useGetAllUsers: ", error?.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  return [allUsers, loading];
}

export default useGetAllUsers;
