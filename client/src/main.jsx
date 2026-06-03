import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { initializeCookieConsent } from "./utils/cookieConsent.js";
import App from "./App";
import AppErrorBoundary from "./components/layout/AppErrorBoundary.jsx";
import "./styles/themes.css";
import "./styles/poppins.css";
import "./styles/global.css";
import "./styles/header.css";
import "./styles/theme-toggle.css";
import "./styles/dark-theme-overrides.css";
import "./styles/app-splash.css";
import "./styles/cookie-consent.css";

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
initializeCookieConsent();

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
        <ThemeProvider>
          <AuthProvider>
            <AppErrorBoundary>
              <App />
            </AppErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
