import { useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import IdleSessionGuard from "./IdleSessionGuard.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleIdleLogout = useCallback(() => {
    logout();
    navigate("/my-account", {
      replace: true,
      state: { sessionExpired: true, from: location.pathname },
    });
  }, [logout, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <p>Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/my-account" replace state={{ from: location.pathname }} />;
  }

  return (
    <IdleSessionGuard enabled onIdle={handleIdleLogout}>
      {children}
    </IdleSessionGuard>
  );
}
