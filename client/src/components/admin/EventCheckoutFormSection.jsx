import { useCallback, useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import CheckoutFormPreview from "./checkout/CheckoutFormPreview.jsx";

const SOURCE_LABELS = {
  global: "Global Form",
  standard: "Standard Form",
  event_specific: "Event-Specific Form",
  ticket_type: "Ticket-Type Form",
  event_type: "Event Type Form",
};

export default function EventCheckoutFormSection({ eventId, eventTitle, checkoutFormSource, checkoutFormMode, assignedCheckoutFormId }) {
  const [forms, setForms] = useState([]);
  const [assignedForm, setAssignedForm] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(assignedCheckoutFormId || "");
  const [source, setSource] = useState(checkoutFormSource || "global");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadForms = useCallback(async () => {
    try {
      const [standard, global, all] = await Promise.all([
        apiFetch("/api/admin/checkout-forms/standard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/checkout-forms?scope=global", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/checkout-forms", { headers: adminAuthHeaders() }),
      ]);
      const combined = [
        ...(global.forms || []),
        ...(standard.forms || []),
        ...(all.forms || []).filter((f) => f.scope === "event" || f.scope === "ticket_type"),
      ];
      setForms(combined);
      if (assignedCheckoutFormId) {
        const found = combined.find((f) => f.id === assignedCheckoutFormId);
        if (found) setAssignedForm(found);
        else {
          const single = await apiFetch(`/api/admin/checkout-forms/${assignedCheckoutFormId}`, { headers: adminAuthHeaders() }).catch(() => null);
          if (single?.form) setAssignedForm(single.form);
        }
      }
    } catch {
      /* optional */
    }
  }, [assignedCheckoutFormId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  async function applyAssignment(action, extra = {}) {
    if (!eventId || eventId === "new") {
      setStatus("Save the event first before assigning a checkout form.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const body = action === "reset_global"
        ? { action: "reset_global" }
        : action === "create_copy"
          ? { action: "create_copy", formId: selectedFormId || assignedCheckoutFormId }
          : {
              formId: selectedFormId,
              checkoutFormSource: source,
              checkoutFormMode: source === "event_specific" ? "event_specific_copy" : "linked_standard",
              ...extra,
            };
      const result = await apiFetch(`/api/admin/events/${eventId}/checkout-form`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (result.form) setAssignedForm(result.form);
      setStatus("Checkout form updated.");
    } catch (err) {
      setStatus(err.message || "Failed to update checkout form.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-events__card">
      <header className="admin-events__card-header">
        <h2>Checkout Form</h2>
      </header>
      <div className="admin-events__card-body">
        <p className="admin-events__hint">
          Current source: <strong>{SOURCE_LABELS[checkoutFormSource] || checkoutFormSource || "Global"}</strong>
          {checkoutFormMode ? ` · Mode: ${checkoutFormMode.replace(/_/g, " ")}` : null}
        </p>

        <label>
          Checkout Form Source
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="global">Global Form</option>
            <option value="standard">Standard Form</option>
            <option value="event_specific">Event-Specific Form</option>
            <option value="ticket_type">Ticket-Type Form</option>
          </select>
        </label>

        <label>
          Select Checkout Form
          <select value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)}>
            <option value="">— Select form —</option>
            {forms
              .filter((f) => {
                if (source === "global") return f.scope === "global";
                if (source === "standard") return f.scope === "standard";
                if (source === "event_specific") return f.scope === "event";
                if (source === "ticket_type") return f.scope === "ticket_type";
                return true;
              })
              .map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.status})</option>
              ))}
          </select>
        </label>

        {assignedForm ? (
          <div className="checkout-form-preview-wrap">
            <h3 className="admin-events__settings-title">Form preview</h3>
            <CheckoutFormPreview fields={assignedForm.fields || []} />
          </div>
        ) : null}

        <div className="admin-events__form-actions">
          <button type="button" className="admin-events__primary-btn" disabled={loading || !selectedFormId} onClick={() => applyAssignment("assign")}>
            Change Form
          </button>
          {assignedForm?.scope === "standard" ? (
            <a href={`/admin/checkout-forms?edit=${assignedForm.id}`} className="admin-events__outline-btn">Edit Standard Form</a>
          ) : null}
          <button type="button" className="admin-events__secondary-btn" disabled={loading || !selectedFormId} onClick={() => applyAssignment("create_copy")}>
            Create Event-Specific Copy
          </button>
          <button type="button" className="admin-events__secondary-btn" disabled={loading} onClick={() => applyAssignment("reset_global")}>
            Reset to Global Form
          </button>
        </div>

        {status ? <p className="admin-events__hint" role="status">{status}</p> : null}
      </div>
    </section>
  );
}
