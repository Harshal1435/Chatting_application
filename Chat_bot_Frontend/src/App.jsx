import React, { useState, useEffect } from "react";
import Left from "./home/Leftpart/Left";
import Right from "./home/Rightpart/Right";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import useConversation from "./statemanage/useConversation";
import BottomNav from "./components/BottomNav";
import CallModal from "./components/CallModal";
import IncomingCallModal from "./components/IncomingCallModal";
import { ThemeProvider } from "./context/ThemeContext";
import StatusList from "./components/Status/StatusList";
import ProfileView from "./components/ProfileView"
import Notifications from "./components/notification";
import CreatePost from "./components/CreatePost";
import PostView from "./components/PostView";
function App() {
  const [authUser] = useAuth();
  console.log("uhdcdiucdhyuc::",authUser)
  const { selectedConversation } = useConversation();
  const [activeTab, setActiveTab] = useState("Chats");
const user = JSON.parse(localStorage.getItem("ChatApp"))?.user
console.log("user::",user)
  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/"
          element={
            authUser ? (
              <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden transition-colors duration-300">
                <div className="flex w-full">
                  {/* Left Panel */}
                  <div
                    className={`${
                      selectedConversation
                        ? "hidden lg:block lg:w-[30%]"
                        : "block w-full lg:w-[30%]"
                    }`}
                  >
                    <Left activeTab={activeTab} setActiveTab={setActiveTab} />
                  </div>

                  {/* Right Panel */}
                  <div
                    className={`${
                      selectedConversation
                        ? "block w-full lg:w-[70%]"
                        : "hidden lg:block lg:w-[70%]"
                    }`}
                  >
                    <Right />
                  </div>
                </div>
              
              </div>
            ) : (
              <Navigate to={"/login"} />
            )
          }
        />
        <Route
          path="/status"
          element={authUser ? <StatusList currentUser={user} /> : <Navigate to={"/login"} />}
        />
            <Route 
                path="/profile/:userId" 
                element={
                  authUser ? <ProfileView  />:<Navigate to={"/login"}/>
                } 
              />
               <Route 
                path="/notifications" 
                element={
                  authUser ? <Notifications />:<Navigate to={"/login"}/>
                } 
              />

              <Route
                path="/create-post"
                element={authUser? <CreatePost /> : <Navigate to={"/login"} />}
              />
              <Route path="/posts/:id" element={<PostView />} />

        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <Signup />}
        />
      </Routes>

      <CallModal />
      <IncomingCallModal />
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
          duration: 3000,
        }}
      />
    </ThemeProvider>
  );
}

export default App;