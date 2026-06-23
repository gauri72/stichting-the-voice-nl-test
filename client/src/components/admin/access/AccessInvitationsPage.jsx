import { useCallback, useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import usePermissions from "../../../hooks/usePermissions.js";

export default function AccessInvitationsPage() {
  const { can } = usePermissions();
  const canEdit = can("access_management.edit");
  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", roleId: "" });

  const load = useCallback(async () => {
    try {
      const [inv, roleData] = await Promise.all([
        apiFetch("/api/admin/access/invitations", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/access/roles", { headers: adminAuthHeaders() }),
      ]);
      setInvitations(inv.invitations || []);
      setRoles(roleData.roles || []);
    } catch (err) {
      setError(err.message || "Could not load invitations.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sendInvite(e) {
    e.preventDefault();
    if (!canEdit) return;
    try {
      const data = await apiFetch("/api/admin/access/invitations", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setMessage(data.invitation?.inviteUrl ? `Invite sent. Dev link: ${data.invitation.inviteUrl}` : "Invitation sent.");
      setForm({ email: "", firstName: "", lastName: "", roleId: "" });
      await load();
    } catch (err) {
      setError(err.message || "Invite failed.");
    }
  }

  async function resend(id) {
    if (!canEdit) return;
    try {
      const data = await apiFetch(`/api/admin/access/invitations/${id}/resend`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setMessage(data.inviteUrl ? `Resent. Dev link: ${data.inviteUrl}` : "Invitation resent.");
    } catch (err) {
      setError(err.message || "Resend failed.");
    }
  }

  return (
    <section className="admin-events__card">
      <h3>Invitations</h3>
      {error ? <p className="admin-events__error">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      {canEdit ? (
        <form className="admin-events__form-grid" onSubmit={sendInvite}>
          <label>Email<input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
          <label>First name<input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></label>
          <label>Last name<input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></label>
          <label>Role
            <select required value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <div className="admin-events__form-actions admin-api-builder__full">
            <button type="submit">Send invitation</button>
          </div>
        </form>
      ) : null}

      <table className="admin-tickets__table">
        <thead>
          <tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.email}</td>
              <td>{inv.firstName} {inv.lastName}</td>
              <td>{inv.roleSlug}</td>
              <td>{inv.status}</td>
              <td>{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—"}</td>
              <td>
                {canEdit && inv.status === "pending" ? (
                  <button type="button" onClick={() => resend(inv.id)}>Resend</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
