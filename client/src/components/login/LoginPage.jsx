import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import LoginBreadcrumbSection from "./LoginBreadcrumbSection";
import LoginFormSection from "./LoginFormSection";
import LoginCtaSection from "./LoginCtaSection";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState("login");

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
