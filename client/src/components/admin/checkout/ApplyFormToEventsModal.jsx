import { useEffect, useState } from "react";
import { apiFetch, authHeaders } from "../../../utils/api.js";

const APPLY_OPTIONS = [
  { value: "draft", label: "All Draft Events" },
  { value: "published", label: "All Published Events" },
  { value: "draft_published", label: "All Draft + Published Events" },
  { value: "future", label: "Future Events Only" },
  { value: "selected", label: "Selected Events" },
  { value: "by_category", label: "Events by Category" },
];

export default function ApplyFormToEventsModal({ form, onClose, onApplied }) {
  const [applyTo, setApplyTo] = useState("published");
  const [category, setCategory] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [events, setEvents] = useState([]);
  const [onlyWithoutForm, setOnlyWithoutForm] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [createEventCopy, setCreateEventCopy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/events", { headers: authHeaders() })
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);

  async function handleApply(e) {
    e.preventDefault();
    if (!confirmed) {
      setError("Please confirm you understand this will update event form assignments.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = {
        applyTo: applyTo === "by_category" ? "draft_published" : applyTo === "selected" ? "draft_published" : applyTo,
        onlyWithoutForm,
        overwriteExisting,
        createEventCopy,
      };
      if (applyTo === "by_category" && category) body.category = category;
      if (applyTo === "selected" && selectedEventIds.length) body.eventIds = selectedEventIds;
      const result = await apiFetch(`/api/admin/checkout-forms/${form.id}/apply-to-events`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      onApplied?.(result);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to apply form.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="apply-form-title">
      <div className="admin-modal admin-modal--wide">
        <header className="admin-modal__header">
          <h2 id="apply-form-title">Apply Checkout Form</h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form onSubmit={handleApply} className="admin-modal__body">
          <p className="admin-events__hint">
            Applying <strong>{form.name}</strong> to events. Existing submitted responses will not be deleted.
          </p>
          <div className="admin-events__warning" role="alert">
            This will update checkout form assignments for selected events. Existing submitted responses will not be deleted.
          </div>

          <label>
            Apply to
            <select value={applyTo} onChange={(e) => setApplyTo(e.target.value)}>
              {APPLY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {applyTo === "by_category" ? (
            <label>
              Category
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Experience" required />
            </label>
          ) : null}

          {applyTo === "selected" ? (
            <label>
              Select Events
              <select
                multiple
                size={6}
                value={selectedEventIds}
                onChange={(e) => setSelectedEventIds(Array.from(e.target.selectedOptions, (o) => o.value))}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title} ({ev.status})</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="admin-events__toggle">
            <input type="checkbox" checked={onlyWithoutForm} onChange={(e) => setOnlyWithoutForm(e.target.checked)} />
            <span>Events without assigned form only</span>
          </label>

          <label className="admin-events__toggle">
            <input type="checkbox" checked={overwriteExisting} onChange={(e) => setOverwriteExisting(e.target.checked)} />
            <span>Overwrite existing assigned forms</span>
          </label>

          <label className="admin-events__toggle">
            <input type="checkbox" checked={createEventCopy} onChange={(e) => setCreateEventCopy(e.target.checked)} />
            <span>Create event-specific copy per event (independent form)</span>
          </label>

          <label className="admin-events__toggle">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} required />
            <span>I confirm this action</span>
          </label>

          {error ? <p className="admin-events__error" role="alert">{error}</p> : null}

          <div className="admin-modal__footer">
            <button type="button" className="admin-events__secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-events__primary-btn" disabled={loading}>
              {loading ? "Applying…" : "Apply to Events"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
