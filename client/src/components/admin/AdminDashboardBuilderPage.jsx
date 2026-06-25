import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconCopy,
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconPlus,
  IconRocket,
  IconTrash,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import DashboardWidgetRenderer from "./dashboard/DashboardWidgetRenderer.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  COL_SPAN_OPTIONS,
  DATA_SOURCE_LABELS,
  hasDashboardPermission,
  REPORT_DATA_SOURCES,
  REPORT_METRICS,
  REPORT_OUTPUTS,
  widgetTypeLabel,
} from "../../utils/dashboardAdmin.js";
import "../../styles/admin-dashboard-builder.css";
import "../../styles/admin-dashboard-page.css";

const ROLE_OPTIONS = ["superadmin", "admin", "event_manager", "finance", "viewer"];

export default function AdminDashboardBuilderPage() {
  const { admin } = useAdminAuth();
  const canWrite = hasDashboardPermission(admin?.role, "dashboard.write");
  const canPublish = hasDashboardPermission(admin?.role, "dashboard.publish");

  const [state, setState] = useState(null);
  const [config, setConfig] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState("stat_card");
  const [dragId, setDragId] = useState(null);
  const [reportForm, setReportForm] = useState({ name: "", dataSource: "donations", metric: "revenue", outputFormat: "bar_chart" });

  const widgets = state?.widgets || [];
  const settings = state?.settings || {};
  const selected = useMemo(() => widgets.find((w) => w.widgetId === selectedId), [widgets, selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [builder, cfg, preview] = await Promise.all([
        apiFetch("/api/admin/dashboard/builder", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/dashboard/config", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/dashboard?version=draft", { headers: adminAuthHeaders() }),
      ]);
      setState(builder);
      setConfig(cfg);
      setPreviewData(preview.dashboard);
      setSelectedId((prev) => prev || builder.widgets?.[0]?.widgetId || null);
    } catch (err) {
      setError(err.message || "Could not load builder.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveSettings() {
    setSaving(true);
    try {
      const updated = await apiFetch("/api/admin/dashboard", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ settings: state?.settings }),
      });
      setState(updated);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveWidget(widget) {
    try {
      const updated = await apiFetch(`/api/admin/dashboard/widgets/${widget.widgetId}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(widget),
      });
      setState(updated);
      const preview = await apiFetch("/api/admin/dashboard?version=draft", { headers: adminAuthHeaders() });
      setPreviewData(preview.dashboard);
    } catch (err) {
      setError(err.message);
    }
  }

  async function publish() {
    setSaving(true);
    try {
      await saveSettings();
      await apiFetch("/api/admin/dashboard/publish", { method: "POST", headers: adminAuthHeaders() });
      setMessage("Dashboard published.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addWidget() {
    try {
      const updated = await apiFetch("/api/admin/dashboard/widgets", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ widgetType: newWidgetType, title: widgetTypeLabel(newWidgetType) }),
      });
      setState(updated);
      setShowAddWidget(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function duplicateWidget(id) {
    try {
      const updated = await apiFetch(`/api/admin/dashboard/widgets/${id}/duplicate`, { method: "POST", headers: adminAuthHeaders() });
      setState(updated);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteWidget(id) {
    if (!confirm("Delete this widget?")) return;
    try {
      const updated = await apiFetch(`/api/admin/dashboard/widgets/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      setState(updated);
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleVisibility(id) {
    const w = widgets.find((x) => x.widgetId === id);
    if (!w) return;
    await saveWidget({ ...w, isVisible: !w.isVisible });
    load();
  }

  async function reorder(widgetOrder) {
    try {
      const updated = await apiFetch("/api/admin/dashboard/widgets/reorder", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ widgetOrder }),
      });
      setState(updated);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) return;
    const ids = widgets.map((w) => w.widgetId);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    reorder(next);
    setDragId(null);
  }

  async function createReport() {
    try {
      await apiFetch("/api/admin/dashboard/reports", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(reportForm),
      });
      setShowAddReport(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function updateSelected(field, value) {
    if (!selected) return;
    const next = { ...selected, [field]: value };
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.widgetId === selectedId ? next : w)),
    }));
  }

  function updateSelectedLayout(field, value) {
    if (!selected) return;
    const next = { ...selected, layout: { ...selected.layout, [field]: value } };
    setState((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.widgetId === selectedId ? next : w)),
    }));
  }

  return (
    <AdminLayout pageTitle="Dashboard Builder" pageSubtitle="Design, reorder and configure admin dashboard widgets." hideBottomNav>
      <div className="dash-builder">
        <div className="dash-builder__topbar">
          <Link to="/admin/dashboard" className="dash-builder__back"><IconArrowLeft size={18} /> Dashboard</Link>
          {canWrite ? (
            <div className="dash-builder__actions">
              <button type="button" className="dash-builder__btn" onClick={saveSettings} disabled={saving}>
                <IconDeviceFloppy size={16} /> Save draft
              </button>
              {canPublish ? (
                <button type="button" className="dash-builder__btn dash-builder__btn--primary" onClick={publish} disabled={saving}>
                  <IconRocket size={16} /> Publish
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {message ? <p className="dash-builder__success">{message}</p> : null}
        {error ? <p className="dash-builder__error">{error}</p> : null}
        {loading ? <p className="dash-builder__status">Loading builder…</p> : null}

        <div className="dash-builder__layout">
          <aside className="dash-builder__panel">
            <div className="dash-builder__panel-head">
              <h3>Widgets</h3>
              {canWrite ? (
                <button type="button" className="dash-builder__btn dash-builder__btn--sm" onClick={() => setShowAddWidget(true)}>
                  <IconPlus size={14} /> Add
                </button>
              ) : null}
            </div>
            {showAddWidget ? (
              <div className="dash-builder__add">
                <select value={newWidgetType} onChange={(e) => setNewWidgetType(e.target.value)}>
                  {(config?.widgetTypes || []).map((t) => <option key={t} value={t}>{widgetTypeLabel(t)}</option>)}
                </select>
                <button type="button" className="dash-builder__btn dash-builder__btn--primary dash-builder__btn--sm" onClick={addWidget}>Add</button>
                <button type="button" className="dash-builder__btn dash-builder__btn--sm" onClick={() => setShowAddWidget(false)}>Cancel</button>
              </div>
            ) : null}
            <div className="dash-builder__widget-list">
              {widgets.map((w) => (
                <div
                  key={w.widgetId}
                  className={`dash-builder__widget-item${selectedId === w.widgetId ? " active" : ""}${w.isVisible === false ? " hidden" : ""}`}
                  draggable={canWrite}
                  onDragStart={() => setDragId(w.widgetId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(w.widgetId)}
                  onClick={() => setSelectedId(w.widgetId)}
                >
                  <IconGripVertical size={14} className="dash-builder__drag" />
                  <div>
                    <strong>{w.title || widgetTypeLabel(w.widgetType)}</strong>
                    <span>{widgetTypeLabel(w.widgetType)} · {w.layout?.colSpan || 3} cols</span>
                  </div>
                  {canWrite ? (
                    <div className="dash-builder__widget-actions">
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleVisibility(w.widgetId); }}>
                        {w.isVisible === false ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); duplicateWidget(w.widgetId); }}><IconCopy size={14} /></button>
                      {w.isCustom ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteWidget(w.widgetId); }}><IconTrash size={14} /></button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </aside>

          <main className="dash-builder__panel dash-builder__panel--main">
            <h3>Live preview</h3>
            {previewData ? (
              <DashboardWidgetRenderer widgets={previewData.widgets} settings={settings} preview />
            ) : null}
          </main>

          <aside className="dash-builder__panel dash-builder__panel--edit">
            <h3>Settings</h3>
            <label className="dash-builder__field">
              <span>Dashboard title</span>
              <input value={settings.title || ""} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, title: e.target.value } }))} disabled={!canWrite} />
            </label>
            <label className="dash-builder__field">
              <span>Welcome message</span>
              <input value={settings.welcomeMessage || ""} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, welcomeMessage: e.target.value } }))} disabled={!canWrite} placeholder="Welcome back {{name}} 👋" />
            </label>
            <label className="dash-builder__field">
              <span>Subtitle</span>
              <input value={settings.subtitle || ""} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, subtitle: e.target.value } }))} disabled={!canWrite} />
            </label>
            <label className="dash-builder__field">
              <span>Hero card title</span>
              <input value={settings.heroCard?.title || ""} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, heroCard: { ...p.settings?.heroCard, title: e.target.value } } }))} disabled={!canWrite} />
            </label>
            <label className="dash-builder__field">
              <span>Hero card description</span>
              <textarea value={settings.heroCard?.description || ""} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, heroCard: { ...p.settings?.heroCard, description: e.target.value } } }))} disabled={!canWrite} rows={2} />
            </label>
            <label className="dash-builder__checkbox">
              <input type="checkbox" checked={settings.announcement?.visible === true} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, announcement: { ...p.settings?.announcement, visible: e.target.checked } } }))} disabled={!canWrite} />
              Show announcement bar
            </label>
            {settings.announcement?.visible ? (
              <label className="dash-builder__field">
                <span>Announcement text</span>
                <input value={settings.announcement?.text || ""} onChange={(e) => setState((p) => ({ ...p, settings: { ...p.settings, announcement: { ...p.settings?.announcement, text: e.target.value } } }))} disabled={!canWrite} />
              </label>
            ) : null}

            {selected ? (
              <>
                <hr />
                <h3>Edit widget</h3>
                <label className="dash-builder__field">
                  <span>Title</span>
                  <input value={selected.title || ""} onChange={(e) => updateSelected("title", e.target.value)} disabled={!canWrite} />
                </label>
                <label className="dash-builder__field">
                  <span>Subtitle</span>
                  <input value={selected.subtitle || ""} onChange={(e) => updateSelected("subtitle", e.target.value)} disabled={!canWrite} />
                </label>
                <label className="dash-builder__field">
                  <span>Description</span>
                  <textarea value={selected.description || ""} onChange={(e) => updateSelected("description", e.target.value)} disabled={!canWrite} rows={2} />
                </label>
                <label className="dash-builder__field">
                  <span>Data source</span>
                  <select value={selected.dataSource || ""} onChange={(e) => updateSelected("dataSource", e.target.value)} disabled={!canWrite}>
                    {Object.entries(DATA_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="dash-builder__field">
                  <span>Data key (stat cards)</span>
                  <input value={selected.dataKey || ""} onChange={(e) => updateSelected("dataKey", e.target.value)} disabled={!canWrite} placeholder="totalUsers" />
                </label>
                <label className="dash-builder__field">
                  <span>Width (columns)</span>
                  <select value={selected.layout?.colSpan || 3} onChange={(e) => updateSelectedLayout("colSpan", Number(e.target.value))} disabled={!canWrite}>
                    {COL_SPAN_OPTIONS.map((n) => <option key={n} value={n}>{n} / 12</option>)}
                  </select>
                </label>
                <label className="dash-builder__field">
                  <span>Height (rows)</span>
                  <select value={selected.layout?.rowSpan || 1} onChange={(e) => updateSelectedLayout("rowSpan", Number(e.target.value))} disabled={!canWrite}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="dash-builder__field">
                  <span>Allowed roles (comma-separated, empty = all)</span>
                  <input
                    value={(selected.allowedRoles || []).join(", ")}
                    onChange={(e) => updateSelected("allowedRoles", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    disabled={!canWrite}
                    placeholder="superadmin, admin, finance"
                  />
                </label>
                {selected.widgetType === "custom_html" ? (
                  <label className="dash-builder__field">
                    <span>HTML content</span>
                    <textarea value={selected.content?.html || ""} onChange={(e) => updateSelected("content", { ...selected.content, html: e.target.value })} disabled={!canWrite} rows={4} />
                  </label>
                ) : null}
                {canWrite ? (
                  <button type="button" className="dash-builder__btn dash-builder__btn--primary" onClick={() => saveWidget(selected)}>
                    Save widget
                  </button>
                ) : null}
              </>
            ) : null}

            <hr />
            <div className="dash-builder__panel-head">
              <h3>Custom reports</h3>
              {canWrite ? (
                <button type="button" className="dash-builder__btn dash-builder__btn--sm" onClick={() => setShowAddReport(true)}><IconPlus size={14} /></button>
              ) : null}
            </div>
            {showAddReport ? (
              <div className="dash-builder__add">
                <input placeholder="Report name" value={reportForm.name} onChange={(e) => setReportForm((p) => ({ ...p, name: e.target.value }))} />
                <select value={reportForm.dataSource} onChange={(e) => setReportForm((p) => ({ ...p, dataSource: e.target.value }))}>
                  {REPORT_DATA_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={reportForm.metric} onChange={(e) => setReportForm((p) => ({ ...p, metric: e.target.value }))}>
                  {REPORT_METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={reportForm.outputFormat} onChange={(e) => setReportForm((p) => ({ ...p, outputFormat: e.target.value }))}>
                  {REPORT_OUTPUTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <button type="button" className="dash-builder__btn dash-builder__btn--primary dash-builder__btn--sm" onClick={createReport}>Create</button>
              </div>
            ) : null}
            <ul className="dash-builder__reports">
              {(state?.reports || []).map((r) => (
                <li key={r.reportId}>
                  <strong>{r.name}</strong>
                  <span>{r.dataSource} · {r.outputFormat}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
