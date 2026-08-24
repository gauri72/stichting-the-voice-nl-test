import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import EventTicketTypeScopePicker from "./EventTicketTypeScopePicker.jsx";

/**
 * Inline "quick create a discount" panel opened from a ticket-type row in the event editor
 * (AdminEventsPage). Pre-fills the scope picker to this event + this ticket type, but leaves
 * it editable so the admin can widen the scope (e.g. add another event) without leaving the
 * page. Always creates a plain event_code DiscountRule — for referral/personalized codes or
 * membership tiers, the admin still uses the dedicated Discounts/Membership pages.
 */
export default function AdminTicketTypeQuickDiscount({ eventId, ticketTypeId, events, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    discountType: "percentage",
    discountValue: "",
    minQuantity: "",
    expiryDate: "",
    applyToAllEvents: false,
    eventScopes: [{ eventId, applyToAllTicketTypes: false, ticketTypeIds: [ticketTypeId] }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim() || !form.discountValue) {
      setError("Name, code, and value are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/admin/discounts", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          type: "event_code",
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          appliesTo: "tickets",
          minQuantity: form.minQuantity ? Number(form.minQuantity) : 0,
          applyToAllEvents: form.applyToAllEvents,
          eventScopes: form.eventScopes,
          expiryDate: form.expiryDate || null,
          status: "active",
          visibleToUsers: true,
          showOnDashboard: true,
        }),
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not create discount.");
    } finally {
      setSaving(false);
    }
  }

  // This panel renders inside AdminEventsPage's own page-wide <form> (the event editor), so
  // it must not be a <form> itself (invalid nested HTML forms) and must stop Enter from
  // bubbling up and submitting that outer form.
  return (
    <div
      className="admin-events__quick-discount"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    >
      <div className="admin-events__quick-discount-head">
        <h4>Add Discount</h4>
        <button type="button" className="admin-events__icon-danger" onClick={onClose} aria-label="Close">
          <IconX size={16} />
        </button>
      </div>
      {error ? <p className="admin-events__quick-discount-error">{error}</p> : null}
      <div className="admin-events__quick-discount-grid">
        <input
          className="admin-events__input"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          className="admin-events__input"
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          required
        />
        <select
          className="admin-events__select"
          value={form.discountType}
          onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
        >
          <option value="percentage">Percentage</option>
          <option value="fixed_amount">Fixed Amount</option>
        </select>
        <input
          className="admin-events__input"
          type="number"
          min="0"
          placeholder="Value"
          value={form.discountValue}
          onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
          required
        />
        <input
          className="admin-events__input"
          type="number"
          min="0"
          step="1"
          placeholder="Min tickets"
          value={form.minQuantity}
          onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
        />
        <input
          className="admin-events__input"
          type="date"
          value={form.expiryDate}
          onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
        />
      </div>
      <EventTicketTypeScopePicker
        events={events}
        value={{ applyToAllEvents: form.applyToAllEvents, eventScopes: form.eventScopes }}
        onChange={(next) => setForm((f) => ({ ...f, ...next }))}
      />
      <div className="admin-events__quick-discount-actions">
        <button type="button" className="admin-events__outline-btn admin-events__outline-btn--sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="admin-events__action-btn admin-events__action-btn--primary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Create Discount"}
        </button>
      </div>
    </div>
  );
}
