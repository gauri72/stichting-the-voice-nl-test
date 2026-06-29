import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { AdminAuthProvider } from "./contexts/AdminAuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { DesignSystemProvider } from "./contexts/DesignSystemContext.jsx";
import { CookieConsentProvider } from "./contexts/CookieConsentContext.jsx";
import { AiAssistantProvider } from "./contexts/AiAssistantContext.jsx";
import { WalletProvider } from "./contexts/WalletContext.jsx";
import "./i18n/index.js";
import App from "./App";
import AppErrorBoundary from "./components/layout/AppErrorBoundary.jsx";
import "./styles/themes.css";
import "./styles/poppins.css";
import "./styles/global.css";
import "./styles/dashboard-welcome-banner-section.css";
import "./styles/header.css";
import "./styles/theme-toggle.css";
import "./styles/dark-theme-overrides.css";
import "./styles/app-splash.css";
import "./styles/cookie-consent.css";
import "./styles/coming-soon-page.css";
import "./styles/ai-assistant-tailwind.css";
import "./styles/ai-assistant-overrides.css";

// The browser's own scroll restoration runs before React even mounts, and
// can win the race against ScrollToHash's window.scrollTo(0,0) on refresh —
// landing the page wherever the user last scrolled (sometimes the footer)
// instead of the top. Disabling it here makes every load/refresh start at
// the top, with ScrollToHash (in App.jsx) handling in-app navigation.
if (typeof window !== "undefined" && window.history && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

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
        <ThemeProvider>
          <DesignSystemProvider>
            <CookieConsentProvider>
              <AuthProvider>
                <AdminAuthProvider>
                  <WalletProvider>
                    <AiAssistantProvider>
                      <AppErrorBoundary>
                        <App />
                      </AppErrorBoundary>
                    </AiAssistantProvider>
                  </WalletProvider>
                </AdminAuthProvider>
              </AuthProvider>
            </CookieConsentProvider>
          </DesignSystemProvider>
        </ThemeProvider>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
