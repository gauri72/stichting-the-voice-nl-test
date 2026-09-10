import { useCallback, useEffect, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const TABS = [
  { key: "volunteer", label: "Volunteer Applications", endpoint: "volunteer-applications", dataKey: "applications" },
  { key: "ventureStudio", label: "Venture Studio Messages", endpoint: "venture-studio-messages", dataKey: "messages" },
];

export default function AdminContactSubmissionsPage() {
  const [activeTab, setActiveTab] = useState("volunteer");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const tab = TABS.find((t) => t.key === activeTab);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const data = await apiFetch(
        `/api/admin/contact-submissions/${tab.endpoint}?${params}`,
        { headers: adminAuthHeaders() }
      );
      setItems(data[tab.dataKey] || []);
    } catch (err) {
      setError(err.message || "Could not load submissions.");
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <section className="admin-events__card">
        <div className="admin-events__form-actions">
          <h3>Contact Submissions</h3>
        </div>

        <div className="admin-events__form-actions" style={{ marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{ fontWeight: activeTab === t.key ? 700 : 400 }}
            >
              {t.label}
            </button>
          ))}
        </div>

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
        ) : items.length === 0 ? (
          <p className="admin-events__hint">No {tab.label.toLowerCase()} yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Name</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Email</th>
                  {tab.key === "volunteer" ? (
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Phone</th>
                  ) : (
                    <th style={{ textAlign: "left", padding: "8px 12px" }}>Subject</th>
                  )}
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Message</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "8px 12px" }}>{item.name}</td>
                    <td style={{ padding: "8px 12px" }}>{item.email}</td>
                    <td style={{ padding: "8px 12px" }}>{tab.key === "volunteer" ? item.phone || "—" : item.subject}</td>
                    <td style={{ padding: "8px 12px", maxWidth: 320 }}>{item.message}</td>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("nl-NL") : ""}
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
