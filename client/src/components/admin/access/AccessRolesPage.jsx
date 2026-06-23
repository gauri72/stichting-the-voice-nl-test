import { useCallback, useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import usePermissions from "../../../hooks/usePermissions.js";

export default function AccessRolesPage() {
  const { can } = usePermissions();
  const canEdit = can("access_management.edit");
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", permissions: [] });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [roleData, permData] = await Promise.all([
        apiFetch("/api/admin/access/roles", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/access/permissions", { headers: adminAuthHeaders() }),
      ]);
      setRoles(roleData.roles || []);
      setPermissions(permData.permissions || []);
    } catch (err) {
      setError(err.message || "Could not load roles.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectRole(role) {
    setSelectedId(role.id);
    setForm({ name: role.name, description: role.description || "", permissions: role.permissions || [] });
  }

  function togglePerm(key) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  }

  async function saveRole() {
    if (!canEdit || !selectedId) return;
    try {
      await apiFetch(`/api/admin/access/roles/${selectedId}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setMessage("Role saved.");
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  }

  async function createRole() {
    if (!canEdit) return;
    const name = window.prompt("Role name");
    if (!name) return;
    try {
      await apiFetch("/api/admin/access/roles", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ name, permissions: [] }),
      });
      setMessage("Role created.");
      await load();
    } catch (err) {
      setError(err.message || "Create failed.");
    }
  }

  const grouped = permissions.reduce((acc, p) => {
    acc[p.module] = acc[p.module] || [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <section className="admin-events__card">
      <div className="admin-events__form-actions">
        <h3>Roles</h3>
        {canEdit ? <button type="button" onClick={createRole}>Create role</button> : null}
      </div>
      {error ? <p className="admin-events__error">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      <div className="admin-access__cards">
        {roles.map((r) => (
          <button key={r.id} type="button" className={`admin-access__card${selectedId === r.id ? " admin-api-builder__list-item--active" : ""}`} onClick={() => selectRole(r)}>
            <h3>{r.name}{r.isSystem ? " (system)" : ""}</h3>
            <p>{r.description || "—"}</p>
            <p>{r.memberCount} members · {r.permissions?.includes("*") ? "All permissions" : `${r.permissions?.length || 0} permissions`}</p>
          </button>
        ))}
      </div>

      {selectedId ? (
        <>
          <div className="admin-events__form-grid" style={{ marginTop: 16 }}>
            <label>Name<input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={!canEdit} /></label>
            <label className="admin-api-builder__full">Description
              <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={!canEdit} />
            </label>
          </div>
          {Object.entries(grouped).map(([module, perms]) => (
            <details key={module} className="admin-access__perm-group" open>
              <summary>{module.replace(/_/g, " ")}</summary>
              <div className="admin-access__perm-grid">
                {perms.map((p) => (
                  <label key={p.key}>
                    <input type="checkbox" checked={form.permissions.includes(p.key) || form.permissions.includes("*")} onChange={() => togglePerm(p.key)} disabled={!canEdit} />
                    {p.action}
                  </label>
                ))}
              </div>
            </details>
          ))}
          {canEdit ? (
            <div className="admin-access__sticky-save">
              <button type="button" onClick={saveRole}>Save role</button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
