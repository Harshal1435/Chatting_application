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
        console.log(token)
        console.log("useGetAllUsers token: ", authUser);
        const newtoken = authUser?.user?.token || token;
        console.log("useGetAllUsers newtoken: ", newtoken);
       
      
        const response = await axios.get(`${baseurl}/api/user/allusers`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${newtoken}`,
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
