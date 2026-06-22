import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconRefresh,
  IconDownload,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconChartBar,
  IconCalendar,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import {
  REPORT_TABS,
  DATE_PRESETS,
  buildDateParams,
  canViewReportSection,
  canExportReports,
  exportReport,
  trendClass,
  formatChange,
} from "../../utils/reportsAdmin.js";
import {
  ReportBarChart,
  ReportLineChart,
  ReportPieChart,
  ReportSparkline,
  ReportDataTable,
} from "./reports/ReportCharts.jsx";
import "../../styles/admin-reports-page.css";

const TAB_ENDPOINTS = {
  overview: "/api/admin/reports/overview",
  revenue: "/api/admin/reports/revenue",
  events: "/api/admin/reports/events",
  tickets: "/api/admin/reports/tickets",
  memberships: "/api/admin/reports/memberships",
  sponsorships: "/api/admin/reports/sponsorships",
  donations: "/api/admin/reports/donations",
  discounts: "/api/admin/reports/discounts",
  users: "/api/admin/reports/users",
  checkins: "/api/admin/reports/checkins",
  finance: "/api/admin/reports/finance",
};

function SummaryGrid({ summary }) {
  if (!summary || typeof summary !== "object") return null;
  const entries = Object.entries(summary).filter(([, v]) => typeof v !== "object");
  return (
    <div className="admin-reports__summary-grid">
      {entries.slice(0, 12).map(([key, val]) => (
        <div key={key} className="admin-reports__summary-item">
          <strong>{String(val)}</strong>
          <span>{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewCards({ cards }) {
  if (!cards?.length) return null;
  return (
    <div className="admin-reports__cards">
      {cards.map((card) => (
        <article key={card.label} className="admin-reports__card">
          <p className="admin-reports__card-value">{card.value}</p>
          <p className="admin-reports__card-label">{card.label}</p>
          <div className="admin-reports__card-meta">
            <span className={trendClass(card.trend)}>{formatChange(card.change)}</span>
            <span className="admin-reports__trend--flat">vs prev.</span>
          </div>
          {card.sparkline?.length ? <ReportSparkline data={card.sparkline} /> : null}
        </article>
      ))}
    </div>
  );
}

function TabContent({ tab, data }) {
  if (!data) return null;

  switch (tab) {
    case "overview":
      return <OverviewCards cards={data.cards} />;

    case "revenue":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Revenue by Source</h3>
              <ReportPieChart data={data.bySource?.map((s) => ({ name: s.source, value: s.amountMinor }))} valueIsMinor />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Revenue Trend</h3>
              <ReportLineChart data={data.revenueTrend?.map((t) => ({ date: t.period, value: t.revenue }))} valueIsMinor />
            </div>
          </div>
          <div>
            <h3 className="admin-reports__section-title">Revenue by Event</h3>
            <ReportBarChart data={data.byEvent?.map((e) => ({ name: e.eventTitle, value: e.revenue }))} valueIsMinor />
          </div>
          <ReportDataTable
            columns={[
              { key: "eventTitle", label: "Event" },
              { key: "revenueFormatted", label: "Revenue" },
              { key: "orders", label: "Orders" },
            ]}
            rows={data.byEvent}
          />
        </div>
      );

    case "events":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Tickets Sold by Event</h3>
              <ReportBarChart data={data.ticketsByEvent} />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Event Revenue</h3>
              <ReportBarChart data={data.revenueByEvent?.map((e) => ({ name: e.name, value: e.value }))} valueIsMinor />
            </div>
          </div>
          <ReportDataTable
            columns={[
              { key: "title", label: "Event" },
              { key: "ticketsSold", label: "Tickets" },
              { key: "checkedIn", label: "Check-ins" },
              { key: "revenueFormatted", label: "Revenue" },
              { key: "utilization", label: "Capacity %" },
            ]}
            rows={data.topEvents}
          />
        </div>
      );

    case "tickets":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Ticket Sales Trend</h3>
              <ReportLineChart data={data.salesTrend} nameKey="date" />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Tickets by Type</h3>
              <ReportPieChart data={data.ticketsByType} />
            </div>
          </div>
          <div>
            <h3 className="admin-reports__section-title">Check-ins vs No-shows</h3>
            <ReportPieChart data={data.checkInsVsNoShows} />
          </div>
        </div>
      );

    case "memberships":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Membership Growth</h3>
              <ReportLineChart data={data.growthTrend?.map((g) => ({ date: g.period, value: g.count }))} />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Membership Types</h3>
              <ReportPieChart data={data.typeDistribution} />
            </div>
          </div>
          <ReportDataTable
            columns={[
              { key: "type", label: "Type" },
              { key: "count", label: "Count" },
              { key: "revenueFormatted", label: "Revenue" },
            ]}
            rows={data.byType}
          />
        </div>
      );

    case "sponsorships":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Revenue by Package</h3>
              <ReportBarChart data={data.packageChart} valueIsMinor />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Revenue Trend</h3>
              <ReportLineChart data={data.revenueTrend?.map((t) => ({ date: t.period, value: t.revenue }))} valueIsMinor />
            </div>
          </div>
          <ReportDataTable
            columns={[
              { key: "name", label: "Sponsor" },
              { key: "company", label: "Company" },
              { key: "amount", label: "Amount" },
              { key: "campaign", label: "Campaign" },
            ]}
            rows={data.topSponsors}
          />
        </div>
      );

    case "donations":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Donation Trend</h3>
              <ReportLineChart data={data.revenueTrend?.map((t) => ({ date: t.period, value: t.revenue }))} valueIsMinor />
            </div>
            <div>
              <h3 className="admin-reports__section-title">By Campaign</h3>
              <ReportPieChart data={data.campaignChart} valueIsMinor />
            </div>
          </div>
          <ReportDataTable
            columns={[
              { key: "name", label: "Donor" },
              { key: "email", label: "Email" },
              { key: "amount", label: "Amount" },
              { key: "campaign", label: "Campaign" },
            ]}
            rows={data.topDonors}
          />
        </div>
      );

    case "discounts":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Usage by Code</h3>
              <ReportBarChart data={data.usageChart} />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Savings Over Time</h3>
              <ReportLineChart data={data.savingsTrend} nameKey="date" valueIsMinor />
            </div>
          </div>
          <ReportDataTable
            columns={[
              { key: "code", label: "Code" },
              { key: "uses", label: "Uses" },
              { key: "savingsFormatted", label: "Savings" },
            ]}
            rows={data.byCode}
          />
        </div>
      );

    case "users":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Registration Trend</h3>
              <ReportLineChart data={data.registrationTrend} nameKey="date" />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Verified vs Unverified</h3>
              <ReportPieChart data={data.verifiedSplit} />
            </div>
          </div>
        </div>
      );

    case "checkins":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div className="admin-reports__grid-2">
            <div>
              <h3 className="admin-reports__section-title">Check-ins Over Time</h3>
              <ReportLineChart data={data.checkInTrend} nameKey="date" />
            </div>
            <div>
              <h3 className="admin-reports__section-title">Check-ins by Event</h3>
              <ReportBarChart data={data.eventChart} />
            </div>
          </div>
        </div>
      );

    case "finance":
      return (
        <div className="admin-reports__section">
          <SummaryGrid summary={data.summary} />
          <div>
            <h3 className="admin-reports__section-title">Income vs Expenses</h3>
            <ReportBarChart
              data={data.incomeVsExpenses?.map((m) => ({ name: m.month, value: m.income }))}
              valueIsMinor
            />
          </div>
          <ReportDataTable
            columns={[
              { key: "invoiceNumber", label: "Invoice" },
              { key: "client", label: "Client" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
            ]}
            rows={data.overdueInvoices}
            emptyMessage="No outstanding invoices."
          />
        </div>
      );

    default:
      return null;
  }
}

