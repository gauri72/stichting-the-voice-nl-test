import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";

export default function AdminAcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [invite, setInvite] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link.");
      setLoading(false);
      return;
    }
    apiFetch(`/api/admin/access/invitations/verify?token=${encodeURIComponent(token)}`)
      .then(setInvite)
      .catch((err) => setError(err.message || "Invitation invalid or expired."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await apiFetch("/api/admin/access/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      navigate("/admin/login", { state: { message: "Invitation accepted. Please sign in." } });
    } catch (err) {
      setError(err.message || "Could not accept invitation.");
    }
  }

  if (loading) return <div className="admin-dashboard-loading">Verifying invitation…</div>;

  return (
    <div className="admin-login-page">
      <div className="admin-events__card" style={{ maxWidth: 480, margin: "40px auto" }}>
        <h1>Accept admin invitation</h1>
        {invite ? (
          <p className="admin-events__hint">
            Join as <strong>{invite.roleName}</strong> — {invite.email}
          </p>
        ) : null}
        {error ? <p className="admin-events__error">{error}</p> : null}
        {invite ? (
          <form onSubmit={handleSubmit} className="admin-events__form-grid">
            <label className="admin-api-builder__full">
              Create password
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="admin-api-builder__full">
              Confirm password
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <button type="submit" className="admin-api-builder__full">Activate account</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
