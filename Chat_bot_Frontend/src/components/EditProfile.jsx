import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "../context/AuthProvider";

function EditProfile({ onClose }) {
  const [authUser, setAuthUser] = useAuth();
  const [fullname, setFullname] = useState(authUser?.fullname || "");
  const [avatar, setAvatar] = useState(authUser?.avatar || "");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/api/user/profile", {
          withCredentials: true,
        });
        setFullname(res.data.fullname);
        setAvatar(res.data.avatar);
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        "/api/user/updateprofile",
        { fullname, avatar },
        { withCredentials: true }
      );
      setAuthUser(res.data);
      onClose();
    } catch (err) {
      console.error("Error updating profile", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-[#202C33] text-white p-6 rounded-lg w-[90%] max-w-md relative">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:opacity-80">
          <IoMdClose className="text-2xl" />
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={avatar || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder="Your name"
            className="bg-[#2A3942] text-white px-4 py-2 rounded outline-none placeholder-gray-400"
          />

          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="Profile Image URL"
            className="bg-[#2A3942] text-white px-4 py-2 rounded outline-none placeholder-gray-400"
          />

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 transition text-white py-2 px-4 rounded mt-2"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
