import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IconPlus, IconTrash, IconPlayerPlay, IconRocket, IconList } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  AUTH_LABELS,
  BUILDER_STEPS,
  CATEGORY_LABELS,
  MASK_SENTINEL,
  TRIGGER_LABELS,
  canActivateLive,
  credentialFieldsForAuth,
  emptyIntegration,
  hasSmartApiPermission,
} from "../../utils/smartApiAdmin.js";
import "../../styles/admin-api-builder.css";

function mergeIntegration(data) {
  return {
    ...emptyIntegration(),
    ...data,
    oauthConfig: { ...emptyIntegration().oauthConfig, ...(data?.oauthConfig || {}) },
    endpoints: data?.endpoints?.length ? data.endpoints : emptyIntegration().endpoints,
    fieldMappings: data?.fieldMappings || [],
    credentials: data?.credentials || [],
  };
}

export default function AdminApiBuilderPage() {
  const { admin } = useAdminAuth();
  const canWrite = hasSmartApiPermission(admin?.role, "api_builder.write");
  const canTest = hasSmartApiPermission(admin?.role, "api_builder.test");
  const canLive = canActivateLive(admin?.role);

  const [config, setConfig] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(emptyIntegration());
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [credentialInputs, setCredentialInputs] = useState({});

  const isNew = selectedId === "new";
  const selectedEndpoint = draft.endpoints?.[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cfg, data] = await Promise.all([
        apiFetch("/api/admin/api-builder/config", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/api-builder/integrations", { headers: adminAuthHeaders() }),
      ]);
      setConfig(cfg);
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError(err.message || "Could not load API Builder.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedId || selectedId === "new") return;
    apiFetch(`/api/admin/api-builder/integrations/${selectedId}`, { headers: adminAuthHeaders() })
      .then((data) => {
        setDraft(mergeIntegration(data.integration));
        setCredentialInputs({});
        setTestResult(null);
        setStep(1);
      })
      .catch((err) => setError(err.message || "Could not load integration."));
  }, [selectedId]);

  function startNew(template) {
    const base = emptyIntegration();
    if (template) {
      base.name = template.name;
      base.category = template.category;
      base.description = template.description;
      base.baseUrl = template.baseUrl;
      base.connectionType = template.connectionType;
      base.authType = template.authType;
      base.templateId = template.id;
      base.endpoints = template.endpoints?.length ? template.endpoints : base.endpoints;
    }
    setSelectedId("new");
    setDraft(base);
    setCredentialInputs({});
    setStep(1);
    setTestResult(null);
  }

  function updateDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  async function saveIntegration() {
    if (!canWrite) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const credentials = credentialFieldsForAuth(draft.authType).map((field) => ({
        credentialKey: field.key,
        value: credentialInputs[field.key] || undefined,
      })).filter((c) => c.value);

      const payload = {
        ...draft,
        credentials,
        webhookSecret: credentialInputs.webhookSecret || draft.webhookSecret,
      };

      if (isNew) {
        const data = await apiFetch("/api/admin/api-builder/integrations", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
        setMessage("Integration created.");
        setSelectedId(data.integration.id);
      } else {
        await apiFetch(`/api/admin/api-builder/integrations/${selectedId}`, {
          method: "PATCH",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
        setMessage("Integration saved.");
      }
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function runTest(saveSample = false) {
    if (!canTest || isNew) {
      setError("Save the integration before testing.");
      return;
    }
    setTesting(true);
    setError("");
    setTestResult(null);
    try {
      const result = await apiFetch(`/api/admin/api-builder/integrations/${selectedId}/test`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          endpointId: selectedEndpoint?.id,
          saveSampleResponse: saveSample,
        }),
      });
      setTestResult(result);
    } catch (err) {
      setError(err.message || "Test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function activate() {
    if (!canWrite) return;
    if (draft.environment === "live" && !canLive) {
      setError("Only Super Admin can activate live integrations.");
      return;
    }
    setSaving(true);
    try {
      await saveIntegration();
      const data = await apiFetch(`/api/admin/api-builder/integrations/${selectedId}/activate`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setDraft(mergeIntegration(data.integration));
      setMessage("Integration activated.");
      await load();
    } catch (err) {
      setError(err.message || "Activation failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/api-builder/integrations/${selectedId}/deactivate`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      setDraft(mergeIntegration(data.integration));
      setMessage("Integration deactivated.");
      await load();
    } catch (err) {
      setError(err.message || "Deactivation failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteIntegration() {
    if (!window.confirm("Delete this integration?")) return;
    try {
      await apiFetch(`/api/admin/api-builder/integrations/${selectedId}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      setSelectedId(null);
      setDraft(emptyIntegration());
      setMessage("Integration deleted.");
      await load();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  }

  function updateEndpoint(index, patch) {
    const endpoints = [...(draft.endpoints || [])];
    endpoints[index] = { ...endpoints[index], ...patch };
    updateDraft({ endpoints });
  }

  function addEndpoint() {
    updateDraft({
      endpoints: [
        ...(draft.endpoints || []),
        { name: "New endpoint", method: "GET", path: "/", headers: {}, queryParams: {}, bodyTemplate: "" },
      ],
    });
  }

  function removeEndpoint(index) {
    updateDraft({ endpoints: draft.endpoints.filter((_, i) => i !== index) });
  }

  function addMapping() {
    updateDraft({
      fieldMappings: [
        ...(draft.fieldMappings || []),
        { direction: "response", sourcePath: "", targetPath: "", description: "" },
      ],
    });
  }

  function updateMapping(index, patch) {
    const fieldMappings = [...(draft.fieldMappings || [])];
    fieldMappings[index] = { ...fieldMappings[index], ...patch };
    updateDraft({ fieldMappings });
  }

  function removeMapping(index) {
    updateDraft({ fieldMappings: draft.fieldMappings.filter((_, i) => i !== index) });
  }

  const stepContent = useMemo(() => {
    if (!selectedId) return null;

    if (step === 1) {
      return (
        <div className="admin-api-builder__form-grid">
          <label className="admin-api-builder__full">
            Integration name
            <input value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })} disabled={!canWrite} />
          </label>
          <label>
            Category
            <select value={draft.category} onChange={(e) => updateDraft({ category: e.target.value })} disabled={!canWrite}>
              {(config?.categories || []).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
              ))}
            </select>
          </label>
          <label>
            Connection type
            <select value={draft.connectionType} onChange={(e) => updateDraft({ connectionType: e.target.value })} disabled={!canWrite}>
              {(config?.connectionTypes || []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="admin-api-builder__full">
            Base URL
            <input value={draft.baseUrl} onChange={(e) => updateDraft({ baseUrl: e.target.value })} placeholder="https://api.example.com" disabled={!canWrite} />
          </label>
          <label>
            Environment
            <select value={draft.environment} onChange={(e) => updateDraft({ environment: e.target.value })} disabled={!canWrite}>
              <option value="test">Test</option>
              <option value="live" disabled={!canLive}>Live{!canLive ? " (Super Admin)" : ""}</option>
            </select>
          </label>
          <label>
            Status
            <input value={draft.status || "draft"} readOnly />
          </label>
          <label className="admin-api-builder__full">
            Description
            <textarea rows={3} value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} disabled={!canWrite} />
          </label>
          {draft.webhookUrl || draft.integrationKey ? (
            <p className="admin-api-builder__full admin-events__hint">
              Webhook URL: <code>{draft.webhookUrl || `/api/webhooks/custom/${draft.integrationKey}`}</code>
            </p>
          ) : null}
        </div>
      );
    }

    if (step === 2) {
      const fields = credentialFieldsForAuth(draft.authType);
      return (
        <div className="admin-api-builder__form-grid">
          <label className="admin-api-builder__full">
            Authentication type
            <select value={draft.authType} onChange={(e) => updateDraft({ authType: e.target.value })} disabled={!canWrite}>
              {(config?.authTypes || []).map((a) => <option key={a} value={a}>{AUTH_LABELS[a] || a}</option>)}
            </select>
          </label>
          {fields.map((field) => (
            <label key={field.key}>
              {field.label}
              <input
                type="password"
                placeholder={MASK_SENTINEL}
                value={credentialInputs[field.key] || ""}
                onChange={(e) => setCredentialInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                disabled={!canWrite}
              />
            </label>
          ))}
          {draft.connectionType === "webhook" ? (
            <label className="admin-api-builder__full">
              Webhook secret
              <input
                type="password"
                placeholder={draft.webhookSecretSet ? MASK_SENTINEL : "Set signing secret"}
                value={credentialInputs.webhookSecret || ""}
                onChange={(e) => setCredentialInputs((prev) => ({ ...prev, webhookSecret: e.target.value }))}
                disabled={!canWrite}
              />
            </label>
          ) : null}
          {draft.authType === "oauth2" ? (
            <>
              <label>
                Token URL
                <input value={draft.oauthConfig?.tokenUrl || ""} onChange={(e) => updateDraft({ oauthConfig: { ...draft.oauthConfig, tokenUrl: e.target.value } })} disabled={!canWrite} />
              </label>
              <label>
                Scope
                <input value={draft.oauthConfig?.scope || ""} onChange={(e) => updateDraft({ oauthConfig: { ...draft.oauthConfig, scope: e.target.value } })} disabled={!canWrite} />
              </label>
            </>
          ) : null}
          <p className="admin-api-builder__full admin-events__hint">Credentials are encrypted server-side and never returned in full.</p>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div>
          {(draft.endpoints || []).map((ep, index) => (
            <div key={index} className="admin-api-builder__endpoint-card">
              <div className="admin-api-builder__form-grid">
                <label>
                  Endpoint name
                  <input value={ep.name} onChange={(e) => updateEndpoint(index, { name: e.target.value })} disabled={!canWrite} />
                </label>
                <label>
                  Method
                  <select value={ep.method} onChange={(e) => updateEndpoint(index, { method: e.target.value })} disabled={!canWrite}>
                    {(config?.httpMethods || ["GET", "POST"]).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label className="admin-api-builder__full">
                  Path
                  <input value={ep.path} onChange={(e) => updateEndpoint(index, { path: e.target.value })} disabled={!canWrite} />
                </label>
                <label className="admin-api-builder__full">
                  Headers (JSON)
                  <textarea rows={2} value={JSON.stringify(ep.headers || {}, null, 2)} onChange={(e) => {
                    try { updateEndpoint(index, { headers: JSON.parse(e.target.value || "{}") }); } catch { /* ignore */ }
                  }} disabled={!canWrite} />
                </label>
                <label className="admin-api-builder__full">
                  Query parameters (JSON)
                  <textarea rows={2} value={JSON.stringify(ep.queryParams || {}, null, 2)} onChange={(e) => {
                    try { updateEndpoint(index, { queryParams: JSON.parse(e.target.value || "{}") }); } catch { /* ignore */ }
                  }} disabled={!canWrite} />
                </label>
                <label className="admin-api-builder__full">
                  Request body template
                  <textarea rows={4} value={ep.bodyTemplate || ""} onChange={(e) => updateEndpoint(index, { bodyTemplate: e.target.value })} disabled={!canWrite} />
                </label>
              </div>
              {canWrite && draft.endpoints.length > 1 ? (
                <button type="button" onClick={() => removeEndpoint(index)}><IconTrash size={14} /> Remove</button>
              ) : null}
            </div>
          ))}
          {canWrite ? <button type="button" onClick={addEndpoint}><IconPlus size={14} /> Add endpoint</button> : null}
        </div>
      );
    }

    if (step === 4) {
      return (
        <div>
          <p className="admin-events__hint">Send a test request using the saved configuration. Outbound calls are SSRF-protected and rate-limited.</p>
          <div className="admin-events__form-actions">
            <button type="button" disabled={testing || isNew || !canTest} onClick={() => runTest(false)}>
              <IconPlayerPlay size={16} /> {testing ? "Testing…" : "Send test request"}
            </button>
            <button type="button" disabled={testing || isNew || !canTest} onClick={() => runTest(true)}>Save sample response</button>
          </div>
          {testResult ? (
            <div className="admin-api-builder__test-result">
              {`Status: ${testResult.status} ${testResult.statusText || ""}\nDuration: ${testResult.durationMs}ms\n\n`}
              {typeof testResult.body === "object" ? JSON.stringify(testResult.body, null, 2) : testResult.bodyText || testResult.error}
            </div>
          ) : null}
        </div>
      );
    }

    if (step === 5) {
      return (
        <div>
          <p className="admin-events__hint">Map external API fields to V.O.I.C.E. NL system fields.</p>
          {(draft.fieldMappings || []).map((map, index) => (
            <div key={index} className="admin-api-builder__mapping-row">
              <select value={map.direction} onChange={(e) => updateMapping(index, { direction: e.target.value })} disabled={!canWrite}>
                <option value="request">Request</option>
                <option value="response">Response</option>
              </select>
              <input placeholder="source.path" value={map.sourcePath} onChange={(e) => updateMapping(index, { sourcePath: e.target.value })} disabled={!canWrite} />
              <input placeholder="target.path" value={map.targetPath} onChange={(e) => updateMapping(index, { targetPath: e.target.value })} disabled={!canWrite} />
              <button type="button" onClick={() => removeMapping(index)} disabled={!canWrite}><IconTrash size={14} /></button>
            </div>
          ))}
          {canWrite ? <button type="button" onClick={addMapping}><IconPlus size={14} /> Add mapping</button> : null}
        </div>
      );
    }

    const wiredTriggers = config?.wiredTriggers || ["manual_admin"];
    return (
      <div>
        <p className="admin-events__hint">Choose platform triggers and publish the integration.</p>
        <p className="admin-events__hint">
          Automatic event triggers (ticket purchases, payments, donations, etc.) are not active yet —
          only "Manual admin trigger" runs today, via the Test button below. The others are shown for
          visibility but can't be selected until they're wired up.
        </p>
        <div className="admin-api-builder__triggers admin-api-builder__full">
          {(config?.triggers || []).map((trigger) => {
            const isWired = wiredTriggers.includes(trigger);
            return (
              <label
                key={trigger}
                className="admin-api-builder__trigger"
                title={isWired ? undefined : "Not wired up yet — coming soon"}
              >
                <input
                  type="checkbox"
                  checked={(draft.triggers || []).includes(trigger)}
                  onChange={(e) => {
                    const next = new Set(draft.triggers || []);
                    if (e.target.checked) next.add(trigger);
                    else next.delete(trigger);
                    updateDraft({ triggers: [...next] });
                  }}
                  disabled={!canWrite || !isWired}
                />
                {TRIGGER_LABELS[trigger] || trigger}
                {isWired ? null : <span className="admin-api-builder__trigger-soon"> (coming soon)</span>}
              </label>
            );
          })}
        </div>
        <div className="admin-events__form-actions" style={{ marginTop: 16 }}>
          {canWrite ? <button type="button" disabled={saving} onClick={saveIntegration}>Save draft</button> : null}
          {canWrite && !isNew && draft.status !== "active" ? (
            <button type="button" disabled={saving} onClick={activate}><IconRocket size={16} /> Activate</button>
          ) : null}
          {canWrite && !isNew && draft.status === "active" ? (
            <button type="button" disabled={saving} onClick={deactivate}>Deactivate</button>
          ) : null}
          {canWrite && !isNew ? (
            <button type="button" className="admin-events__danger" onClick={deleteIntegration}>Delete</button>
          ) : null}
        </div>
      </div>
    );
  }, [step, draft, config, canWrite, canTest, canLive, credentialInputs, testing, testResult, isNew, selectedId, saving]);

  return (
    <AdminLayout pageTitle="Smart API Builder" pageSubtitle="Configure, test and manage external API integrations">
      <div className="admin-events__form-actions" style={{ marginBottom: 12 }}>
        <Link to="/admin/api-builder/logs" className="admin-events__hint"><IconList size={16} /> API Logs</Link>
        {canWrite ? <button type="button" onClick={() => startNew(null)}><IconPlus size={16} /> New integration</button> : null}
      </div>

      {loading ? <p className="admin-events__hint">Loading…</p> : null}
      {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      {!selectedId ? (
        <section className="admin-events__card">
          <h3>Start from template</h3>
          <div className="admin-api-builder__templates">
            {(config?.templates || []).map((template) => (
              <button key={template.id} type="button" className="admin-api-builder__template-btn" onClick={() => startNew(template)}>
                <strong>{template.name}</strong>
                <span>{CATEGORY_LABELS[template.category] || template.category}</span>
              </button>
            ))}
          </div>
          <p className="admin-events__hint">Select an integration from the list or start from a template.</p>
        </section>
      ) : null}

      <div className="admin-api-builder__grid">
        <aside className="admin-api-builder__list">
          {integrations.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-api-builder__list-item${selectedId === item.id ? " admin-api-builder__list-item--active" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <strong>{item.name}</strong>
              <span>{item.status} · {item.environment}</span>
            </button>
          ))}
        </aside>

        {selectedId ? (
          <div>
            <div className="admin-api-builder__steps">
              {BUILDER_STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`admin-api-builder__step${step === s.id ? " admin-api-builder__step--active" : ""}${step > s.id ? " admin-api-builder__step--done" : ""}`}
                  onClick={() => setStep(s.id)}
                >
                  {s.id}. {s.label}
                </button>
              ))}
            </div>

            <section className="admin-api-builder__panel">
              <div className="admin-events__form-actions" style={{ marginBottom: 12 }}>
                {step > 1 ? <button type="button" onClick={() => setStep((s) => s - 1)}>Back</button> : null}
                {step < 6 ? <button type="button" onClick={() => setStep((s) => s + 1)}>Next</button> : null}
                {canWrite && step < 6 ? <button type="button" disabled={saving} onClick={saveIntegration}>{saving ? "Saving…" : "Save"}</button> : null}
              </div>
              {stepContent}
            </section>
          </div>
        ) : (
          <section className="admin-api-builder__panel">
            <p className="admin-events__hint">Choose an integration or create a new one.</p>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
