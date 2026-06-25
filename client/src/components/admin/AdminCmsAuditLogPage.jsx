import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-cms-page.css";

export default function AdminCmsAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/pages/cms-audit-log", { headers: adminAuthHeaders() });
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message || "Could not load the CMS audit log.");
    } finally {
      setLoading(false);
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
      || log.targetId?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout pageTitle="CMS Audit Log" pageSubtitle="Every CMS change — who, what, when.">
      <div className="admin-cms">
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? <p className="admin-cms__status">Loading…</p> : null}
        <div className="admin-cms__field-row">
          <label className="admin-cms__label">Filter</label>
          <input className="admin-cms__input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search action, user, summary…" />
        </div>
        <div className="admin-cms__table-wrap">
          <table className="admin-cms__table">
            <thead>
              <tr><th>Time</th><th>User</th><th>Action</th><th>Target</th><th>Summary</th></tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</td>
                  <td>{log.user}<br /><small>{log.email}</small></td>
                  <td><code>{log.action}</code></td>
                  <td><code>{log.targetType}</code> {log.targetId}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
              {!filtered.length && !loading ? (
                <tr><td colSpan={5} className="admin-cms__empty">No CMS audit entries found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16 }}>
          <Link to="/admin/cms" className="admin-cms__back"><IconArrowLeft size={16} /> Back to CMS</Link>
        </p>
      </div>
    </AdminLayout>
  );
}
