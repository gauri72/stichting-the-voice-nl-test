import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import LoginBreadcrumbSection from "./LoginBreadcrumbSection";
import LoginFormSection from "./LoginFormSection";
import LoginCtaSection from "./LoginCtaSection";
import "../../styles/login-page.css";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [authMode, setAuthMode] = useState(() =>
    location.state?.authMode === "forgot-password" ? "forgot-password" : "login"
  );

  useEffect(() => {
    if (location.state?.authMode) {
      setAuthMode(location.state.authMode);
    }
  }, [location.state?.authMode]);

  const sessionExpired = Boolean(location.state?.sessionExpired);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div id="login-navbar-top" className="login-page-shell">
      <LoginBreadcrumbSection mode={authMode} />
      {sessionExpired ? (
        <p className="login-page-session-notice" role="status">
          Your session expired after 10 minutes of inactivity. Please sign in again.
        </p>
      ) : null}
      <LoginFormSection mode={authMode} onModeChange={setAuthMode} />
      <LoginCtaSection />
    </div>
  );
}
