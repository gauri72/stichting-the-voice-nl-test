import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY = {
  name: "",
  category: "",
  bookingType: "class_booking",
  location: "",
  capacity: 20,
  priceMinor: 0,
  durationMinutes: 60,
  status: "draft",
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [data, analyticsData] = await Promise.all([
        apiFetch("/api/admin/sessions", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/sessions/analytics", { headers: adminAuthHeaders() }).catch(() => ({ analytics: null })),
      ]);
      setSessions(data.sessions || []);
      setAnalytics(analyticsData.analytics || null);
    } catch (err) {
      setError(err.message || "Could not load sessions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createSession(e) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/api/admin/sessions", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message || "Could not create session.");
    }
  }

  return (
    <AdminLayout pageTitle="Sessions" pageSubtitle="Calendar-based classes, appointments, courts, venues and more.">
      {error ? <p className="admin-tickets__error">{error}</p> : null}
      {analytics ? (
        <section className="admin-tickets__stats" aria-label="Session analytics">
          {[
            { label: "Bookings", value: analytics.totals?.bookings ?? 0 },
            { label: "Revenue", value: analytics.totals?.revenue ?? "€0.00" },
            { label: "Attendance", value: analytics.totals?.attendance ?? 0 },
            { label: "No shows", value: analytics.totals?.noShows ?? 0 },
            { label: "Cancellations", value: analytics.totals?.cancellations ?? 0 },
            { label: "Utilization", value: `${analytics.totals?.utilizationPct ?? 0}%` },
          ].map((s) => (
            <article key={s.label} className="admin-tickets__stat">
              <p className="admin-tickets__stat-value">{s.value}</p>
              <p className="admin-tickets__stat-label">{s.label}</p>
            </article>
          ))}
        </section>
      ) : null}
      <form className="admin-events__card" onSubmit={createSession}>
        <header className="admin-events__card-header"><h2>Create Session</h2></header>
        <div className="admin-events__card-body admin-events__ticket-editor-grid">
          <input className="admin-events__input" placeholder="Session name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className="admin-events__input" placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <select className="admin-events__select" value={form.bookingType} onChange={(e) => setForm((f) => ({ ...f, bookingType: e.target.value }))}>
            {["class_booking", "appointment_booking", "resource_booking", "venue_booking", "restaurant_booking", "court_booking"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input className="admin-events__input" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <input className="admin-events__input" type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
          <input className="admin-events__input" type="number" min="0" placeholder="Price (minor)" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: Number(e.target.value) }))} />
          <input className="admin-events__input" type="number" min="5" placeholder="Duration minutes" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} />
          <select className="admin-events__select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {["draft", "published", "paused", "fully_booked", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <footer className="admin-events__footer admin-events__footer--actions">
          <button className="admin-events__save-btn" type="submit">Create Session</button>
        </footer>
      </form>

      <section className="admin-events__card">
        <header className="admin-events__card-header"><h2>All Sessions</h2></header>
        <div className="admin-events__card-body">
          {loading ? <p>Loading…</p> : null}
          <ul className="admin-events__list">
            {sessions.map((s) => (
              <li key={s.id} className="admin-events__list-item">
                <strong>{s.name}</strong> · {s.category || "General"} · {s.status} · {s.price}
              </li>
            ))}
          </ul>
          {analytics?.popularSessions?.length ? (
            <>
              <h3 style={{ marginTop: 16 }}>Most Popular Sessions</h3>
              <ul className="admin-events__list">
                {analytics.popularSessions.map((p) => (
                  <li key={p.sessionId} className="admin-events__list-item">
                    {p.sessionName} · {p.participants} participants
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </AdminLayout>
  );
}
