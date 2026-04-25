import React, { useState } from "react";
import User from "./User";
import useGetAllUsers from "../../context/useGetAllUsers";
import LoadingSpinner from "../LoadingSpinner";
import { FaSearch, FaTimes } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";

function Users() {
  const [allUsers, loading] = useGetAllUsers();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? allUsers.filter((u) =>
        u.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : allUsers;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 py-2 bg-white dark:bg-gray-800">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <FaSearch className="text-gray-400 dark:text-gray-500 text-sm mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search people..."
            className="bg-transparent w-full outline-none text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1 flex-shrink-0"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="medium" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <BsPeopleFill className="text-gray-400 dark:text-gray-500 text-2xl" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {search ? "No users match your search" : "No users found"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-blue-500 text-xs hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filtered.map((user, index) => (
            <User key={user._id || index} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

export default Users;