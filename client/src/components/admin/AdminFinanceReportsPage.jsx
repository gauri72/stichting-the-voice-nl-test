import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconFileInvoice, IconChartBar, IconArrowsExchange, IconShieldCheck } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-sponsorships-donations-page.css";

export default function AdminFinanceReportsPage() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryData, logsData] = await Promise.all([
          apiFetch("/api/admin/finance/reports/summary", { headers: adminAuthHeaders() }),
          apiFetch("/api/admin/finance/audit-logs?limit=20", { headers: adminAuthHeaders() }),
        ]);
        setSummary(summaryData.summary);
        setLogs(logsData.logs || []);
      } catch (err) {
        setError(err.message || "Could not load financial reports.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = summary ? [
    { label: "Total Income", value: summary.totalIncome },
    { label: "Total Expenses", value: summary.totalExpenses },
    { label: "Net Result", value: summary.netResult },
    { label: "Pending Invoices", value: summary.invoiceStats?.pendingInvoices },
    { label: "Overdue Invoices", value: summary.invoiceStats?.overdueInvoices },
    { label: "Budget Variance", value: summary.budgetStats?.budgetVariance },
    { label: "Audit Reports", value: summary.auditReportsGenerated },
    { label: "Receipts Missing", value: summary.receiptsMissing ?? summary.invoiceStats?.outstandingAmount },
  ] : [];

  return (
    <AdminLayout pageTitle="Financial Reports" pageSubtitle="Overview of platform finances, variance and audit activity.">
      <div className="admin-finance">
        <div className="admin-finance__top-actions">
          <Link to="/admin/finance/invoices" className="admin-finance__btn"><IconFileInvoice size={16} /> Invoices</Link>
          <Link to="/admin/finance/event-budgets" className="admin-finance__btn"><IconChartBar size={16} /> Event Budgets</Link>
          <Link to="/admin/finance/transactions" className="admin-finance__btn"><IconArrowsExchange size={16} /> Transactions</Link>
          <Link to="/admin/finance/audit-reports" className="admin-finance__btn"><IconShieldCheck size={16} /> Audit Reports</Link>
        </div>

        {loading ? <p className="admin-finance__status">Loading…</p> : null}
        {error ? <p className="admin-finance__error">{error}</p> : null}

        {cards.length ? (
          <div className="admin-finance__stats">{cards.map((c) => (
            <article key={c.label} className="admin-finance__stat">
              <p className="admin-finance__stat-value">{c.value}</p>
              <p className="admin-finance__stat-label">{c.label}</p>
            </article>
          ))}</div>
        ) : null}

        <section className="admin-finance__section">
          <h2>Recent Finance Audit Logs</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead><tr><th>Date</th><th>Action</th><th>Entity</th><th>By</th><th>Notes</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.changedAt).toLocaleString("nl-NL")}</td>
                    <td>{log.action}</td>
                    <td>{log.entityType} {log.entityId}</td>
                    <td>{log.changedBy?.name || "—"}</td>
                    <td>{log.notes || "—"}</td>
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
