import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import App from "./App";
import "./styles/global.css";
import "./styles/header.css";
import "./styles/app-splash.css";

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

function AppProviders({ children }) {
  if (!googleClientId) {
    return children;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