export default function AdminReportsPage() {
  const { admin } = useAdminAuth();
  const role = admin?.role || "admin";

  const visibleTabs = useMemo(
    () => REPORT_TABS.filter((t) => canViewReportSection(role, t.id)),
    [role]
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "overview");
  const [preset, setPreset] = useState("last30");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");

  const queryString = useMemo(
    () => buildDateParams(preset, dateFrom, dateTo).toString(),
    [preset, dateFrom, dateTo]
  );

  const loadTab = useCallback(async () => {
    if (!canViewReportSection(role, activeTab)) return;
    setLoading(true);
    setError("");
    console.log("[REPORT_OVERVIEW_FETCH_STARTED]", { tab: activeTab, preset });
    try {
      const endpoint = `${TAB_ENDPOINTS[activeTab]}?${queryString}`;
      const result = await apiFetch(endpoint, { headers: adminAuthHeaders() });
      setData(result);
      console.log("[REPORT_OVERVIEW_FETCH_SUCCESS]", { tab: activeTab });
    } catch (err) {
      console.error("[REPORT_OVERVIEW_FETCH_ERROR]", err.message);
      setError(err.message || "Could not load report data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, queryString, role]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  async function handleExport(format) {
    if (!canExportReports(role)) {
      setError("You do not have permission to export reports.");
      return;
    }
    setExporting(format);
    try {
      await exportReport(format, {
        reportType: activeTab,
        title: `${REPORT_TABS.find((t) => t.id === activeTab)?.label || "Report"} Report`,
        preset,
        dateFrom,
        dateTo,
      });
    } catch (err) {
      setError(err.message || "Export failed.");
    } finally {
      setExporting("");
    }
  }

  return (
    <AdminLayout
      pageTitle="Reports & Analytics"
      pageSubtitle="Track performance, understand trends and generate custom reports."
    >
      <div className="admin-reports">
        <div className="admin-reports__actions">
          <Link to="/admin/reports/custom" className="admin-reports__btn admin-reports__btn--primary">
            <IconChartBar size={16} /> Generate Custom Report
          </Link>
          <button type="button" className="admin-reports__btn" disabled={!canExportReports(role) || exporting === "pdf"} onClick={() => handleExport("pdf")}>
            <IconFileTypePdf size={16} /> {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </button>
          <button type="button" className="admin-reports__btn" disabled={!canExportReports(role) || exporting === "excel"} onClick={() => handleExport("excel")}>
            <IconFileSpreadsheet size={16} /> {exporting === "excel" ? "Exporting…" : "Export Excel"}
          </button>
          <button type="button" className="admin-reports__btn" disabled={!canExportReports(role) || exporting === "csv"} onClick={() => handleExport("csv")}>
            <IconDownload size={16} /> Export CSV
          </button>
          <button type="button" className="admin-reports__btn" onClick={loadTab} disabled={loading}>
            <IconRefresh size={16} /> Refresh Data
          </button>
          <Link to="/admin/reports/custom#schedule" className="admin-reports__btn">
            <IconCalendar size={16} /> Schedule Report
          </Link>
        </div>

        <div className="admin-reports__filters">
          <select value={preset} onChange={(e) => setPreset(e.target.value)} aria-label="Date range">
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {preset === "custom" ? (
            <>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To" />
            </>
          ) : null}
        </div>

        <nav className="admin-reports__tabs" aria-label="Report sections">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-reports__tab${activeTab === tab.id ? " admin-reports__tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error ? <p className="admin-reports__error" role="alert">{error}</p> : null}
        {loading ? <p className="admin-reports__status">Loading report data…</p> : null}
        {!loading ? <TabContent tab={activeTab} data={data} /> : null}
      </div>
    </AdminLayout>
  );
}
