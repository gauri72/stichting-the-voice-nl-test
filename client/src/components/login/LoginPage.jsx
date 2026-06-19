import { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { getReturnTo } from "../../utils/authRedirect.js";
import LoginBreadcrumbSection from "./LoginBreadcrumbSection";
import LoginFormSection from "./LoginFormSection";
import LoginCtaSection from "./LoginCtaSection";
import "../../styles/login-page.css";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnTo(searchParams, location.state);
  const [authMode, setAuthMode] = useState(() => {
    if (searchParams.get("mode") === "signup") return "signup";
    return location.state?.authMode === "forgot-password" ? "forgot-password" : "login";
  });

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setAuthMode("signup");
    } else if (location.state?.authMode) {
      setAuthMode(location.state.authMode);
    }
  }, [location.state?.authMode, searchParams]);

  const sessionExpired = Boolean(location.state?.sessionExpired);

  if (!loading && user) {
    return <Navigate to={returnTo} replace />;
  }

  const prefillEmail = searchParams.get("email") || "";

  return (
    <div id="login-navbar-top" className="login-page-shell">
      <LoginBreadcrumbSection mode={authMode} />
      {sessionExpired ? (
        <p className="login-page-session-notice" role="status">
          Your session expired after 10 minutes of inactivity. Please sign in again.
        </p>
      ) : null}
      <LoginFormSection
        mode={authMode}
        onModeChange={setAuthMode}
        returnTo={returnTo}
        prefillEmail={prefillEmail}
      />
      <LoginCtaSection />
    </div>
  );
}
