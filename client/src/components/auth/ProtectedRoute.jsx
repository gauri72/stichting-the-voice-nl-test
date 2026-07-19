import { useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import IdleSessionGuard from "./IdleSessionGuard.jsx";
import { rememberAuthIntent } from "../../utils/authRedirect.js";
import DashboardSubpageNavigation from "../dashboard/DashboardSubpageNavigation.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fullDestination = `${location.pathname}${location.search}${location.hash}`;

  const handleIdleLogout = useCallback(() => {
    rememberAuthIntent(fullDestination, "protected-route");
    logout();
    navigate("/my-account", {
      replace: true,
      state: { sessionExpired: true, from: fullDestination },
    });
  }, [logout, navigate, fullDestination]);

  if (loading) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <p>Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    rememberAuthIntent(fullDestination, "protected-route");
    return <Navigate to="/my-account" replace state={{ from: fullDestination }} />;
  }

  return (
    <IdleSessionGuard enabled onIdle={handleIdleLogout}>
      {/* CSS hook only (display: contents = zero layout impact) — dashboard pages
          have a plain flat background, not a hero image, so the header needs
          dark text here instead of the white-on-hero-photo default. */}
      <div className="dashboard-shell" style={{ display: "contents" }}>
        <DashboardSubpageNavigation />
        {children}
      </div>
    </IdleSessionGuard>
  );
}
