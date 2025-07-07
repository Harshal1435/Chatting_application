import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import useGetAllUsers from "../../context/useGetAllUsers";
import useConversation from "../../statemanage/useConversation";
import toast from "react-hot-toast";

function Search() {
  const [search, setSearch] = useState("");
  const [allUsers] = useGetAllUsers();
  const { setSelectedConversation } = useConversation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const conversation = allUsers.find((user) =>
      user.fullname?.toLowerCase().includes(search.toLowerCase())
    );
    console.log(allUsers)

    if (conversation) {
      setSelectedConversation(conversation);
      setSearch("");
    } else {
      toast.error("User not found");
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-center w-full bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500">
          <FaSearch className="text-gray-500 dark:text-gray-400 text-sm mr-2" />
          <input
            type="text"
            placeholder="Search by name..."
            className="bg-transparent w-full outline-none text-gray-800 dark:text-gray-200 text-sm placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </form>
    </div>
  );
}

export default Search;