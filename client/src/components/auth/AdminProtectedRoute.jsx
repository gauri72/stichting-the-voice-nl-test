import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";

export default function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

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

  return children;
}
