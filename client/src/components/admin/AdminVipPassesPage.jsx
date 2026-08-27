import { useCallback, useEffect, useState } from "react";
import { IconMail, IconTrash } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-tickets-page.css";

const EMPTY_GUEST = { guestName: "", guestEmail: "" };
const EMPTY_THEME = { primaryColor: "", backgroundColor: "", logoUrl: "", welcomeMessage: "" };

function statusLabel(guest) {
  if (guest.status !== "valid") return guest.status === "voided" ? "Voided" : guest.status;
  if (guest.checkedIn) {
    return `Checked in ${guest.checkedInAt ? new Date(guest.checkedInAt).toLocaleString() : ""}`;
  }
  return "Sent";
}

export default function AdminVipPassesPage() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [guests, setGuests] = useState([]);
  const [theme, setTheme] = useState(EMPTY_THEME);
  const [form, setForm] = useState(EMPTY_GUEST);
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bulkResult, setBulkResult] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/discounts/events", { headers: adminAuthHeaders() });
      const list = data.events || [];
      setEvents(list);
      if (!eventId && list.length) setEventId(list[0].id);
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError("");
    try {
      const [guestData, themeData] = await Promise.all([
        apiFetch(`/api/admin/vip-passes?eventId=${eventId}`, { headers: adminAuthHeaders() }),
        apiFetch(`/api/admin/vip-passes/theme/${eventId}`, { headers: adminAuthHeaders() }),
      ]);
      setGuests(guestData.guests || []);
      setTheme({ ...EMPTY_THEME, ...(themeData.theme || {}) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadEventData(); }, [loadEventData]);

  async function handleAddGuest(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiFetch("/api/admin/vip-passes", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ eventId, guestName: form.guestName, guestEmail: form.guestEmail }),
      });
      setForm(EMPTY_GUEST);
      setMessage(`VIP Pass sent to ${form.guestEmail}.`);
      loadEventData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBulkAdd(e) {
    e.preventDefault();
    setError("");
    setBulkResult(null);
    const guestList = bulkText
      .split("\n")
      .map((line) => {
        const [name, email] = line.split(",").map((s) => s.trim());
        return { name, email };
      })
      .filter((g) => g.name && g.email);
    if (!guestList.length) {
      setError("Add at least one guest (one per line: Name, email@example.com).");
      return;
    }
    try {
      const result = await apiFetch("/api/admin/vip-passes/bulk", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ eventId, guests: guestList }),
      });
      setBulkResult(result);
      setBulkText("");
      loadEventData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResend(ticketId) {
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/admin/vip-passes/${ticketId}/resend`, { method: "POST", headers: adminAuthHeaders() });
      setMessage("VIP Pass resent.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVoid(ticketId) {
    if (!window.confirm("Void this VIP Pass? It can no longer be used to check in.")) return;
    setError("");
    try {
      await apiFetch(`/api/admin/vip-passes/${ticketId}/void`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ reason: "Revoked by admin" }),
      });
      loadEventData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTheme((t) => ({ ...t, logoUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSaveTheme(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/admin/vip-passes/theme/${eventId}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(theme),
      });
      setMessage("VIP Pass theme saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AdminLayout pageTitle="VIP Passes" pageSubtitle="Invite VIP guests per event with a themed, scannable pass — no checkout required.">
      <div className="admin-tickets">
        <div className="admin-tickets__voucher-form-grid">
          <label>
            Event
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="admin-tickets__error">{error}</p> : null}
        {message ? <p className="admin-tickets__status">{message}</p> : null}

        <form className="admin-tickets__voucher-form admin-tickets__voucher-form--full" onSubmit={handleSaveTheme}>
          <h3>Pass theme for this event</h3>
          <div className="admin-tickets__voucher-form-grid">
            <label>
              Primary / accent color
              <input type="color" value={theme.primaryColor || "#0a8a98"} onChange={(e) => setTheme((t) => ({ ...t, primaryColor: e.target.value }))} />
            </label>
            <label>
              Background color
              <input type="color" value={theme.backgroundColor || "#06152f"} onChange={(e) => setTheme((t) => ({ ...t, backgroundColor: e.target.value }))} />
            </label>
            <label>
              Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
            </label>
          </div>
          {theme.logoUrl ? <img src={theme.logoUrl} alt="Pass logo preview" style={{ height: 40, marginTop: 8 }} /> : null}
          <textarea
            rows={3}
            placeholder="Custom welcome message (optional) — shown on the pass and in the email."
            value={theme.welcomeMessage}
            onChange={(e) => setTheme((t) => ({ ...t, welcomeMessage: e.target.value }))}
          />
          <button type="submit" className="admin-tickets__btn">Save Theme</button>
        </form>

        <form className="admin-tickets__voucher-form admin-tickets__voucher-form--full" onSubmit={handleAddGuest}>
          <h3>Add a VIP guest</h3>
          <div className="admin-tickets__voucher-form-grid">
            <input placeholder="Guest name" value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} required />
            <input type="email" placeholder="Guest email" value={form.guestEmail} onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))} required />
          </div>
          <button type="submit" className="admin-tickets__btn admin-tickets__btn--primary"><IconMail size={16} /> Send Pass</button>
        </form>

        <form className="admin-tickets__voucher-form admin-tickets__voucher-form--full" onSubmit={handleBulkAdd}>
          <h3>Bulk-add VIP guests</h3>
          <textarea
            rows={5}
            placeholder={"One guest per line: Name, email@example.com"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button type="submit" className="admin-tickets__btn admin-tickets__btn--primary">Send Passes</button>
          {bulkResult ? (
            <p className="admin-tickets__status">
              Sent {bulkResult.succeeded} of {bulkResult.total}.
              {bulkResult.failed ? ` ${bulkResult.failed} failed: ${bulkResult.results.filter((r) => !r.success).map((r) => `${r.input?.email || "?"} (${r.error})`).join(", ")}` : ""}
            </p>
          ) : null}
        </form>

        {loading ? <p className="admin-tickets__status">Loading…</p> : (
          <div className="admin-tickets__table-wrap admin-table-scroll">
            <table className="admin-tickets__table">
              <thead><tr><th>Name</th><th>Email</th><th>Ticket #</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {guests.map((g) => (
                  <tr key={g.ticketId}>
                    <td>{g.name}</td>
                    <td>{g.email}</td>
                    <td className="admin-tickets__mono">{g.ticketNumber}</td>
                    <td>{statusLabel(g)}</td>
                    <td>
                      <button type="button" className="admin-tickets__btn" onClick={() => handleResend(g.ticketId)}>Resend</button>
                      {g.status === "valid" ? (
                        <button type="button" onClick={() => handleVoid(g.ticketId)} aria-label="Void pass"><IconTrash size={14} /></button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!guests.length ? (
                  <tr><td colSpan={5} className="admin-tickets__status">No VIP guests yet for this event.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
