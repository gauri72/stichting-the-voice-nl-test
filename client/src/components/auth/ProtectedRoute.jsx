import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  return children;
}
