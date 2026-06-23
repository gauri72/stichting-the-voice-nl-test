import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";

const SCOPES = [
  { value: "global", label: "Global Checkout Form" },
  { value: "event_type", label: "Event Type Forms" },
  { value: "event", label: "Event Specific Forms" },
  { value: "ticket_type", label: "Ticket Type Forms" },
];

function emptyField(i = 1) {
  return {
    fieldId: `field_${Date.now()}_${i}`,
    label: "",
    type: "text",
    required: false,
    repeatMode: "order",
    options: [],
    order: i,
    visibility: true,
    showInAdmin: true,
  };
}

export default function AdminCheckoutFormsPage() {
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [status, setStatus] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [form, setForm] = useState({
    name: "",
    scope: "global",
    eventType: "",
    eventId: "",
    ticketTypeId: "",
    status: "published",
    fields: [emptyField(1)],
  });

  async function load() {
    const [f, r] = await Promise.all([
      apiFetch(`/api/admin/checkout-forms${scopeFilter ? `?scope=${scopeFilter}` : ""}`, { headers: authHeaders() }),
      apiFetch("/api/admin/checkout-forms/responses", { headers: authHeaders() }),
    ]);
    setForms(f.forms || []);
    setResponses(r.responses || []);
  }

  useEffect(() => {
    load().catch((e) => setStatus(e.message || "Failed to load checkout forms."));
  }, [scopeFilter]);

  const grouped = useMemo(
    () => forms.reduce((acc, f) => {
      (acc[f.scope] ||= []).push(f);
      return acc;
    }, {}),
    [forms]
  );

  function addField() {
    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, emptyField(prev.fields.length + 1)],
    }));
  }

  function updateField(idx, key, value) {
    setForm((prev) => {
      const fields = [...prev.fields];
      fields[idx] = { ...fields[idx], [key]: value };
      return { ...prev, fields };
    });
  }

  async function saveForm(e) {
    e.preventDefault();
    setStatus("");
    try {
      await apiFetch("/api/admin/checkout-forms", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      setStatus("Checkout form saved.");
      setForm({
        name: "",
        scope: "global",
        eventType: "",
        eventId: "",
        ticketTypeId: "",
        status: "published",
        fields: [emptyField(1)],
      });
      await load();
    } catch (err) {
      setStatus(err.message || "Failed to save form.");
    }
  }

  return (
    <AdminLayout
      pageTitle="Checkout Forms"
      pageSubtitle="Global, event type, event specific, ticket type, templates and responses"
    >
      <section className="admin-events__card">
        <h2>Create Checkout Form</h2>
        <form className="admin-events__form-grid" onSubmit={saveForm}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <label>
            Scope
            <select value={form.scope} onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}>
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          {form.scope === "event_type" ? (
            <label>
              Event Type
              <input value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))} />
            </label>
          ) : null}
          {form.scope === "event" ? (
            <label>
              Event ID
              <input value={form.eventId} onChange={(e) => setForm((p) => ({ ...p, eventId: e.target.value }))} />
            </label>
          ) : null}
          {form.scope === "ticket_type" ? (
            <label>
              Ticket Type ID
              <input value={form.ticketTypeId} onChange={(e) => setForm((p) => ({ ...p, ticketTypeId: e.target.value }))} />
            </label>
          ) : null}
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="admin-events__form-actions">
            <button type="button" className="admin-events__secondary-btn" onClick={addField}>Add Field</button>
            <button type="submit" className="admin-events__primary-btn">Publish Form</button>
          </div>
          {form.fields.map((field, idx) => (
            <div key={field.fieldId} className="admin-events__card" style={{ marginTop: 8 }}>
              <label>Field Label<input value={field.label} onChange={(e) => updateField(idx, "label", e.target.value)} required /></label>
              <label>
                Type
                <select value={field.type} onChange={(e) => updateField(idx, "type", e.target.value)}>
                  {["text", "email", "phone", "number", "textarea", "dropdown", "multi_select", "radio", "checkbox", "date", "time", "file", "image", "url", "consent", "section_heading", "description_text"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Repeat Mode
                <select value={field.repeatMode} onChange={(e) => updateField(idx, "repeatMode", e.target.value)}>
                  {["order", "ticket_quantity", "participant_count", "ticket_type", "none"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label><input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, "required", e.target.checked)} /> Required</label>
              <label><input type="checkbox" checked={Boolean(field.showInEmail)} onChange={(e) => updateField(idx, "showInEmail", e.target.checked)} /> Show in email</label>
              <label><input type="checkbox" checked={Boolean(field.showInPdf)} onChange={(e) => updateField(idx, "showInPdf", e.target.checked)} /> Show in PDF</label>
              <label><input type="checkbox" checked={field.showInAdmin !== false} onChange={(e) => updateField(idx, "showInAdmin", e.target.checked)} /> Show in admin</label>
              <label><input type="checkbox" checked={Boolean(field.showInCheckIn)} onChange={(e) => updateField(idx, "showInCheckIn", e.target.checked)} /> Show in check-in</label>
            </div>
          ))}
        </form>
        {status ? <p className="admin-events__hint">{status}</p> : null}
      </section>

      <section className="admin-events__card">
        <h2>Form Templates & Published Forms</h2>
        <label>
          Filter Scope
          <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            <option value="">All</option>
            {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        {Object.entries(grouped).map(([scope, list]) => (
          <div key={scope}>
            <h3>{scope}</h3>
            <ul>
              {list.map((f) => <li key={f.id}>{f.name} ({f.status}) - {f.fields?.length || 0} fields</li>)}
            </ul>
          </div>
        ))}
      </section>

      <section className="admin-events__card">
        <h2>Form Responses</h2>
        <p className="admin-events__hint">Use /admin/checkout-forms/responses filters via query params for event/ticketType export.</p>
        <ul>
          {responses.slice(0, 25).map((r) => (
            <li key={r.id}>
              {r.responseId} - {r.orderId || "No order"} - {r.answers?.length || 0} answers
            </li>
          ))}
        </ul>
      </section>
    </AdminLayout>
  );
}
