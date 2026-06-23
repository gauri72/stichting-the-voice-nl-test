import { useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { formatDate } from "../../../utils/settingsAdmin.js";

export default function AdminSettingsAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/settings/audit-logs?limit=100", { headers: adminAuthHeaders() })
      .then((d) => setLogs(d.logs || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>System Logs</h1>
        <p>Settings change audit trail (masked values only).</p>
      </header>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}

      <div className="admin-settings__table-wrap">
        <table className="admin-settings__table">
          <thead>
            <tr>
              <th>When</th>
              <th>Category</th>
              <th>Key</th>
              <th>Action</th>
              <th>Old</th>
              <th>New</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.auditId || log._id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>{log.category}</td>
                <td>{log.key}</td>
                <td>{log.action}</td>
                <td><code>{log.oldValueMasked}</code></td>
                <td><code>{log.newValueMasked}</code></td>
                <td>{log.changedBy?.email || log.changedBy?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
