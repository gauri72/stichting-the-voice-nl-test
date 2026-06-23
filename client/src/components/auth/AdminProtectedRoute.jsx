import { useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { canAccessRoute, hasPermission } from "../../utils/rbacAdmin.js";
import IdleSessionGuard from "./IdleSessionGuard.jsx";

export default function AdminProtectedRoute({ children, permission = null }) {
  const { admin, loading, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = admin?.permissions || [];

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

  const requiredPermission = permission || null;
  const pathPermission = canAccessRoute(permissions, location.pathname);
  if (requiredPermission && !hasPermission(permissions, requiredPermission)) {
    return <Navigate to="/admin/dashboard" replace state={{ forbidden: true }} />;
  }
  if (!pathPermission && !location.pathname.startsWith("/admin/access-management")) {
    const fallback = permissions.includes("dashboard.view") || permissions.includes("*")
      ? "/admin/dashboard"
      : "/admin/login";
    return <Navigate to={fallback} replace state={{ forbidden: true }} />;
  }

  return (
    <IdleSessionGuard enabled onIdle={handleIdleLogout}>
      {children}
    </IdleSessionGuard>
  );
}
