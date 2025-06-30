import React from "react";

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="w-72 space-y-6 animate-pulse">
        {/* Profile & Text */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-700" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-slate-700 rounded-md" />
            <div className="h-4 w-32 bg-slate-700 rounded-md" />
          </div>
        </div>

        {/* Chat Preview Block */}
        <div className="h-32 w-full bg-slate-700 rounded-lg" />
      </div>
    </div>
  );
}

export default Loading;
