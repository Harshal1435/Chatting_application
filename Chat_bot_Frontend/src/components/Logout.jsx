import React, { useState } from "react";
import { TbLogout2 } from "react-icons/tb";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

function Logout() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post("/api/user/logout");
      localStorage.removeItem("ChatApp");
      Cookies.remove("jwt");
      toast.success("Logged out successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error in Logout", error);
      toast.error("Error in logging out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-2 flex justify-center bg-amber-50 ">
      <button
        onClick={handleLogout}
        disabled={loading}
        title="Logout"
        className="p-2 rounded-lg  transition-colors duration-200"
      >
        <TbLogout2 className="text-black text-2xl" />
      </button>
    </div>
  );
}

export default Logout;
