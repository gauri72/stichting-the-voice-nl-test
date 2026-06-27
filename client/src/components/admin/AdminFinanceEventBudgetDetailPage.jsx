import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IconArrowLeft, IconDownload, IconCheck, IconCloudDownload, IconPlus, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { formatDate, badgeClass, downloadBlob, hasFinancePermission, INCOME_CATEGORIES, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_STATUSES } from "../../utils/financeAdmin.js";
import "../../styles/admin-sponsorships-donations-page.css";

function varianceClass(value) {
  const n = Number(value) || 0;
  return n >= 0 ? "admin-finance__variance--positive" : "admin-finance__variance--negative";
}

function toEuros(minor) {
  return minor ? String((Number(minor) / 100).toFixed(2)) : "";
}

function toMinor(euros) {
  const n = Number(euros);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

const EMPTY_INCOME_LINE = { category: "ticket_sales", description: "", plannedAmount: 0, actualAmount: 0, paymentStatus: "pending" };
const EMPTY_EXPENSE_LINE = { category: "venue_rental", vendorPayee: "", description: "", plannedAmount: 0, actualAmount: 0, paymentStatus: "planned" };

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
  const [incomeLines, setIncomeLines] = useState([]);
  const [expenseLines, setExpenseLines] = useState([]);

  const locked = budget?.status === "finalized" && admin?.role !== "superadmin";
  const canEditLines = canWrite && !locked;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/admin/finance/event-budgets/${id}`, { headers: adminAuthHeaders() });
      setBudget(data.budget);
      setIncomeLines(data.budget.incomeLines || []);
      setExpenseLines(data.budget.expenseLines || []);
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
      return data.budget;
    } catch (err) {
      setError(err.message || "Could not save.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveLines() {
    const saved = await saveBudget({ incomeLines, expenseLines });
    if (saved) {
      setIncomeLines(saved.incomeLines || []);
      setExpenseLines(saved.expenseLines || []);
    }
  }

  async function runAction(endpoint) {
    try {
      const data = await apiFetch(`/api/admin/finance/event-budgets/${id}/${endpoint}`, { method: "POST", headers: adminAuthHeaders() });
      setBudget(data.budget);
      setIncomeLines(data.budget.incomeLines || []);
      setExpenseLines(data.budget.expenseLines || []);
    } catch (err) {
      setError(err.message || "Action failed.");
    }
  }

  function updateIncomeLine(i, patch) {
    setIncomeLines((lines) => lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function updateExpenseLine(i, patch) {
    setExpenseLines((lines) => lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  if (loading) return <AdminLayout pageTitle="Event Budget"><p className="admin-finance__status">Loading…</p></AdminLayout>;
  if (!budget) return <AdminLayout pageTitle="Event Budget"><p className="admin-finance__error">{error || "Not found."}</p></AdminLayout>;

  const netResult = Number(budget.actualNetResult) || 0;
  const plBanner =
    netResult > 0
      ? { modifier: "profit", label: "Profit" }
      : netResult < 0
        ? { modifier: "loss", label: "Loss" }
        : { modifier: "breakeven", label: "Break-even" };

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

        <div className={`admin-finance__pl-banner admin-finance__pl-banner--${plBanner.modifier}`}>
          <span className="admin-finance__pl-banner-label">Event is currently: {plBanner.label}</span>
          <span className="admin-finance__pl-banner-amount">{budget.actualNetResultFormatted}</span>
        </div>

        <section className="admin-finance-detail__grid">
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Event Date</p><p className="admin-finance__stat-value">{formatDate(budget.eventDate)}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Venue</p><p className="admin-finance__stat-value">{budget.venue || "—"}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Status</p><p><span className={badgeClass(budget.status)}>{budget.status}</span></p></article>
          <article className="admin-finance__stat">
            <p className="admin-finance__stat-label">Expected Attendance</p>
            {canWrite && !locked ? (
              <input
                type="number"
                min="0"
                defaultValue={budget.expectedAttendance || ""}
                onBlur={(e) => saveBudget({ expectedAttendance: Number(e.target.value) || 0 })}
              />
            ) : (
              <p className="admin-finance__stat-value">{budget.expectedAttendance || 0}</p>
            )}
          </article>
          <article className="admin-finance__stat">
            <p className="admin-finance__stat-label">Actual Attendance</p>
            {canWrite && !locked ? (
              <input
                type="number"
                min="0"
                defaultValue={budget.actualAttendance || ""}
                onBlur={(e) => saveBudget({ actualAttendance: Number(e.target.value) || 0 })}
              />
            ) : (
              <p className="admin-finance__stat-value">{budget.actualAttendance || 0}</p>
            )}
          </article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Total Income</p><p className="admin-finance__stat-value">{budget.actualIncomeTotalFormatted}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Total Expenses</p><p className="admin-finance__stat-value">{budget.actualExpenseTotalFormatted}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Net Result</p><p className={`admin-finance__stat-value ${varianceClass(budget.actualNetResult)}`}>{budget.actualNetResultFormatted}</p></article>
          <article className="admin-finance__stat"><p className="admin-finance__stat-label">Variance</p><p className={`admin-finance__stat-value ${varianceClass(budget.variance)}`}>{budget.varianceFormatted}</p></article>
        </section>

        <section className="admin-finance__section">
          <h2>Income Forecast vs Actual</h2>
          {canEditLines ? (
            <>
              <div className="admin-finance__budget-lines">
                {incomeLines.map((line, i) => (
                  <div className="admin-finance__budget-line-row" key={i}>
                    <select value={line.category} onChange={(e) => updateIncomeLine(i, { category: e.target.value })}>
                      {INCOME_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input placeholder="Description" value={line.description || ""} onChange={(e) => updateIncomeLine(i, { description: e.target.value })} />
                    <input type="number" step="0.01" placeholder="Planned €" value={toEuros(line.plannedAmount)} onChange={(e) => updateIncomeLine(i, { plannedAmount: toMinor(e.target.value) })} />
                    <input type="number" step="0.01" placeholder="Actual €" value={toEuros(line.actualAmount)} onChange={(e) => updateIncomeLine(i, { actualAmount: toMinor(e.target.value) })} />
                    <select value={line.paymentStatus || "pending"} onChange={(e) => updateIncomeLine(i, { paymentStatus: e.target.value })}>
                      {EXPENSE_PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button type="button" className="admin-finance__icon-btn" onClick={() => setIncomeLines((lines) => lines.filter((_, idx) => idx !== i))} aria-label="Delete income line">
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="admin-finance__budget-line-actions">
                <button type="button" className="admin-finance__btn" onClick={() => setIncomeLines((lines) => [...lines, { ...EMPTY_INCOME_LINE }])}><IconPlus size={16} /> Add income line</button>
                <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={saveLines} disabled={saving}><IconDeviceFloppy size={16} /> {saving ? "Saving…" : "Save Budget"}</button>
              </div>
            </>
          ) : (
            <div className="admin-finance__table-wrap">
              <table className="admin-finance__table">
                <thead><tr><th>Category</th><th>Description</th><th>Planned</th><th>Actual</th><th>Status</th></tr></thead>
                <tbody>
                  {incomeLines.map((line, i) => (
                    <tr key={i}>
                      <td>{INCOME_CATEGORIES.find((c) => c.value === line.category)?.label || line.category}</td>
                      <td>{line.description}</td>
                      <td>{line.plannedAmount ? (line.plannedAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td>{line.actualAmount ? (line.actualAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td>{line.paymentStatus || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-finance__section">
          <h2>Expense Forecast vs Actual</h2>
          {canEditLines ? (
            <>
              <div className="admin-finance__budget-lines">
                {expenseLines.map((line, i) => (
                  <div className="admin-finance__budget-line-row admin-finance__budget-line-row--expense" key={i}>
                    <select value={line.category} onChange={(e) => updateExpenseLine(i, { category: e.target.value })}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input placeholder="Vendor" value={line.vendorPayee || ""} onChange={(e) => updateExpenseLine(i, { vendorPayee: e.target.value })} />
                    <input placeholder="Description" value={line.description || ""} onChange={(e) => updateExpenseLine(i, { description: e.target.value })} />
                    <input type="number" step="0.01" placeholder="Planned €" value={toEuros(line.plannedAmount)} onChange={(e) => updateExpenseLine(i, { plannedAmount: toMinor(e.target.value) })} />
                    <input type="number" step="0.01" placeholder="Actual €" value={toEuros(line.actualAmount)} onChange={(e) => updateExpenseLine(i, { actualAmount: toMinor(e.target.value) })} />
                    <select value={line.paymentStatus || "planned"} onChange={(e) => updateExpenseLine(i, { paymentStatus: e.target.value })}>
                      {EXPENSE_PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button type="button" className="admin-finance__icon-btn" onClick={() => setExpenseLines((lines) => lines.filter((_, idx) => idx !== i))} aria-label="Delete expense line">
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="admin-finance__budget-line-actions">
                <button type="button" className="admin-finance__btn" onClick={() => setExpenseLines((lines) => [...lines, { ...EMPTY_EXPENSE_LINE }])}><IconPlus size={16} /> Add expense line</button>
                <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={saveLines} disabled={saving}><IconDeviceFloppy size={16} /> {saving ? "Saving…" : "Save Budget"}</button>
              </div>
            </>
          ) : (
            <div className="admin-finance__table-wrap">
              <table className="admin-finance__table">
                <thead><tr><th>Category</th><th>Vendor</th><th>Planned</th><th>Actual</th><th>Status</th></tr></thead>
                <tbody>
                  {expenseLines.map((line, i) => (
                    <tr key={i}>
                      <td>{EXPENSE_CATEGORIES.find((c) => c.value === line.category)?.label || line.category}</td>
                      <td>{line.vendorPayee || "—"}</td>
                      <td>{line.plannedAmount ? (line.plannedAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td>{line.actualAmount ? (line.actualAmount / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }) : "—"}</td>
                      <td><span className={badgeClass(line.paymentStatus)}>{line.paymentStatus || "planned"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
