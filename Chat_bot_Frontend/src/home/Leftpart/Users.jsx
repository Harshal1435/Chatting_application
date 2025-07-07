import React from "react";
import User from "./User";
import useGetAllUsers from "../../context/useGetAllUsers";
import StatusList from "../../components/Status/StatusList";
import { useAuth } from "../../context/AuthProvider";
import LoadingSpinner from "../LoadingSpinner";

function Users() {
  const [allUsers, loading] = useGetAllUsers();
  const { authUser } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Status List */}
     

      {/* User List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="medium" />
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          allUsers.map((user, index) => (
            <User key={user._id || index} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

export default Users;