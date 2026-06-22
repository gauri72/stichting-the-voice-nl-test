import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDownload, IconDeviceFloppy, IconPlayerPlay } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  DATA_SOURCES,
  CHART_TYPES,
  GROUP_BY_OPTIONS,
  DATE_PRESETS,
  exportReport,
  canViewReportSection,
} from "../../utils/reportsAdmin.js";
import {
  ReportBarChart,
  ReportLineChart,
  ReportPieChart,
  ReportDataTable,
} from "./reports/ReportCharts.jsx";
import "../../styles/admin-reports-page.css";

const STEPS = ["Data Source", "Date Range", "Options", "Preview"];

export default function AdminCustomReportsPage() {
  const { admin } = useAdminAuth();
  const role = admin?.role || "admin";

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataSource, setDataSource] = useState("tickets");
  const [preset, setPreset] = useState("last30");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chartType, setChartType] = useState("table");
  const [groupBy, setGroupBy] = useState("");
  const [preview, setPreview] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scheduleFreq, setScheduleFreq] = useState("weekly");
  const [scheduleEmail, setScheduleEmail] = useState(admin?.email || "");
  const [scheduleFormat, setScheduleFormat] = useState("pdf");

  const loadTemplates = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/reports/custom/templates", { headers: adminAuthHeaders() });
      setTemplates(data.templates || []);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    if (!canViewReportSection(role, "custom")) return;
    loadTemplates();
  }, [loadTemplates, role]);

  if (!canViewReportSection(role, "custom")) {
    return (
      <AdminLayout pageTitle="Custom Reports" pageSubtitle="Access denied.">
        <p className="admin-reports__error">You do not have permission to build custom reports.</p>
      </AdminLayout>
    );
  }

  async function runPreview() {
    setLoading(true);
    setError("");
    console.log("[CUSTOM_REPORT_PREVIEW_STARTED]", dataSource);
    try {
      const result = await apiFetch("/api/admin/reports/custom/preview", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ dataSource, preset, dateFrom, dateTo, chartType, groupBy }),
      });
      setPreview(result);
      setStep(3);
      console.log("[CUSTOM_REPORT_GENERATED]", { rows: result.total });
    } catch (err) {
      setError(err.message || "Preview failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate() {
    try {
      await apiFetch("/api/admin/reports/custom/save", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ name, description, dataSource, chartType, groupBy, filters: {} }),
      });
      loadTemplates();
      window.alert("Report template saved.");
    } catch (err) {
      setError(err.message || "Could not save template.");
    }
  }

  async function scheduleReport(templateId) {
    if (!templateId) {
      setError("Save the report template first, then schedule it.");
      return;
    }
    try {
      await apiFetch("/api/admin/reports/scheduled", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          reportId: templateId,
          frequency: scheduleFreq,
          recipients: scheduleEmail ? [scheduleEmail] : [],
          format: scheduleFormat,
        }),
      });
      window.alert("Report scheduled successfully.");
    } catch (err) {
      setError(err.message || "Could not schedule report.");
    }
  }

  function renderPreviewChart() {
    if (!preview) return null;
    if (chartType === "bar") return <ReportBarChart data={preview.chartData} />;
    if (chartType === "line") return <ReportLineChart data={preview.chartData} nameKey="name" />;
    if (chartType === "pie") return <ReportPieChart data={preview.chartData} />;
    return (
      <ReportDataTable
        columns={(preview.columns || []).map((c) => ({ key: c, label: c }))}
        rows={preview.rows}
      />
    );
  }

  return (
    <AdminLayout pageTitle="Custom Report Builder" pageSubtitle="Build, preview, save and schedule custom reports.">
      <div className="admin-reports admin-reports-custom">
        <Link to="/admin/reports" className="admin-reports__btn" style={{ marginBottom: 16 }}>
          <IconArrowLeft size={16} /> Back to Reports
        </Link>

        <div className="admin-reports-custom__steps">
          {STEPS.map((label, i) => (
            <span key={label} className={`admin-reports-custom__step${step === i ? " admin-reports-custom__step--active" : ""}`}>
              {i + 1}. {label}
            </span>
          ))}
        </div>

        {error ? <p className="admin-reports__error">{error}</p> : null}

        <div className="admin-reports-custom__form">
          {step === 0 ? (
            <>
              <div className="admin-reports-custom__field">
                <label>Report Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly ticket sales" />
              </div>
              <div className="admin-reports-custom__field">
                <label>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="admin-reports-custom__field">
                <label>Data Source</label>
                <select value={dataSource} onChange={(e) => setDataSource(e.target.value)}>
                  {DATA_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="admin-reports-custom__field">
                <label>Date Range</label>
                <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                  {DATE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              {preset === "custom" ? (
                <div className="admin-reports-custom__field">
                  <label>Custom Dates</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ marginTop: 8 }} />
                </div>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="admin-reports-custom__field">
                <label>Chart Type</label>
                <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                  {CHART_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-reports-custom__field">
                <label>Group By</label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  {GROUP_BY_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="admin-reports__section">
              <h3 className="admin-reports__section-title">Preview ({preview?.total || 0} rows)</h3>
              {renderPreviewChart()}
            </div>
          ) : null}
        </div>

        <div className="admin-reports-custom__actions">
          {step > 0 ? (
            <button type="button" className="admin-reports__btn" onClick={() => setStep((s) => s - 1)}>Back</button>
          ) : null}
          {step < 2 ? (
            <button type="button" className="admin-reports__btn admin-reports__btn--primary" onClick={() => setStep((s) => s + 1)}>Next</button>
          ) : null}
          {step === 2 ? (
            <button type="button" className="admin-reports__btn admin-reports__btn--primary" onClick={runPreview} disabled={loading}>
              <IconPlayerPlay size={16} /> {loading ? "Generating…" : "Preview Report"}
            </button>
          ) : null}
          {step === 3 ? (
            <>
              <button type="button" className="admin-reports__btn" onClick={saveTemplate}>
                <IconDeviceFloppy size={16} /> Save Template
              </button>
              <button type="button" className="admin-reports__btn" onClick={() => exportReport("csv", { reportType: "custom", dataSource, preset, dateFrom, dateTo, chartType, groupBy })}>
                <IconDownload size={16} /> Export CSV
              </button>
              <button type="button" className="admin-reports__btn" onClick={() => exportReport("excel", { reportType: "custom", dataSource, preset, dateFrom, dateTo, title: name || "Custom Report" })}>
                <IconDownload size={16} /> Export Excel
              </button>
              <button type="button" className="admin-reports__btn" onClick={() => exportReport("pdf", { reportType: "custom", dataSource, preset, dateFrom, dateTo, title: name || "Custom Report" })}>
                <IconDownload size={16} /> Export PDF
              </button>
            </>
          ) : null}
        </div>

        <section id="schedule" className="admin-reports__section" style={{ marginTop: 32 }}>
          <h3 className="admin-reports__section-title">Schedule Report</h3>
          <div className="admin-reports-custom__form">
            <div className="admin-reports-custom__field">
              <label>Frequency</label>
              <select value={scheduleFreq} onChange={(e) => setScheduleFreq(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="admin-reports-custom__field">
              <label>Email Recipients</label>
              <input type="email" value={scheduleEmail} onChange={(e) => setScheduleEmail(e.target.value)} />
            </div>
            <div className="admin-reports-custom__field">
              <label>Format</label>
              <select value={scheduleFormat} onChange={(e) => setScheduleFormat(e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <button
              type="button"
              className="admin-reports__btn admin-reports__btn--primary"
              onClick={() => scheduleReport(templates[0]?.id)}
              disabled={!templates.length}
            >
              Schedule Saved Template
            </button>
          </div>
        </section>

        {templates.length ? (
          <section className="admin-reports__section">
            <h3 className="admin-reports__section-title">Saved Templates</h3>
            <ReportDataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "dataSource", label: "Source" },
                { key: "chartType", label: "Chart" },
                { key: "createdAt", label: "Created" },
              ]}
              rows={templates.map((t) => ({
                ...t,
                createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("nl-NL") : "—",
              }))}
            />
          </section>
        ) : null}
      </div>
    </AdminLayout>
  );
}
