import React from "react";
import Search from "./Search";
import Users from "./Users";

function Left() {
  return (
    <div className="w-full  h-full flex flex-col bg-slate-900 text-white border-r border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-2xl font-semibold text-green-500">Chats</h1>
      </div>

      {/* Search Bar */}
      <Search />

      {/* Users list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Users />
      </div>
    </div>
  );
}

export default Left;
