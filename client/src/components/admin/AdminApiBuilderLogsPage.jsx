import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { TRIGGER_LABELS, hasSmartApiPermission } from "../../utils/smartApiAdmin.js";
import "../../styles/admin-api-builder.css";

export default function AdminApiBuilderLogsPage() {
  const { admin } = useAdminAuth();
  const canTest = hasSmartApiPermission(admin?.role, "api_builder.test");
  const canWrite = hasSmartApiPermission(admin?.role, "api_builder.write");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const query = params.toString();
      const data = await apiFetch(`/api/admin/api-builder/logs${query ? `?${query}` : ""}`, {
        headers: adminAuthHeaders(),
      });
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message || "Could not load logs.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function openLog(id) {
    try {
      const data = await apiFetch(`/api/admin/api-builder/logs/${id}`, { headers: adminAuthHeaders() });
      setSelectedLog(data.log);
    } catch (err) {
      setError(err.message || "Could not load log.");
    }
  }

  async function retryLog(id) {
    if (!canTest) return;
    setMessage("");
    try {
      await apiFetch(`/api/admin/api-builder/logs/${id}/retry`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setMessage("Retry completed.");
      await loadLogs();
      await openLog(id);
    } catch (err) {
      setError(err.message || "Retry failed.");
    }
  }

  async function resolveLog(id) {
    if (!canWrite) return;
    try {
      await apiFetch(`/api/admin/api-builder/logs/${id}/resolve`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setMessage("Log marked resolved.");
      await loadLogs();
    } catch (err) {
      setError(err.message || "Could not resolve log.");
    }
  }

  return (
    <AdminLayout pageTitle="API Logs" pageSubtitle="Monitor integration requests, errors and retries">
      <div className="admin-events__form-actions" style={{ marginBottom: 12 }}>
        <Link to="/admin/api-builder"><IconArrowLeft size={16} /> Back to Builder</Link>
        <button type="button" onClick={loadLogs}><IconRefresh size={16} /> Refresh</button>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>
        </label>
      </div>

      {loading ? <p className="admin-events__hint">Loading logs…</p> : null}
      {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      <section className="admin-events__card">
        <table className="admin-tickets__table">
          <thead>
            <tr>
              <th>Integration</th>
              <th>Endpoint</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Code</th>
              <th>Time</th>
              <th>Retries</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.integration}</td>
                <td>{log.endpoint || "—"}</td>
                <td>{TRIGGER_LABELS[log.trigger] || log.trigger}</td>
                <td>{log.status}{log.resolved ? " ✓" : ""}</td>
                <td>{log.responseCode ?? "—"}</td>
                <td>{log.requestTime ? new Date(log.requestTime).toLocaleString() : "—"}</td>
                <td>{log.retryCount}</td>
                <td>
                  <div className="admin-events__form-actions">
                    <button type="button" onClick={() => openLog(log.id)}>View</button>
                    {canTest && log.status === "error" ? (
                      <button type="button" onClick={() => retryLog(log.id)}>Retry</button>
                    ) : null}
                    {canWrite && !log.resolved ? (
                      <button type="button" onClick={() => resolveLog(log.id)}>Resolve</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !logs.length ? <p className="admin-events__hint">No API logs yet.</p> : null}
      </section>

      {selectedLog ? (
        <section className="admin-events__card">
          <h3>Log detail — {selectedLog.integration}</h3>
          {selectedLog.errorMessage ? <p className="admin-events__error">{selectedLog.errorMessage}</p> : null}
          <h4>Request (masked)</h4>
          <pre className="admin-api-builder__test-result">{selectedLog.requestMasked || "—"}</pre>
          <h4>Response (masked)</h4>
          <pre className="admin-api-builder__test-result">{selectedLog.responseMasked || "—"}</pre>
        </section>
      ) : null}
    </AdminLayout>
  );
}
