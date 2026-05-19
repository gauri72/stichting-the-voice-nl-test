import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import LoginBreadcrumbSection from "./LoginBreadcrumbSection";
import LoginFormSection from "./LoginFormSection";
import LoginCtaSection from "./LoginCtaSection";

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

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div id="login-navbar-top">
      <LoginBreadcrumbSection mode={authMode} />
      <LoginFormSection mode={authMode} onModeChange={setAuthMode} />
      <LoginCtaSection />
    </div>
  );
}
