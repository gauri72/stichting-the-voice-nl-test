import { useState } from "react";
import { IconCrown } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

export default function SendVipPassModal({ event, onClose }) {
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [numPasses, setNumPasses] = useState(1);
  const [guestNamesText, setGuestNamesText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(null);

  async function handleSend(e) {
    e.preventDefault();
    setError("");
    setSent(null);

    const guestNames = guestNamesText.split("\n").map((n) => n.trim()).filter(Boolean);
    if (guestNames.length !== Number(numPasses)) {
      setError(`Guest names (${guestNames.length}) must match the number of VIP passes (${numPasses}).`);
      return;
    }

    setSending(true);
    try {
      const result = await apiFetch("/api/admin/vip-passes/group", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ eventId: event.id, primaryContactName, primaryContactEmail, guestNames }),
      });
      setSent({ email: primaryContactEmail, count: result.tickets?.length || guestNames.length });
      setPrimaryContactName("");
      setPrimaryContactEmail("");
      setNumPasses(1);
      setGuestNamesText("");
    } catch (err) {
      setError(err.message || "Could not send VIP passes.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="send-vip-pass-title">
      <div className="admin-modal">
        <header className="admin-modal__header">
          <h2 id="send-vip-pass-title">
            <IconCrown size={18} aria-hidden style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Send VIP Pass
          </h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSend} className="admin-modal__body send-vip-pass-form">
          <p className="admin-events__hint">
            Sends one or more themed VIP Passes for <strong>{event.title}</strong>, collated into a single PDF (one page per guest) and emailed to the primary contact — no checkout, no payment.
          </p>

          <label>
            Primary contact name
            <input placeholder="e.g. Ambassador Sharma" value={primaryContactName} onChange={(e) => setPrimaryContactName(e.target.value)} required />
          </label>
          <label>
            Email (PDF will be sent here)
            <input type="email" placeholder="you@email.com" value={primaryContactEmail} onChange={(e) => setPrimaryContactEmail(e.target.value)} required />
          </label>
          <label>
            Number of VIP passes
            <input type="number" min="1" max="20" value={numPasses} onChange={(e) => setNumPasses(e.target.value)} required />
          </label>
          <label>
            Guest names — one per line, must match the quantity above
            <textarea
              rows={Math.max(3, Number(numPasses) || 1)}
              placeholder={"1. Full Name\n2. Full Name"}
              value={guestNamesText}
              onChange={(e) => setGuestNamesText(e.target.value)}
              required
            />
          </label>

          {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
          {sent ? (
            <p className="admin-events__save-message" role="status">
              {sent.count} VIP {sent.count === 1 ? "Pass" : "Passes"} sent to {sent.email}.
            </p>
          ) : null}

          <div className="admin-modal__footer">
            <button type="button" className="admin-events__secondary-btn" onClick={onClose}>Close</button>
            <button type="submit" className="admin-events__primary-btn" disabled={sending}>
              {sending ? "Sending…" : "Send VIP Pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
