import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { hasPermission } from "../../utils/rbacAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

const TIER_LABELS = {
  student: "Student",
  privilegedSingle: "Privileged (Single)",
  privilegedFamily: "Privileged (Family)",
  premiumSingle: "Premium (Single)",
  premiumFamily: "Premium (Family)",
  single: "Single",
  family: "Family",
  privileged: "Privileged",
  vownl: "V.O.I.C.E. NL",
  none: "No membership",
};

export default function AdminAiAssistantPage() {
  const { admin } = useAdminAuth();
  const canEdit = hasPermission(admin?.permissions, "personal_ai.edit");

  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [usage, setUsage] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("general");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, settingsData, usageData, logsData] = await Promise.all([
        apiFetch("/api/admin/personal-ai/dashboard", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/personal-ai/settings", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/personal-ai/usage", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/personal-ai/run-logs", { headers: adminAuthHeaders() }),
      ]);
      setStats(statsData.stats);
      setSettings(settingsData.settings);
      setUsage(usageData.usage || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      setError(err.message || "Could not load AI assistant settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleToggleEnabled() {
    if (!canEdit) return;
    try {
      const data = await apiFetch("/api/admin/personal-ai/settings", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ enabled: !settings.enabled }),
      });
      setSettings(data.settings);
    } catch (err) {
      setError(err.message || "Could not update settings.");
    }
  }

  async function handleTierLimitChange(tier, value) {
    if (!canEdit) return;
    try {
      const data = await apiFetch("/api/admin/personal-ai/settings", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ tierLimits: { [tier]: Number(value) } }),
      });
      setSettings(data.settings);
    } catch (err) {
      setError(err.message || "Could not update tier limit.");
    }
  }

  async function handleAddPrebuiltPrompt(e) {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    try {
      const data = await apiFetch("/api/admin/personal-ai/settings/prebuilt-prompts", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ text: newPromptText.trim(), category: newPromptCategory }),
      });
      setSettings(data.settings);
      setNewPromptText("");
    } catch (err) {
      setError(err.message || "Could not add prompt.");
    }
  }

  async function handleDeletePrebuiltPrompt(promptId) {
    try {
      const data = await apiFetch(`/api/admin/personal-ai/settings/prebuilt-prompts/${promptId}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      setSettings(data.settings);
    } catch (err) {
      setError(err.message || "Could not delete prompt.");
    }
  }

  async function handleOverrideChange(customerId, field, value) {
    try {
      await apiFetch(`/api/admin/personal-ai/customers/${customerId}/override`, {
        method: "PUT",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ [field]: value }),
      });
      setMessage("Override saved.");
      setTimeout(() => setMessage(""), 2000);
      loadAll();
    } catch (err) {
      setError(err.message || "Could not save override.");
    }
  }

  if (loading) return <AdminLayout pageTitle="Personal AI Assistant"><p className="admin-finance__status">Loading…</p></AdminLayout>;

  return (
    <AdminLayout pageTitle="Personal AI Assistant" pageSubtitle="Usage, limits, and the shared prompt library for the customer-facing assistant.">
      <div className="admin-finance">
        {error ? <p className="admin-finance__error" role="alert">{error}</p> : null}
        {message ? <p className="admin-finance__status">{message}</p> : null}

        {stats ? (
          <div className="admin-finance__stats">
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">{stats.activeCustomers}</p><p className="admin-finance__stat-label">Active Customers (this month)</p></article>
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">{stats.totalSchedules}</p><p className="admin-finance__stat-label">Active Scheduled Prompts</p></article>
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">{stats.enabled ? "Enabled" : "Disabled"}</p><p className="admin-finance__stat-label">Global Status</p></article>
          </div>
        ) : null}

        <section className="admin-finance__section">
          <h2>Global Settings</h2>
          {settings ? (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={settings.enabled} onChange={handleToggleEnabled} disabled={!canEdit} />
                Enable the AI Assistant for all customers
              </label>

              <h3 style={{ marginTop: 20 }}>Daily Prompt Limits by Membership Tier</h3>
              <div className="admin-finance__field-row" style={{ flexWrap: "wrap" }}>
                {Object.entries(settings.tierLimits).map(([tier, limit]) => (
                  <div className="admin-finance__field" key={tier} style={{ minWidth: 180 }}>
                    <label>{TIER_LABELS[tier] || tier}</label>
                    <input
                      type="number"
                      defaultValue={limit}
                      onBlur={(e) => handleTierLimitChange(tier, e.target.value)}
                      disabled={!canEdit}
                    />
                    <span className="admin-finance__field-hint">-1 = unlimited</span>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: 20 }}>Pre-built Prompt Library</h3>
              {canEdit ? (
                <form onSubmit={handleAddPrebuiltPrompt} className="admin-finance__line-row" style={{ gridTemplateColumns: "2fr 1fr auto" }}>
                  <input placeholder="Prompt text" value={newPromptText} onChange={(e) => setNewPromptText(e.target.value)} />
                  <input placeholder="Category" value={newPromptCategory} onChange={(e) => setNewPromptCategory(e.target.value)} />
                  <button type="submit" className="admin-finance__btn admin-finance__btn--primary"><IconPlus size={16} /> Add</button>
                </form>
              ) : null}
              <ul style={{ marginTop: 12 }}>
                {settings.prebuiltPrompts.map((p) => (
                  <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                    <span>{p.text} <span className="admin-finance__field-hint">({p.category})</span></span>
                    {canEdit ? (
                      <button type="button" className="admin-finance__icon-btn" onClick={() => handleDeletePrebuiltPrompt(p.id)}>
                        <IconTrash size={14} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className="admin-finance__section">
          <h2>Customer Usage (this month)</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead>
                <tr><th>Customer</th><th>Email</th><th>Prompts Used</th><th>Override Enabled</th><th>Override Limit</th></tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.customerId}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.monthCount}</td>
                    <td>
                      <select
                        defaultValue={u.enabledOverride === null ? "" : String(u.enabledOverride)}
                        onChange={(e) => handleOverrideChange(u.customerId, "enabledOverride", e.target.value === "" ? null : e.target.value === "true")}
                        disabled={!canEdit}
                      >
                        <option value="">Inherit global</option>
                        <option value="true">Force enabled</option>
                        <option value="false">Force disabled</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        defaultValue={u.dailyLimitOverride ?? ""}
                        placeholder="Inherit tier"
                        onBlur={(e) => handleOverrideChange(u.customerId, "dailyLimitOverride", e.target.value === "" ? null : Number(e.target.value))}
                        disabled={!canEdit}
                        style={{ width: 90 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-finance__section">
          <h2>Scheduled Prompt Run Log</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead>
                <tr><th>Customer</th><th>Prompt</th><th>Result Preview</th><th>Delivery</th><th>Status</th><th>When</th></tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.customerName}</td>
                    <td>{l.promptText}</td>
                    <td>{l.resultPreview}</td>
                    <td>{l.deliveryMethod}</td>
                    <td><span className={l.deliveryStatus === "delivered" ? "admin-finance__badge admin-finance__badge--paid" : "admin-finance__badge admin-finance__badge--overdue"}>{l.deliveryStatus}</span></td>
                    <td>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
