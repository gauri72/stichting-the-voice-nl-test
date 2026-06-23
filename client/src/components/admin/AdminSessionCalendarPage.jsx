import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY = {
  sessionId: "",
  startDate: "",
  endDate: "",
  startTime: "18:00",
  endTime: "19:00",
  frequency: "weekly",
  every: 1,
  weekdays: [1, 3],
  capacity: 20,
  priceMinor: 0,
};

export default function AdminSessionCalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [blockDate, setBlockDate] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSessions() {
    const data = await apiFetch("/api/admin/sessions", { headers: adminAuthHeaders() });
    setSessions(data.sessions || []);
    if (!form.sessionId && data.sessions?.[0]?.sessionId) {
      setForm((f) => ({ ...f, sessionId: data.sessions[0].sessionId }));
    }
  }

  async function loadSlots(sessionId) {
    if (!sessionId) return;
    const data = await apiFetch(`/api/admin/sessions/${sessionId}/slots`, { headers: adminAuthHeaders() });
    setSlots(data.slots || []);
  }

  useEffect(() => {
    loadSessions().catch((e) => setError(e.message || "Could not load sessions."));
  }, []);

  useEffect(() => {
    loadSlots(form.sessionId).catch((e) => setError(e.message || "Could not load slots."));
  }, [form.sessionId]);

  async function createRecurring(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await apiFetch(`/api/admin/sessions/${form.sessionId}/slots/recurring`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setMessage(`Created ${data.slots?.length || 0} recurring slots.`);
      loadSlots(form.sessionId);
    } catch (err) {
      setError(err.message || "Could not create recurring slots.");
    }
  }

  async function blockSelectedDate() {
    if (!form.sessionId || !blockDate) return;
    try {
      const data = await apiFetch(`/api/admin/sessions/${form.sessionId}/slots/block-date`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ date: blockDate, reason: "Holiday / blocked date" }),
      });
      setMessage(`Blocked ${data.blocked || 0} slot(s) on ${blockDate}.`);
      loadSlots(form.sessionId);
    } catch (err) {
      setError(err.message || "Could not block date.");
    }
  }

  return (
    <AdminLayout pageTitle="Session Calendar" pageSubtitle="Recurring slot generation, blocked dates and calendar operations.">
      {error ? <p className="admin-tickets__error">{error}</p> : null}
      {message ? <p className="admin-tickets__status">{message}</p> : null}
      <form className="admin-events__card" onSubmit={createRecurring}>
        <header className="admin-events__card-header"><h2>Create Recurring Schedule</h2></header>
        <div className="admin-events__card-body admin-events__ticket-editor-grid">
          <select className="admin-events__select" value={form.sessionId} onChange={(e) => setForm((f) => ({ ...f, sessionId: e.target.value }))}>
            <option value="">Select session</option>
            {sessions.map((s) => <option key={s.id} value={s.sessionId}>{s.name}</option>)}
          </select>
          <input className="admin-events__input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
          <input className="admin-events__input" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
          <input className="admin-events__input" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
          <input className="admin-events__input" type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
          <select className="admin-events__select" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom weekdays</option>
          </select>
          <input className="admin-events__input" type="number" min="1" value={form.every} onChange={(e) => setForm((f) => ({ ...f, every: Number(e.target.value) }))} placeholder="Every N interval" />
          <input className="admin-events__input" type="number" min="1" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
          <input className="admin-events__input" type="number" min="0" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: Number(e.target.value) }))} />
          <label style={{ gridColumn: "1 / -1" }}>
            Weekdays (for weekly/custom):{" "}
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <label key={d} style={{ marginRight: 10 }}>
                <input
                  type="checkbox"
                  checked={form.weekdays.includes(d)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      weekdays: e.target.checked ? [...new Set([...f.weekdays, d])] : f.weekdays.filter((x) => x !== d),
                    }))
                  }
                />{" "}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]}
              </label>
            ))}
          </label>
        </div>
        <footer className="admin-events__footer admin-events__footer--actions">
          <button className="admin-events__save-btn" type="submit">Generate Recurring Slots</button>
        </footer>
      </form>

      <section className="admin-events__card">
        <header className="admin-events__card-header"><h2>Block Date</h2></header>
        <div className="admin-events__card-body admin-events__ticket-editor-grid">
          <input className="admin-events__input" type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <button className="admin-events__outline-btn" type="button" onClick={blockSelectedDate}>Block selected date</button>
        </div>
      </section>

      <section className="admin-events__card">
        <header className="admin-events__card-header"><h2>Session Slots</h2></header>
        <div className="admin-events__card-body">
          <div className="admin-tickets__table-wrap">
            <table className="admin-tickets__table">
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Capacity</th>
                  <th>Remaining</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.slotId}>
                    <td>{slot.slotId}</td>
                    <td>{new Date(slot.startsAt).toLocaleString()}</td>
                    <td>{new Date(slot.endsAt).toLocaleString()}</td>
                    <td>{slot.capacity}</td>
                    <td>{slot.remainingCapacity}</td>
                    <td>€{(slot.priceMinor / 100).toFixed(2)}</td>
                    <td>{slot.isBlocked ? `Blocked (${slot.blockReason || "reason n/a"})` : "Open"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
