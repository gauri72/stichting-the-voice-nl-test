import { useCallback, useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { STATUS_LABELS } from "../../../utils/rbacAdmin.js";
import usePermissions from "../../../hooks/usePermissions.js";

export default function AccessTeamMembersPage() {
  const { can } = usePermissions();
  const canEdit = can("access_management.edit");
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roleId: "", sendInvite: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [team, roleData] = await Promise.all([
        apiFetch("/api/admin/access/team-members", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/access/roles", { headers: adminAuthHeaders() }),
      ]);
      setMembers(team.members || []);
      setRoles(roleData.roles || []);
    } catch (err) {
      setError(err.message || "Could not load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function inviteMember(e) {
    e.preventDefault();
    if (!canEdit) return;
    setError("");
    try {
      await apiFetch("/api/admin/access/team-members", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setMessage("Team member invited.");
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Invite failed.");
    }
  }

  async function runAction(id, action) {
    if (!canEdit) return;
    try {
      await apiFetch(`/api/admin/access/team-members/${id}/${action}`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setMessage(`Member ${action}d.`);
      await load();
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  }

  return (
    <section className="admin-events__card">
      <div className="admin-events__form-actions">
        <h3>Team Members</h3>
        {canEdit ? <button type="button" onClick={() => setFormOpen((o) => !o)}>Invite member</button> : null}
      </div>
      {error ? <p className="admin-events__error">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      {formOpen && canEdit ? (
        <form className="admin-events__form-grid" onSubmit={inviteMember}>
          <label>First name<input required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} /></label>
          <label>Last name<input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} /></label>
          <label>Email<input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></label>
          <label>Role
            <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))} required>
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="admin-events__checkbox">
            <input type="checkbox" checked={form.sendInvite} onChange={(e) => setForm((f) => ({ ...f, sendInvite: e.target.checked }))} />
            Send invitation email
          </label>
          <div className="admin-events__form-actions admin-api-builder__full">
            <button type="submit">Send invite</button>
          </div>
        </form>
      ) : null}

      {loading ? <p className="admin-events__hint">Loading…</p> : (
        <div className="admin-access__cards">
          {members.map((m) => (
            <article key={m.id} className="admin-access__card">
              <h3>{m.firstName} {m.lastName}</h3>
              <p>{m.email}</p>
              <p>{m.roleName || m.roleSlug || m.role} · {STATUS_LABELS[m.status] || m.status}</p>
              <p>Last login: {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : "—"}</p>
              {canEdit ? (
                <div className="admin-events__form-actions">
                  {m.status !== "suspended" ? <button type="button" onClick={() => runAction(m.id, "suspend")}>Suspend</button> : null}
                  {m.status === "suspended" || m.status === "disabled" ? (
                    <button type="button" onClick={() => runAction(m.id, "reactivate")}>Reactivate</button>
                  ) : null}
                  {m.status !== "disabled" ? <button type="button" onClick={() => runAction(m.id, "disable")}>Disable</button> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
