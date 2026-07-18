import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY_EVENT = {
  eventName: "",
  eventSlug: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  capacity: 0,
  allowGuests: true,
  maxGuests: 2,
  status: "published",
};

export default function AdminRsvpsPage() {
  const [events, setEvents] = useState([]);
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [eventsData, responsesData] = await Promise.all([
        apiFetch("/api/admin/rsvps/events", { headers: adminAuthHeaders() }),
        apiFetch(`/api/admin/rsvps${statusFilter ? `?status=${statusFilter}` : ""}`, { headers: adminAuthHeaders() }),
      ]);
      setEvents(eventsData.events || []);
      setResponses(responsesData.responses || []);
    } catch (err) {
      setError(err.message || "Could not load RSVP data.");
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function createEvent(e) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/rsvps/events", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setForm(EMPTY_EVENT);
      load();
    } catch (err) {
      setError(err.message || "Could not create RSVP event.");
    }
  }

  async function markAttended(r) {
    try {
      await apiFetch(`/api/admin/rsvps/${r.eventSlug}/${r.responseId}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ attended: true }),
      });
      load();
    } catch (err) {
      setError(err.message || "Could not update attendance.");
    }
  }

  return (
    <AdminLayout pageTitle="RSVPs" pageSubtitle="Lightweight RSVP events and guest response management.">
      {error ? <p className="admin-tickets__error">{error}</p> : null}
      <form className="admin-events__card" onSubmit={createEvent}>
        <header className="admin-events__card-header"><h2>Create RSVP Event</h2></header>
        <div className="admin-events__card-body admin-events__ticket-editor-grid">
          <input className="admin-events__input" placeholder="Event name" value={form.eventName} onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))} required />
          <input className="admin-events__input" placeholder="Event slug" value={form.eventSlug} onChange={(e) => setForm((f) => ({ ...f, eventSlug: e.target.value }))} />
          <input className="admin-events__input" type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} required />
          <input className="admin-events__input" placeholder="Start time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
          <input className="admin-events__input" placeholder="End time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
          <input className="admin-events__input" placeholder="Venue" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
          <input className="admin-events__input" type="number" min="0" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
          <input className="admin-events__input" type="number" min="0" placeholder="Max guests" value={form.maxGuests} onChange={(e) => setForm((f) => ({ ...f, maxGuests: Number(e.target.value) }))} />
        </div>
        <footer className="admin-events__footer admin-events__footer--actions"><button className="admin-events__save-btn" type="submit">Create RSVP Event</button></footer>
      </form>

      <section className="admin-events__card">
        <header className="admin-events__card-header"><h2>RSVP Responses</h2></header>
        <div className="admin-events__card-body">
          <label>
            Filter status{" "}
            <select className="admin-events__select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>
          <div className="admin-tickets__table-wrap">
            <table className="admin-tickets__table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Guests</th>
                  <th>Event</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.responseId}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.status}</td>
                    <td>{r.guestCount}</td>
                    <td>{r.eventName}</td>
                    <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
                    <td className="admin-tickets__actions">
                      <button type="button" onClick={() => markAttended(r)}>Mark attended</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 12, color: "#8a9bb5" }}>Events created: {events.length}</p>
        </div>
      </section>
    </AdminLayout>
  );
}
