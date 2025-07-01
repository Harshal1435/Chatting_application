import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext.jsx";
import { CallProvider } from "./context/CallContext.jsx"; // ✅ import CallProvider

const user = JSON.parse(localStorage.getItem("ChatApp"))?.user;

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <CallProvider user={user}>
          <App />
        </CallProvider>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
