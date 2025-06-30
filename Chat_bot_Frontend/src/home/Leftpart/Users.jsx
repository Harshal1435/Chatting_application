import React from "react";
import User from "./User";
import useGetAllUsers from "../../context/useGetAllUsers";

function Users() {
  const [allUsers, loading] = useGetAllUsers();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 bg-slate-900 text-white text-lg font-semibold border-b border-slate-700">
        Messages
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto bg-black scrollbar-thin scrollbar-thumb-slate-700">
        {loading ? (
          <div className="text-white px-6 py-4">Loading...</div>
        ) : allUsers.length === 0 ? (
          <div className="text-gray-400 px-6 py-4">No users found</div>
        ) : (
          allUsers.map((user, index) => <User key={user._id || index} user={user} />)
        )}
      </div>
    </div>
  );
}

export default Users;
