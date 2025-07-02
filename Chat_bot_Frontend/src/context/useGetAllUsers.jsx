import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const VITE_API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        console.log(token)
      
        const response = await axios.get(`${VITE_API_URL}/api/user/allusers`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAllUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.log("Error in useGetAllUsers: " + error);
      }
    };
    getUsers();
  }, []);
  return [allUsers, loading];
}

export default useGetAllUsers;
