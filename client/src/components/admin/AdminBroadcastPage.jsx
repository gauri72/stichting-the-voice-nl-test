import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconChevronRight,
  IconEdit,
  IconFileText,
  IconPlane,
  IconPlus,
  IconSend,
  IconTrash,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  AUDIENCE_SEGMENTS,
  QUICK_ACTIONS,
  WIZARD_STEPS,
  formatNumber,
  formatPercent,
  segmentLabel,
  statusLabel,
} from "../../data/adminBroadcastDisplay.js";
import "../../styles/admin-broadcast-page.css";

const EMPTY_FORM = {
  name: "",
  subject: "",
  description: "",
  htmlBody: "",
};

export default function AdminBroadcastPage() {
  const [overview, setOverview] = useState(null);
  const [sampleUsers, setSampleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [audienceSegment, setAudienceSegment] = useState("all_members");
  const [testEmailsText, setTestEmailsText] = useState("");
  const parsedTestEmails = useMemo(() => {
    return testEmailsText
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }, [testEmailsText]);
  const [sampleUserId, setSampleUserId] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState(EMPTY_FORM);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, usersPayload] = await Promise.all([
        apiFetch("/api/admin/broadcasts/overview", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/broadcasts/sample-users", { headers: adminAuthHeaders() }),
      ]);
      setOverview(data);
      setSampleUsers(usersPayload.users || []);
      setSelectedTemplateId((current) => current || data.templates?.[0]?.id || "");
      setSampleUserId((current) => current || usersPayload.users?.[0]?.id || "");
    } catch (loadError) {
      setError(loadError.message || "Could not load email broadcasts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const donutStyle = useMemo(() => {
    const segments = overview?.audience?.segments || [];
    if (!segments.length) return { background: "#1e293b" };

    let cursor = 0;
    const stops = segments.map((segment) => {
      const start = cursor;
      cursor += segment.percentage || 0;
      return `${segment.color} ${start}% ${cursor}%`;
    });
    return { background: `conic-gradient(${stops.join(", ")})` };
  }, [overview]);

  async function handleUploadTemplate(event) {
    event.preventDefault();
    setUploadLoading(true);
    setActionMessage("");
    try {
      await apiFetch("/api/admin/broadcasts/templates", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(uploadForm),
      });
      setUploadForm(EMPTY_FORM);
      setUploadOpen(false);
      setActionMessage("Template uploaded successfully.");
      await loadOverview();
    } catch (uploadError) {
      setActionMessage(uploadError.message || "Could not upload template.");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleTemplateFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const htmlBody = await file.text();
    const baseName = file.name.replace(/\.html?$/i, "").replace(/[-_]+/g, " ");
    setUploadForm((current) => ({
      ...current,
      name: current.name || baseName,
      htmlBody,
      subject: current.subject || `${baseName} — Stichting The V.O.I.C.E. NL`,
    }));
  }

  async function handleDeleteTemplate(templateId) {
    if (!window.confirm("Delete this email template?")) return;
    setActionMessage("");
    try {
      await apiFetch(`/api/admin/broadcasts/templates/${templateId}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      setActionMessage("Template deleted.");
      if (selectedTemplateId === templateId) setSelectedTemplateId("");
      await loadOverview();
    } catch (deleteError) {
      setActionMessage(deleteError.message || "Could not delete template.");
    }
  }

  async function loadPreview() {
    if (!selectedTemplateId) return;
    setPreviewLoading(true);
    setActionMessage("");
    try {
      const data = await apiFetch("/api/admin/broadcasts/preview", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          templateId: selectedTemplateId,
          audienceSegment,
          sampleUserId: sampleUserId || undefined,
          customEmails: audienceSegment === "test_users" ? parsedTestEmails : undefined,
        }),
      });
      setPreview(data.preview);
    } catch (previewError) {
      setActionMessage(previewError.message || "Could not generate preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    if (wizardOpen && wizardStep === 2 && selectedTemplateId) {
      loadPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardOpen, wizardStep, selectedTemplateId, audienceSegment, sampleUserId]);

  async function handleSendBroadcast() {
    if (!selectedTemplateId) return;
    const confirmed = window.confirm(
      `Send this broadcast to ${formatNumber(preview?.recipientCount || 0)} recipients?`
    );
    if (!confirmed) return;

    setSendLoading(true);
    setActionMessage("");
    try {
      const data = await apiFetch("/api/admin/broadcasts/send", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          templateId: selectedTemplateId,
          audienceSegment,
          customEmails: audienceSegment === "test_users" ? parsedTestEmails : undefined,
        }),
      });
      setActionMessage(
        `Broadcast ${data.broadcast.status}: ${formatNumber(data.broadcast.sentCount)} sent, ${formatNumber(data.broadcast.failedCount)} failed.`
      );
      setWizardOpen(false);
      setWizardStep(0);
      await loadOverview();
    } catch (sendError) {
      setActionMessage(sendError.message || "Broadcast could not be sent.");
    } finally {
      setSendLoading(false);
    }
  }

  function openWizard(step = 0) {
    setWizardStep(step);
    setWizardOpen(true);
  }

  function handleQuickAction(key) {
    if (key === "new") openWizard(0);
    if (key === "templates") setUploadOpen(true);
    if (key === "audience") openWizard(1);
    if (key === "reports") {
      document.getElementById("admin-recent-campaigns")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const stats = overview?.stats || {};
  const templates = overview?.templates || [];
  const campaigns = overview?.recentCampaigns || [];

  return (
    <AdminLayout
      pageTitle="Email Broadcasts"
      pageSubtitle="Reach your audience. Share your message."
    >
      <div className="admin-broadcast">
        <div className="admin-broadcast__hero-actions">
          <button type="button" className="admin-broadcast__primary-btn" onClick={() => openWizard(0)}>
            <IconPlus size={18} stroke={2} aria-hidden />
            New Broadcast
          </button>
        </div>

        {loading ? <p className="admin-broadcast__status">Loading broadcasts…</p> : null}
        {error ? (
          <p className="admin-broadcast__error" role="alert">
            {error}
          </p>
        ) : null}
        {actionMessage ? <p className="admin-broadcast__message">{actionMessage}</p> : null}

        {overview ? (
          <>
            <section className="admin-broadcast__kpis" aria-label="Broadcast statistics">
              <article className="admin-broadcast__kpi">
                <p className="admin-broadcast__kpi-label">Emails Sent</p>
                <p className="admin-broadcast__kpi-value">{formatNumber(stats.emailsSent)}</p>
                {stats.emailsSent > 0 ? <span className="admin-broadcast__trend">+12.5%</span> : null}
              </article>
              <article className="admin-broadcast__kpi">
                <p className="admin-broadcast__kpi-label">Open Rate</p>
                <p className="admin-broadcast__kpi-value">{formatPercent(stats.openRate)}</p>
                {stats.emailsSent > 0 ? <span className="admin-broadcast__trend">+8.2%</span> : null}
              </article>
              <article className="admin-broadcast__kpi">
                <p className="admin-broadcast__kpi-label">Click Rate</p>
                <p className="admin-broadcast__kpi-value">{formatPercent(stats.clickRate)}</p>
                {stats.emailsSent > 0 ? <span className="admin-broadcast__trend">+3.1%</span> : null}
              </article>
              <article className="admin-broadcast__kpi">
                <p className="admin-broadcast__kpi-label">Recipients</p>
                <p className="admin-broadcast__kpi-value">{formatNumber(stats.recipients)}</p>
                <span className="admin-broadcast__kpi-caption">Total Audience</span>
              </article>
            </section>

            <section className="admin-broadcast__wizard-card" aria-label="Create new broadcast">
              <h2>Create New Broadcast</h2>
              <ol className="admin-broadcast__steps">
                {WIZARD_STEPS.map((step, index) => (
                  <li key={step.key}>
                    <button type="button" onClick={() => openWizard(index)}>
                      <span className="admin-broadcast__step-icon" aria-hidden="true">
                        {index === 0 ? <IconEdit size={18} /> : null}
                        {index === 1 ? <IconUsers size={18} /> : null}
                        {index === 2 ? <IconSend size={18} /> : null}
                      </span>
                      <span>
                        <strong>{step.label}</strong>
                        <small>{step.hint}</small>
                      </span>
                      <IconChevronRight size={18} aria-hidden />
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            <section className="admin-broadcast__templates" aria-label="Email templates">
              <div className="admin-broadcast__section-head">
                <h2>Email Templates</h2>
                <button type="button" className="admin-broadcast__ghost-btn" onClick={() => setUploadOpen(true)}>
                  <IconUpload size={16} aria-hidden />
                  Upload Template
                </button>
              </div>
              <div className="admin-broadcast__template-grid">
                {templates.map((template) => (
                  <article key={template.id} className="admin-broadcast__template-card">
                    <div className="admin-broadcast__template-thumb">
                      <IconFileText size={28} stroke={1.5} aria-hidden />
                    </div>
                    <div>
                      <h3>{template.name}</h3>
                      <p>{template.description || template.subject}</p>
                      <p className="admin-broadcast__template-meta">
                        {template.placeholders?.length || 0} placeholders
                      </p>
                    </div>
                    <div className="admin-broadcast__template-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          openWizard(2);
                        }}
                      >
                        Preview
                      </button>
                      {!template.isSystem ? (
                        <button type="button" className="danger" onClick={() => handleDeleteTemplate(template.id)}>
                          <IconTrash size={16} aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="admin-recent-campaigns" className="admin-broadcast__campaigns" aria-label="Recent campaigns">
              <h2>Recent Campaigns</h2>
              {campaigns.length === 0 ? (
                <p className="admin-broadcast__status">No campaigns sent yet.</p>
              ) : (
                <ul className="admin-broadcast__campaign-list">
                  {campaigns.map((campaign) => (
                    <li key={campaign.id}>
                      <div className="admin-broadcast__campaign-thumb" aria-hidden="true">
                        <IconMailGlyph />
                      </div>
                      <div className="admin-broadcast__campaign-copy">
                        <div className="admin-broadcast__campaign-top">
                          <h3>{campaign.templateName}</h3>
                          <span className={`admin-broadcast__badge admin-broadcast__badge--${campaign.status}`}>
                            {statusLabel(campaign.status)}
                          </span>
                        </div>
                        <p>
                          {new Date(campaign.sentAt).toLocaleDateString()} · {formatNumber(campaign.recipientCount)} recipients ·{" "}
                          {segmentLabel(campaign.audienceSegment)}
                        </p>
                        <p>Open Rate: {formatPercent(campaign.openRate)}</p>
                      </div>
                      <IconChevronRight size={18} aria-hidden />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin-broadcast__audience" aria-label="Audience overview">
              <h2>Audience Overview</h2>
              <div className="admin-broadcast__audience-grid">
                <div className="admin-broadcast__donut-wrap">
                  <div className="admin-broadcast__donut" style={donutStyle}>
                    <div className="admin-broadcast__donut-hole">
                      <strong>{formatNumber(overview.audience.total)}</strong>
                      <span>Subscribers</span>
                    </div>
                  </div>
                </div>
                <ul className="admin-broadcast__segment-list">
                  {overview.audience.segments.map((segment) => (
                    <li key={segment.key}>
                      <span className="admin-broadcast__segment-dot" style={{ background: segment.color }} />
                      <span>{segment.label}</span>
                      <strong>{formatNumber(segment.count)}</strong>
                      <em>{formatPercent(segment.percentage)}</em>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="admin-broadcast__quick-actions" aria-label="Quick actions">
              <h2>Quick Actions</h2>
              <div className="admin-broadcast__quick-grid">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.key} type="button" onClick={() => handleQuickAction(action.key)}>
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>

      {uploadOpen ? (
        <div className="admin-broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="upload-template-title">
          <div className="admin-broadcast-modal__panel">
            <div className="admin-broadcast-modal__head">
              <h2 id="upload-template-title">Upload Email Template</h2>
              <button type="button" onClick={() => setUploadOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <form className="admin-broadcast-modal__body" onSubmit={handleUploadTemplate}>
              <label>
                Template name
                <input
                  value={uploadForm.name}
                  onChange={(event) => setUploadForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email subject
                <input
                  value={uploadForm.subject}
                  onChange={(event) => setUploadForm((current) => ({ ...current, subject: event.target.value }))}
                  required
                />
              </label>
              <label>
                Description
                <input
                  value={uploadForm.description}
                  onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label>
                HTML file
                <input type="file" accept=".html,.htm,text/html" onChange={handleTemplateFileChange} required={!uploadForm.htmlBody} />
              </label>
              <label>
                Or paste HTML
                <textarea
                  rows={8}
                  value={uploadForm.htmlBody}
                  onChange={(event) => setUploadForm((current) => ({ ...current, htmlBody: event.target.value }))}
                  placeholder="Use placeholders like {{first_name}} and {{discount_code}}"
                  required
                />
              </label>
              <div className="admin-broadcast-modal__actions">
                <button type="button" className="admin-broadcast__ghost-btn" onClick={() => setUploadOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-broadcast__primary-btn" disabled={uploadLoading}>
                  {uploadLoading ? "Uploading…" : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {wizardOpen ? (
        <div className="admin-broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="broadcast-wizard-title">
          <div className="admin-broadcast-modal__panel admin-broadcast-modal__panel--wide">
            <div className="admin-broadcast-modal__head">
              <h2 id="broadcast-wizard-title">{WIZARD_STEPS[wizardStep].label}</h2>
              <button type="button" onClick={() => setWizardOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="admin-broadcast-modal__steps">
              {WIZARD_STEPS.map((step, index) => (
                <span key={step.key} className={index === wizardStep ? "active" : index < wizardStep ? "done" : ""}>
                  {index + 1}. {step.label}
                </span>
              ))}
            </div>

            <div className="admin-broadcast-modal__body">
              {wizardStep === 0 ? (
                <>
                  <p>Select a template or upload a new one. Templates support merge tags like <code>{`{{first_name}}`}</code>.</p>
                  <div className="admin-broadcast__template-picker">
                    {templates.map((template) => (
                      <label key={template.id} className={selectedTemplateId === template.id ? "selected" : ""}>
                        <input
                          type="radio"
                          name="template"
                          checked={selectedTemplateId === template.id}
                          onChange={() => setSelectedTemplateId(template.id)}
                        />
                        <span>
                          <strong>{template.name}</strong>
                          <small>{template.subject}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="admin-broadcast__ghost-btn" onClick={() => setUploadOpen(true)}>
                    <IconUpload size={16} aria-hidden />
                    Upload another template
                  </button>
                </>
              ) : null}

              {wizardStep === 1 ? (
                <>
                  <p>Choose the audience from cluster17. Recipients are deduplicated by email.</p>
                  <div className="admin-broadcast__audience-picker">
                    {AUDIENCE_SEGMENTS.map((segment) => (
                      <label key={segment.key} className={audienceSegment === segment.key ? "selected" : ""}>
                        <input
                          type="radio"
                          name="audience"
                          checked={audienceSegment === segment.key}
                          onChange={() => setAudienceSegment(segment.key)}
                        />
                        <span>
                          <strong>{segment.label}</strong>
                          <small>{segment.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {audienceSegment === "test_users" ? (
                    <div style={{ marginTop: "16px", display: "grid", gap: "8px" }}>
                      <label style={{ display: "grid", gap: "6px", fontSize: "0.86rem", fontWeight: 600 }}>
                        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          Test Email Addresses (comma or newline separated)
                          <span className="admin-broadcast__badge admin-broadcast__badge--sent" style={{ marginLeft: "auto", fontSize: "0.72rem" }}>
                            {parsedTestEmails.length} unique emails parsed
                          </span>
                        </span>
                        <textarea
                          rows={4}
                          value={testEmailsText}
                          onChange={(event) => setTestEmailsText(event.target.value)}
                          placeholder="test1@example.com, test2@example.com, test3@example.com"
                          style={{
                            width: "100%",
                            border: "1px solid var(--ad-border)",
                            borderRadius: "12px",
                            background: "var(--ad-bg)",
                            color: "var(--ad-text)",
                            padding: "10px 12px",
                            font: "inherit",
                          }}
                        />
                      </label>
                    </div>
                  ) : null}
                </>
              ) : null}

              {wizardStep === 2 ? (
                <>
                  <div className="admin-broadcast__preview-controls">
                    <label>
                      Preview as user
                      <select value={sampleUserId} onChange={(event) => setSampleUserId(event.target.value)}>
                        {sampleUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} · {user.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="admin-broadcast__ghost-btn" onClick={loadPreview} disabled={previewLoading}>
                      Refresh preview
                    </button>
                  </div>

                  {previewLoading ? <p className="admin-broadcast__status">Generating preview…</p> : null}

                  {preview ? (
                    <>
                      <div className="admin-broadcast__preview-meta">
                        <p>
                          <strong>Subject:</strong> {preview.subject}
                        </p>
                        <p>
                          <strong>Sample recipient:</strong> {preview.sampleRecipient.firstName} {preview.sampleRecipient.lastName} (
                          {preview.sampleRecipient.email})
                        </p>
                        <p>
                          <strong>Broadcast reach:</strong> {formatNumber(preview.recipientCount)} users
                        </p>
                      </div>
                      <div className="admin-broadcast__preview-frame-wrap">
                        <iframe
                          title="Email preview"
                          className="admin-broadcast__preview-frame"
                          srcDoc={preview.html}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="admin-broadcast-modal__actions">
              <button
                type="button"
                className="admin-broadcast__ghost-btn"
                disabled={wizardStep === 0}
                onClick={() => setWizardStep((step) => Math.max(0, step - 1))}
              >
                Back
              </button>
              {wizardStep < 2 ? (
                <button
                  type="button"
                  className="admin-broadcast__primary-btn"
                  disabled={
                    (wizardStep === 0 && !selectedTemplateId) ||
                    (wizardStep === 1 && audienceSegment === "test_users" && parsedTestEmails.length === 0)
                  }
                  onClick={() => setWizardStep((step) => Math.min(2, step + 1))}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-broadcast__primary-btn"
                  disabled={sendLoading || !preview}
                  onClick={handleSendBroadcast}
                >
                  <IconPlane size={16} aria-hidden />
                  {sendLoading ? "Sending…" : "Send Broadcast"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function IconMailGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
