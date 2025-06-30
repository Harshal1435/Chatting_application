import React from "react";
import Left from "./home/Leftpart/Left";
import Right from "./home/Rightpart/Right";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";
import Logout from "./home/left1/Logout";
import { Navigate, Route, Routes } from "react-router-dom";
import useConversation from "./statemanage/useConversation";

function App() {
  const [authUser] = useAuth();
  const { selectedConversation } = useConversation();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            authUser ? (
              <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
               
                <div className="flex w-full">
                  {/* Left Panel: Show only if no chat is selected or large screen */}
                  <div
                    className={`${
                      selectedConversation
                        ? "hidden lg:block lg:w-[30%]"
                        : "block w-full lg:w-[30%]"
                    }`}
                  >
                    <Left />
                  </div>

                  {/* Right Panel: Show only if chat is selected or large screen */}
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
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <Signup />}
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
