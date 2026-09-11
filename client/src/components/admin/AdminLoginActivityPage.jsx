import { useCallback, useEffect, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const METHOD_LABELS = {
  password: "Email & Password",
  google: "Google",
};

export default function AdminLoginActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const data = await apiFetch(`/api/admin/login-activity?${params}`, { headers: adminAuthHeaders() });
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Could not load login activity.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <section className="admin-events__card">
        <div className="admin-events__form-actions">
          <h3>Login Activity</h3>
        </div>
        <p className="admin-events__hint" style={{ marginBottom: 16 }}>
          Every time a customer logs in, on their account. Use this to see who's active and who's
          gone quiet when planning offers.
        </p>

        <div className="admin-events__form-actions" style={{ marginBottom: 16 }}>
          <IconSearch size={16} aria-hidden />
          <input
            type="search"
            placeholder="Search by name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
        </div>

        {error ? <p className="admin-events__error">{error}</p> : null}

        {loading ? (
          <p className="admin-events__hint">Loading…</p>
        ) : events.length === 0 ? (
          <p className="admin-events__hint">No login activity yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Method</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Logged In At</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "8px 12px" }}>
                      {event.firstName} {event.lastName}
                    </td>
                    <td style={{ padding: "8px 12px" }}>{event.email}</td>
                    <td style={{ padding: "8px 12px" }}>{METHOD_LABELS[event.method] || event.method}</td>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      {event.loggedInAt ? new Date(event.loggedInAt).toLocaleString("nl-NL") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
