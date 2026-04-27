import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import useGetAllUsers from "../../../hooks/useGetAllUsers";
import useConversation from "../../../store/useConversation";
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

    if (conversation) {
      setSelectedConversation(conversation);
      setSearch("");
    } else {
      toast.error("User not found");
    }
  };

  return (
    <div className="px-3 py-2 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-center w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500">
          <FaSearch className="text-gray-400 dark:text-gray-500 text-sm mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="bg-transparent w-full outline-none text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1 flex-shrink-0"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default Search;