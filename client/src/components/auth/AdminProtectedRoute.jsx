import { useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import IdleSessionGuard from "./IdleSessionGuard.jsx";

export default function AdminProtectedRoute({ children }) {
  const { admin, loading, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleIdleLogout = useCallback(() => {
    logout();
    navigate("/admin/login", {
      replace: true,
      state: { sessionExpired: true, from: location.pathname },
    });
  }, [logout, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="admin-dashboard-loading" role="status" aria-live="polite">
        Loading admin panel…
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <IdleSessionGuard enabled onIdle={handleIdleLogout}>
      {children}
    </IdleSessionGuard>
  );
}
