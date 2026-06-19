import { useCallback, useEffect, useState } from "react";
import { IconPlus, IconDownload, IconEye, IconX } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { formatDate, downloadBlob, hasFinancePermission } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

const REPORT_TYPES = [
  { value: "event_audit", label: "Event Audit Report" },
  { value: "monthly_finance", label: "Monthly Finance Report" },
  { value: "annual_finance", label: "Annual Finance Report" },
  { value: "sponsorship_audit", label: "Sponsorship Audit Report" },
  { value: "donation_audit", label: "Donation Audit Report" },
  { value: "membership_audit", label: "Membership Audit Report" },
  { value: "ticketing_audit", label: "Ticketing Audit Report" },
  { value: "full_platform_audit", label: "Full Platform Audit Report" },
];

const MODULE_OPTIONS = [
  "ticket_sales", "tickettailor_data", "membership_revenue", "sponsorship_revenue",
  "donation_revenue", "expenses", "invoices", "receipts", "refunds", "admin_changes", "qr_checkins",
];

const EMPTY_GEN = {
  reportType: "monthly_finance",
  title: "",
  dateRangeStart: "",
  dateRangeEnd: "",
  eventId: "",
  modulesIncluded: ["ticket_sales", "sponsorship_revenue", "donation_revenue", "expenses", "invoices"],
  includeAttachments: false,
  includeAuditLogs: true,
  includePaymentStatus: true,
  includeVarianceAnalysis: true,
  includeSummaryCharts: false,
};

export default function AdminFinanceAuditReportsPage() {
  const { admin } = useAdminAuth();
  const canGenerate = hasFinancePermission(admin?.role, "reports.generate");

  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_GEN);
  const [submitting, setSubmitting] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listData, eventsData] = await Promise.all([
        apiFetch("/api/admin/finance/audit-reports", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/events?limit=100", { headers: adminAuthHeaders() }).catch(() => ({ events: [] })),
      ]);
      setReports(listData.reports || []);
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/admin/finance/audit-reports/generate", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ ...form, eventId: form.eventId || null }),
      });
      setGeneratorOpen(false);
      load();
    } catch (err) {
      setError(err.message || "Could not generate report.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleModule(mod) {
    setForm((f) => ({
      ...f,
      modulesIncluded: f.modulesIncluded.includes(mod)
        ? f.modulesIncluded.filter((m) => m !== mod)
        : [...f.modulesIncluded, mod],
    }));
  }

  return (
    <AdminLayout pageTitle="Audit Reports" pageSubtitle="Generate transparent audit-ready reports for governance and financial review.">
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          {canGenerate ? <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={() => setGeneratorOpen(true)}><IconPlus size={16} /> Generate Audit Report</button> : null}
        </div>

        {error ? <p className="admin-finance__error">{error}</p> : null}
        {loading ? <p className="admin-finance__status">Loading…</p> : null}

        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr><th>Report ID</th><th>Title</th><th>Type</th><th>Period</th><th>Generated</th><th>By</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.reportId}</td>
                  <td>{r.title}</td>
                  <td>{r.reportType}</td>
                  <td>{formatDate(r.dateRangeStart)} – {formatDate(r.dateRangeEnd)}</td>
                  <td>{formatDate(r.generatedAt)}</td>
                  <td>{r.generatedByName || "—"}</td>
                  <td>
                    <div className="admin-finance__actions">
                      <button type="button" className="admin-finance__icon-btn" onClick={async () => { const d = await apiFetch(`/api/admin/finance/audit-reports/${r.id}`, { headers: adminAuthHeaders() }); setViewReport(d.report); }}><IconEye size={16} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => downloadBlob(`/api/admin/finance/audit-reports/${r.id}/download-pdf`, `audit-${r.reportId}.pdf`)}><IconDownload size={16} /></button>
                      <button type="button" className="admin-finance__icon-btn" onClick={() => downloadBlob(`/api/admin/finance/audit-reports/${r.id}/download-excel`, `audit-${r.reportId}.xlsx`)}><IconDownload size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {generatorOpen ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setGeneratorOpen(false)} aria-hidden />
          <aside className="admin-finance__drawer admin-finance__drawer--wide">
            <div className="admin-finance__drawer-head">
              <h2>Generate Audit Report</h2>
              <button type="button" className="admin-finance__icon-btn" onClick={() => setGeneratorOpen(false)}><IconX size={18} /></button>
            </div>
            <form className="admin-finance__form-grid" onSubmit={handleGenerate}>
              <label>Report Type<select value={form.reportType} onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}>{REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
              <label>Title<input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Optional custom title" /></label>
              <label>From<input type="date" value={form.dateRangeStart} onChange={(e) => setForm((f) => ({ ...f, dateRangeStart: e.target.value }))} /></label>
              <label>To<input type="date" value={form.dateRangeEnd} onChange={(e) => setForm((f) => ({ ...f, dateRangeEnd: e.target.value }))} /></label>
              <label>Event<select value={form.eventId} onChange={(e) => setForm((f) => ({ ...f, eventId: e.target.value }))}><option value="">All events</option>{events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>)}</select></label>
              <div className="admin-finance__full">
                <p>Modules to include</p>
                <div className="admin-finance__checkbox-grid">
                  {MODULE_OPTIONS.map((mod) => (
                    <label key={mod}><input type="checkbox" checked={form.modulesIncluded.includes(mod)} onChange={() => toggleModule(mod)} /> {mod.replace(/_/g, " ")}</label>
                  ))}
                </div>
              </div>
              <label><input type="checkbox" checked={form.includeAttachments} onChange={(e) => setForm((f) => ({ ...f, includeAttachments: e.target.checked }))} /> Include Attachments</label>
              <label><input type="checkbox" checked={form.includeAuditLogs} onChange={(e) => setForm((f) => ({ ...f, includeAuditLogs: e.target.checked }))} /> Include Audit Logs</label>
              <label><input type="checkbox" checked={form.includePaymentStatus} onChange={(e) => setForm((f) => ({ ...f, includePaymentStatus: e.target.checked }))} /> Include Payment Status</label>
              <label><input type="checkbox" checked={form.includeVarianceAnalysis} onChange={(e) => setForm((f) => ({ ...f, includeVarianceAnalysis: e.target.checked }))} /> Include Variance Analysis</label>
              <button type="submit" className="admin-finance__btn admin-finance__btn--primary admin-finance__full" disabled={submitting}>{submitting ? "Generating…" : "Generate Report"}</button>
            </form>
          </aside>
        </>
      ) : null}

      {viewReport ? (
        <>
          <div className="admin-finance__overlay" onClick={() => setViewReport(null)} aria-hidden />
          <aside className="admin-finance__drawer admin-finance__drawer--wide">
            <div className="admin-finance__drawer-head"><h2>{viewReport.title}</h2><button type="button" className="admin-finance__icon-btn" onClick={() => setViewReport(null)}><IconX size={18} /></button></div>
            <pre className="admin-finance__json-preview">{JSON.stringify(viewReport.summary, null, 2)}</pre>
          </aside>
        </>
      ) : null}
    </AdminLayout>
  );
}
