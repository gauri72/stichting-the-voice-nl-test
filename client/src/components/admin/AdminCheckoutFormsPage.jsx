import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import CheckoutFormBuilder from "./checkout/CheckoutFormBuilder.jsx";
import CheckoutFormPreview from "./checkout/CheckoutFormPreview.jsx";
import ApplyFormToEventsModal from "./checkout/ApplyFormToEventsModal.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import { formatFormTypeLabel, formatScopeLabel } from "../../utils/checkoutFormUtils.js";
import "../../styles/admin-events-page.css";
import "../../styles/admin-cms-page.css";

const TABS = [
  { id: "standard", label: "Standard Forms" },
  { id: "global", label: "Global Form" },
  { id: "event", label: "Event Forms" },
  { id: "ticket_type", label: "Ticket Type Forms" },
  { id: "responses", label: "Form Responses" },
  { id: "templates", label: "Templates" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function AdminCheckoutFormsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const initialTab = location.pathname.endsWith("/responses")
    ? "responses"
    : searchParams.get("tab") || "standard";
  const editId = searchParams.get("edit");

  const [tab, setTab] = useState(initialTab);
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);
  const [editingForm, setEditingForm] = useState(null);
  const [applyForm, setApplyForm] = useState(null);
  const [previewForm, setPreviewForm] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const scopeMap = {
      standard: "standard",
      global: "global",
      event: "event",
      ticket_type: "ticket_type",
      templates: "",
    };
    const scope = scopeMap[tab];
    const formsUrl = tab === "standard"
      ? "/api/admin/checkout-forms/standard"
      : `/api/admin/checkout-forms${scope ? `?scope=${scope}` : ""}`;
    const [f, r] = await Promise.all([
      apiFetch(formsUrl, { headers: authHeaders() }),
      tab === "responses" || tab === "standard"
        ? apiFetch("/api/admin/checkout-forms/responses", { headers: authHeaders() })
        : Promise.resolve({ responses: [] }),
    ]);
    setForms(f.forms || []);
    setResponses(r.responses || []);
  }, [tab]);

  useEffect(() => {
    load().catch((e) => setStatus(e.message || "Failed to load checkout forms."));
  }, [load]);

  useEffect(() => {
    if (editId) {
      apiFetch(`/api/admin/checkout-forms/${editId}`, { headers: authHeaders() })
        .then((data) => setEditingForm(data.form))
        .catch(() => setStatus("Could not load form for editing."));
    }
  }, [editId]);

  function switchTab(next) {
    setTab(next);
    setEditingForm(null);
    setSearchParams(next === "standard" ? {} : { tab: next });
  }

  const displayForms = useMemo(() => {
    if (tab === "templates") {
      return forms.filter((f) => f.scope === "event_type" || f.formType !== "custom");
    }
    return forms;
  }, [forms, tab]);

  async function saveForm(draft) {
    setSaving(true);
    try {
      const result = await apiFetch(`/api/admin/checkout-forms/${draft.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name: draft.name, description: draft.description, fields: draft.fields }),
      });
      setEditingForm(result.form);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function publishForm(draft) {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/checkout-forms/${draft.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ fields: draft.fields }),
      });
      await apiFetch(`/api/admin/checkout-forms/${draft.id}/publish`, {
        method: "POST",
        headers: authHeaders(),
      });
      setEditingForm(null);
      setSearchParams({});
      await load();
      setStatus("Form published.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(form) {
    try {
      await apiFetch(`/api/admin/checkout-forms/${form.id}/duplicate`, { method: "POST", headers: authHeaders() });
      setStatus(`Duplicated "${form.name}".`);
      await load();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleRestore(form) {
    if (!window.confirm(`Restore "${form.name}" to its default version?`)) return;
    try {
      await apiFetch(`/api/admin/checkout-forms/${form.id}/restore-default`, { method: "POST", headers: authHeaders() });
      setStatus(`Restored "${form.name}" to default.`);
      await load();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleArchive(form) {
    if (!window.confirm(`Archive "${form.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/checkout-forms/${form.id}/archive`, { method: "POST", headers: authHeaders() });
      setStatus(`Archived "${form.name}".`);
      await load();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <AdminLayout
      pageTitle="Checkout Forms"
      pageSubtitle="Create, edit and apply checkout forms across events and ticketing flows."
    >
      <div className="admin-events__list-tabs" role="tablist" aria-label="Checkout form sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`admin-events__list-tab${tab === t.id ? " admin-events__list-tab--active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status ? <p className="admin-events__hint" role="status">{status}</p> : null}

      {editingForm ? (
        <section className="admin-events__card">
          <header className="admin-events__card-header">
            <h2>Edit: {editingForm.name}</h2>
            <button type="button" className="admin-events__secondary-btn" onClick={() => { setEditingForm(null); setSearchParams({}); }}>Close editor</button>
          </header>
          <CheckoutFormBuilder
            form={editingForm}
            onSave={saveForm}
            onPublish={publishForm}
            saving={saving}
          />
        </section>
      ) : null}

      {tab === "responses" ? (
        <section className="admin-events__card">
          <h2>Form Responses</h2>
          <div className="admin-cms__table-wrap">
            <table className="admin-cms__table">
              <thead>
                <tr>
                  <th>Response ID</th>
                  <th>Form</th>
                  <th>Version</th>
                  <th>Event</th>
                  <th>Order</th>
                  <th>Answers</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id}>
                    <td>{r.responseId}</td>
                    <td>{r.formId}</td>
                    <td>{r.formVersion || 1}</td>
                    <td>{r.eventId || "—"}</td>
                    <td>{r.orderId || "—"}</td>
                    <td>{r.answers?.length || 0}</td>
                    <td>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="admin-events__card">
          <h2>{TABS.find((t) => t.id === tab)?.label || "Forms"}</h2>
          <div className="admin-cms__table-wrap">
            <table className="admin-cms__table">
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Fields</th>
                  <th>Assigned Events</th>
                  <th>Last Updated</th>
                  <th>Version</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayForms.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{formatFormTypeLabel(f.formType)} / {formatScopeLabel(f.scope)}</td>
                    <td><span className={`checkout-form-status checkout-form-status--${f.status}`}>{f.status}</span></td>
                    <td>{f.fields?.length || 0}</td>
                    <td>{f.assignedEventsCount ?? 0}</td>
                    <td>{formatDate(f.updatedAt)}</td>
                    <td>v{f.version || 1}</td>
                    <td className="checkout-forms__actions">
                      <button type="button" className="admin-events__outline-btn admin-events__outline-btn--sm" onClick={() => setEditingForm(f)}>Edit</button>
                      <button type="button" className="admin-events__outline-btn admin-events__outline-btn--sm" onClick={() => setPreviewForm(f)}>Preview</button>
                      <button type="button" className="admin-events__outline-btn admin-events__outline-btn--sm" onClick={() => handleDuplicate(f)}>Duplicate</button>
                      {f.scope === "standard" ? (
                        <>
                          <button type="button" className="admin-events__primary-btn admin-events__primary-btn--sm" onClick={() => setApplyForm(f)}>Apply to Events</button>
                          {f.isSystemDefault ? (
                            <button type="button" className="admin-events__secondary-btn admin-events__secondary-btn--sm" onClick={() => handleRestore(f)}>Restore Default</button>
                          ) : null}
                        </>
                      ) : null}
                      {f.scope !== "global" ? (
                        <button type="button" className="admin-events__danger-btn admin-events__danger-btn--sm" onClick={() => handleArchive(f)}>Archive</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!displayForms.length ? <p className="admin-events__hint">No forms in this category yet.</p> : null}
        </section>
      )}

      {applyForm ? (
        <ApplyFormToEventsModal
          form={applyForm}
          onClose={() => setApplyForm(null)}
          onApplied={(result) => setStatus(`Applied form to ${result.updated} event(s).`)}
        />
      ) : null}

      {previewForm ? (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal admin-modal--wide">
            <header className="admin-modal__header">
              <h2>Preview: {previewForm.name}</h2>
              <button type="button" className="admin-modal__close" onClick={() => setPreviewForm(null)} aria-label="Close">×</button>
            </header>
            <div className="admin-modal__body">
              <CheckoutFormPreview fields={previewForm.fields || []} />
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
