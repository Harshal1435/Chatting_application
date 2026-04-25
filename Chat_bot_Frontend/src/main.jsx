import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { BrowserRouter } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext.jsx";
import { CallProvider } from "./context/CallContext.jsx";
import { StatusProvider } from "./context/StatusContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <StatusProvider>
            <CallProvider>
              <App />
            </CallProvider>
          </StatusProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
