import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IconArrowLeft, IconDownload, IconCheck, IconCloudDownload } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { formatDate, badgeClass, downloadBlob, hasFinancePermission, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

function varianceClass(value) {
  const n = Number(value) || 0;
  return n >= 0 ? "admin-finance__variance--positive" : "admin-finance__variance--negative";
}

export default function AdminFinanceEventBudgetDetailPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const canWrite = hasFinancePermission(admin?.role, "budgets.write");
  const canApprove = hasFinancePermission(admin?.role, "budgets.approve");

  const [budget, setBudget] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/finance/event-budgets/${id}`, { headers: adminAuthHeaders() });
      setBudget(data.budget);
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      setError(err.message || "Could not load budget.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveBudget(updates) {
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/finance/event-budgets/${id}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(updates),
      });
      setBudget(data.budget);
    } catch (err) {
      setError(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(endpoint) {
    try {
      const data = await apiFetch(`/api/admin/finance/event-budgets/${id}/${endpoint}`, { method: "POST", headers: adminAuthHeaders() });
      setBudget(data.budget);
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  }

  if (loading) return <AdminLayout pageTitle="Event Budget"><p className="admin-finance__status">Loading…</p></AdminLayout>;
  if (!budget) return <AdminLayout pageTitle="Event Budget"><p className="admin-finance__error">{error || "Not found."}</p></AdminLayout>;

  return (
    <AdminLayout pageTitle={budget.eventName} pageSubtitle="Event budget detail, variance analysis and audit trail.">
      <div className="admin-finance">
        <Link to="/admin/finance/event-budgets" className="admin-finance__back"><IconArrowLeft size={16} /> Back to budgets</Link>

        <div className="admin-finance__top-actions">
          {canApprove ? <button type="button" className="admin-finance__btn" onClick={() => runAction("approve")}><IconCheck size={16} /> Approve</button> : null}
          {canApprove ? <button type="button" className="admin-finance__btn" onClick={() => runAction("finalize")}><IconCheck size={16} /> Finalize</button> : null}
          {canWrite ? <button type="button" className="admin-finance__btn" onClick={() => runAction("import-expenses")}><IconCloudDownload size={16} /> Import from Modules</button> : null}
          <button type="button" className="admin-finance__btn" onClick={() => downloadBlob(`/api/admin/finance/event-budgets/${id}/export-pdf`, "budget.pdf")}><IconDownload size={16} /> PDF</button>
          <button type="button" className="admin-finance__btn" onClick={() => downloadBlob(`/api/admin/finance/event-budgets/${id}/export-excel`, "budget.xlsx")}><IconDownload size={16} /> Excel</button>
        </div>

        {error ? <p className="admin-finance__error">{error}</p> : null}

        <section className="admin-finance-detail__grid">
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Event Date</p><p className="admin-finance__stat-value">{formatDate(budget.eventDate)}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Venue</p><p className="admin-finance__stat-value">{budget.venue || "—"}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Status</p><p><span className={badgeClass(budget.status)}>{budget.status}</span></p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Attendance</p><p className="admin-finance__stat-value">{budget.actualAttendance || budget.expectedAttendance || 0}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Total Income</p><p className="admin-finance__stat-value">{budget.actualIncomeTotalFormatted}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Total Expenses</p><p className="admin-finance__stat-value">{budget.actualExpenseTotalFormatted}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Net Result</p><p className={`admin-finance__stat-value ${varianceClass(budget.actualNetResult)}`}>{budget.actualNetResultFormatted}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Variance</p><p className={`admin-finance__stat-value ${varianceClass(budget.variance)}`}>{budget.varianceFormatted}</p></article>
        </section>

        <section className="admin-finance__section">
          <h2>Income Forecast vs Actual</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead><tr><th>Category</th><th>Description</th><th>Planned</th><th>Actual</th><th>Status</th></tr></thead>
              <tbody>
                {(budget.plannedIncomeLines || []).map((line, i) => {
                  const actual = budget.actualIncomeLines?.[i] || {};
                  return (
                    <tr key={i}>
                      <td>{INCOME_CATEGORIES.find((c) => c.value === line.category)?.label || line.category}</td>
                      <td>{line.description}</td>
                      <td>{line.plannedAmount ? (line.plannedAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td>{actual.actualAmount ? (actual.actualAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td>{actual.paymentStatus || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-finance__section">
          <h2>Expense Forecast vs Actual</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead><tr><th>Category</th><th>Vendor</th><th>Planned</th><th>Actual</th><th>Status</th></tr></thead>
              <tbody>
                {(budget.plannedExpenseLines || []).map((line, i) => {
                  const actual = budget.actualExpenseLines?.[i] || {};
                  return (
                    <tr key={i}>
                      <td>{EXPENSE_CATEGORIES.find((c) => c.value === line.category)?.label || line.category}</td>
                      <td>{line.vendorPayee || actual.vendorPayee || "—"}</td>
                      <td>{line.plannedAmount ? (line.plannedAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td>{actual.actualAmount ? (actual.actualAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td><span className={badgeClass(actual.paymentStatus)}>{actual.paymentStatus || "planned"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-finance__section">
          <h2>Variance Analysis</h2>
          <div className="admin-finance-detail__grid">
            <p>Income Variance: <span className={varianceClass(budget.incomeVariance)}>{budget.incomeVarianceFormatted}</span></p>
            <p>Expense Variance: <span className={varianceClass(-budget.expenseVariance)}>{budget.expenseVarianceFormatted}</span></p>
            <p>Break-even Attendance: {budget.breakEvenAttendance || "—"}</p>
            <p>Avg Revenue/Attendee: {budget.avgRevenuePerAttendee ? (budget.avgRevenuePerAttendee / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</p>
          </div>
        </section>

        <section className="admin-finance__section">
          <h2>Approval History</h2>
          <ul>{(budget.approvalHistory || []).map((h, i) => <li key={i}>{h.action} — {h.byName} — {formatDate(h.at)}</li>)}</ul>
        </section>

        <section className="admin-finance__section">
          <h2>Audit Trail</h2>
          <ul>{auditLogs.map((log) => <li key={log.id}>{formatDate(log.changedAt)} — {log.action} — {log.notes || log.entityId}</li>)}</ul>
        </section>

        {canWrite ? (
          <section className="admin-finance__section">
            <h2>Notes</h2>
            <textarea className="admin-finance__textarea" defaultValue={budget.notes} onBlur={(e) => saveBudget({ notes: e.target.value })} rows={4} />
            {saving ? <p className="admin-finance__status">Saving…</p> : null}
          </section>
        ) : null}
      </div>
    </AdminLayout>
  );
}
