import { useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";

export default function AccessPermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/access/permissions", { headers: adminAuthHeaders() })
      .then((data) => setPermissions(data.permissions || []))
      .catch((err) => setError(err.message || "Could not load permissions."));
  }, []);

  const filtered = permissions.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.key.includes(q) || p.module.includes(q) || p.label?.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce((acc, p) => {
    acc[p.module] = acc[p.module] || [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <section className="admin-events__card">
      <h3>Permissions</h3>
      <p className="admin-events__hint">Module + action permissions used across the admin panel.</p>
      <label>
        Search
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="events.edit, finance…" />
      </label>
      {error ? <p className="admin-events__error">{error}</p> : null}
      {Object.entries(grouped).map(([module, perms]) => (
        <details key={module} className="admin-access__perm-group" open>
          <summary>{module.replace(/_/g, " ")} ({perms.length})</summary>
          <div className="admin-access__perm-grid">
            {perms.map((p) => (
              <code key={p.key}>{p.key}</code>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
