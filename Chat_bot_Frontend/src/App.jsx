import React, { useState } from "react";
import Left from "./home/Leftpart/Left";
import Right from "./home/Rightpart/Right";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import useConversation from "./statemanage/useConversation";
import CallModal from "./components/CallModal";
import IncomingCallModal from "./components/IncomingCallModal";
import GroupCallModal from "./components/GroupCallModal";
import { ThemeProvider } from "./context/ThemeContext";
import StatusList from "./components/Status/StatusList";
import ProfileView from "./components/ProfileView";
import Notifications from "./components/notification";
import CreatePost from "./components/CreatePost";
import PostView from "./components/PostView";

function App() {
  const [authUser] = useAuth();
  const { selectedConversation } = useConversation();
  const [activeTab, setActiveTab] = useState("chats");

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={
            authUser ? (
              <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
                {/* Left Panel */}
                <div
                  className={`${
                    selectedConversation
                      ? "hidden lg:flex lg:w-[30%] xl:w-[28%]"
                      : "flex w-full lg:w-[30%] xl:w-[28%]"
                  } flex-col border-r border-gray-200 dark:border-gray-700`}
                >
                  <Left activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Right Panel */}
                <div
                  className={`${
                    selectedConversation
                      ? "flex w-full lg:w-[70%] xl:w-[72%]"
                      : "hidden lg:flex lg:w-[70%] xl:w-[72%]"
                  } flex-col`}
                >
                  <Right activeTab={activeTab} />
                </div>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/status" element={authUser ? <StatusList currentUser={authUser?.user} /> : <Navigate to="/login" />} />
        <Route path="/profile/:userId" element={authUser ? <ProfileView /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={authUser ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={authUser ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="/posts/:id" element={<PostView />} />
        <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={authUser ? <Navigate to="/" /> : <Signup />} />
      </Routes>

      <CallModal />
      <IncomingCallModal />
      <GroupCallModal />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", borderRadius: "12px" },
          duration: 3000,
        }}
      />
    </ThemeProvider>
  );
}

export default App;