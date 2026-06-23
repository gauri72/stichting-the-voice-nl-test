import { useCallback, useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";

export default function AccessAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/access/audit-logs", { headers: adminAuthHeaders() });
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message || "Could not load audit logs.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((log) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      log.action?.toLowerCase().includes(q)
      || log.summary?.toLowerCase().includes(q)
      || log.user?.toLowerCase().includes(q)
      || log.email?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="admin-events__card">
      <h3>Audit Logs</h3>
      <label>
        Filter
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search action, user, summary…" />
      </label>
      {error ? <p className="admin-events__error">{error}</p> : null}
      <table className="admin-tickets__table">
        <thead>
          <tr><th>Time</th><th>User</th><th>Action</th><th>Summary</th><th>IP</th></tr>
        </thead>
        <tbody>
          {filtered.map((log) => (
            <tr key={log.id}>
              <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</td>
              <td>{log.user}<br /><small>{log.email}</small></td>
              <td>{log.action}</td>
              <td>{log.summary}</td>
              <td>{log.ipAddress || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!filtered.length ? <p className="admin-events__hint">No audit logs found.</p> : null}
    </section>
  );
}
