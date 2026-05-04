import { useState } from "react";
import Left from "./components/chat/sidebar/Sidebar";
import Right from "./components/chat/conversation/ChatWindow";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import useConversation from "./store/useConversation";
import CallModal from "./components/call/CallModal";
import IncomingCallModal from "./components/call/IncomingCallModal";
import GroupCallModal from "./components/call/GroupCallModal";
import StatusList from "./components/status/StatusList";
import ProfileView from "./pages/ProfileView";
import Notifications from "./pages/Notifications";
import CreatePost from "./pages/CreatePost";
import PostView from "./pages/PostView";
import { useTheme } from "./context/ThemeContext";

function App() {
  const [authUser] = useAuth();
  const { selectedConversation } = useConversation();
  const [activeTab, setActiveTab] = useState("chats");
  const { theme } = useTheme();

  return (
    <>
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

      {/* Toaster adapts to current theme */}
      <Toaster
        position="top-center"
        toastOptions={{
          style:
            theme === "dark"
              ? { background: "#1f2937", color: "#f9fafb", borderRadius: "12px" }
              : { background: "#ffffff", color: "#111827", borderRadius: "12px", border: "1px solid #e5e7eb" },
          duration: 3000,
        }}
      />
    </>
  );
}

export default App;
