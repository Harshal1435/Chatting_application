import React from "react";
import Left from "./home/Leftpart/Left";
import Right from "./home/Rightpart/Right";
import Signup from "./components/Signup";
import Login from "./components/Login";
import { useAuth } from "./context/AuthProvider";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import useConversation from "./statemanage/useConversation";

// ✅ Import modals and call screen
import CallModal from "./components/CallModal";
import IncomingCallModal from "./components/IncomingCallModal";
import CallScreen from "./components/CallScreen";
import { useCallContext } from "./context/CallContext";

function App() {
  const [authUser] = useAuth();
  const { selectedConversation } = useConversation();
  const { activeCall } = useCallContext(); // ✅ get activeCall flag

  return (
    <>
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-black">
          <CallScreen />
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            authUser ? (
              <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
                <div className="flex w-full">
                  {/* Left Panel */}
                  <div
                    className={`${
                      selectedConversation
                        ? "hidden lg:block lg:w-[30%]"
                        : "block w-full lg:w-[30%]"
                    }`}
                  >
                    <Left />
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
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <Signup />}
        />
      </Routes>

      {/* ✅ Global Call Modals */}
      <CallModal />
      <IncomingCallModal />
      <Toaster />
    </>
  );
}

export default App;
