import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY_FORM = { id: null, email: "", eventIds: [] };

export default function AdminEventNotificationsPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subscribersData, eventsData] = await Promise.all([
        apiFetch("/api/admin/event-notifications", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/event-notifications/events", { headers: adminAuthHeaders() }),
      ]);
      setSubscribers(subscribersData.subscribers || []);
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message || "Could not load event notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/admin/event-notifications", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ email: form.email, eventIds: form.eventIds }),
      });
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message || "Could not save subscriber.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(subscriber) {
    setForm({
      id: subscriber.id,
      email: subscriber.email,
      eventIds: subscriber.events.map((ev) => ev.id),
    });
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this subscriber? They will stop receiving booking notifications.")) return;
    setError("");
    try {
      await apiFetch(`/api/admin/event-notifications/${id}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      if (form.id === id) setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message || "Could not remove subscriber.");
    }
  }

  async function handleSendSummary() {
    if (!window.confirm("Send the current booking summary to every subscriber now?")) return;
    setSendingSummary(true);
    setSummaryResult("");
    setError("");
    try {
      const result = await apiFetch("/api/admin/event-notifications/send-summary", {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setSummaryResult(
        result.totalSubscribers === 0
          ? "No subscribers to notify."
          : `Sent to ${result.sent} of ${result.totalSubscribers} subscriber(s)${result.failed ? ` (${result.failed} failed — see server logs)` : ""}.`
      );
    } catch (err) {
      setError(err.message || "Could not send summary.");
    } finally {
      setSendingSummary(false);
    }
  }

  const eventOptions = events.map((ev) => ({ value: ev.id, label: ev.title }));

  return (
    <AdminLayout>
      <section className="admin-events__card">
        <div className="admin-events__form-actions" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h3>Event Notifications</h3>
          <button
            type="button"
            className="admin-events__primary-btn"
            onClick={handleSendSummary}
            disabled={sendingSummary || subscribers.length === 0}
          >
            {sendingSummary ? "Sending…" : "Send Current Summary to All Subscribers"}
          </button>
        </div>
        <p className="admin-events__hint" style={{ marginBottom: 16 }}>
          Add a teammate's email and choose which events they get booked-ticket alerts for. Each
          alert is a de-identified summary — event, ticket type, quantity, amount, and running
          booked/remaining totals — with no buyer name, email, or phone included. Use the button
          above to send everyone their current booked/remaining totals on demand, outside of any
          new booking.
        </p>

        {error ? <p className="admin-events__error">{error}</p> : null}
        {summaryResult ? <p className="admin-events__hint">{summaryResult}</p> : null}

        <form onSubmit={handleSave} className="admin-events__form-actions" style={{ marginBottom: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <input
            type="email"
            required
            placeholder="teammate@gmail.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            style={{ minWidth: 240 }}
          />
          <MultiSelectDropdown
            label="Events"
            placeholder="Select events…"
            options={eventOptions}
            selected={form.eventIds}
            onChange={(eventIds) => setForm((f) => ({ ...f, eventIds }))}
          />
          <button type="submit" className="admin-events__primary-btn" disabled={saving}>
            {form.id ? "Update subscriber" : "Add subscriber"}
          </button>
          {form.id ? (
            <button type="button" onClick={() => setForm(EMPTY_FORM)} disabled={saving}>
              Cancel
            </button>
          ) : null}
        </form>

        {loading ? (
          <p className="admin-events__hint">Loading…</p>
        ) : subscribers.length === 0 ? (
          <p className="admin-events__hint">No subscribers yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Email</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Subscribed events</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "8px 12px" }}>{subscriber.email}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {subscriber.events.length === 0
                        ? "—"
                        : subscriber.events.map((ev) => ev.title).join(", ")}
                    </td>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => handleEdit(subscriber)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleRemove(subscriber.id)}>
                        Remove
                      </button>
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
