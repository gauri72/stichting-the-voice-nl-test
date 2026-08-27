import { useState } from "react";
import { IconCrown } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

export default function SendVipPassModal({ event, onClose }) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function handleSend(e) {
    e.preventDefault();
    setError("");
    setSent("");
    setSending(true);
    try {
      await apiFetch("/api/admin/vip-passes", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ eventId: event.id, guestName, guestEmail }),
      });
      setSent(guestEmail);
      setGuestName("");
      setGuestEmail("");
    } catch (err) {
      setError(err.message || "Could not send VIP pass.");
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
            Sends a themed VIP Pass for <strong>{event.title}</strong> straight to the guest&rsquo;s inbox — no checkout, no payment.
          </p>

          <label>
            Guest name
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
          </label>
          <label>
            Guest email
            <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
          </label>

          {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
          {sent ? <p className="admin-events__save-message" role="status">VIP Pass sent to {sent}.</p> : null}

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
