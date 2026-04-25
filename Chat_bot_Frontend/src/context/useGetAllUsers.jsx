import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useAuth } from "./AuthProvider";

function useGetAllUsers() {
  const [authUser] = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt") || localStorage.getItem("ChatApp")?.user?.token;
        const newtoken = authUser?.user?.token || token;

        const response = await axios.get(`${baseurl}/api/user/allusers`, {
          headers: { Authorization: `Bearer ${newtoken}` },
        });
        setAllUsers(response.data);
        // Cache for caller name lookup in call modals
        localStorage.setItem("allUsers", JSON.stringify(response.data));
      } catch (error) {
        // silently fail — user list will just be empty
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, []);

  return [allUsers, loading];
}

export default useGetAllUsers;
