import { useCallback, useEffect, useState } from "react";
import {
  adminCreateAdjustment,
  adminCreateChargeRule,
  adminCreateRiskFlag,
  adminGetAdjustments,
  adminGetBusinesses,
  adminGetChargeRules,
  adminGetLedger,
  adminGetOperationsOverview,
  adminGetRiskFlags,
  adminPatchChargeRule,
  adminPatchRiskFlag,
  adminRunRiskScan,
} from "../vcommerce/shared/vcommerceApi.js";

const card = { background: "var(--ad-card-bg,var(--color-card-bg,#fff))", border: "1px solid var(--ad-border,rgba(128,128,128,.18))", borderRadius: 14, padding: 20 };
const input = { width: "100%", padding: "9px 11px", border: "1px solid var(--ad-border,rgba(128,128,128,.3))", borderRadius: 8, color: "inherit", background: "var(--ad-bg,var(--color-bg,#fff))" };
const button = { padding: "9px 14px", border: 0, borderRadius: 8, color: "#fff", background: "var(--ad-accent,#8b5cf6)", fontWeight: 700, cursor: "pointer" };
const th = { padding: 10, textAlign: "left", fontSize: ".72rem", textTransform: "uppercase", color: "var(--ad-text-muted,#888)", borderBottom: "1px solid var(--ad-border,rgba(128,128,128,.18))" };
const td = { padding: 10, borderBottom: "1px solid var(--ad-border,rgba(128,128,128,.1))", verticalAlign: "top" };

function money(value, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: currency.toUpperCase() }).format((value || 0) / 100);
}

function Field({ label, children }) {
  return <label style={{ display: "grid", gap: 5, fontSize: ".78rem", fontWeight: 700, color: "var(--ad-text-muted,#888)" }}><span>{label}</span>{children}</label>;
}

function Modal({ title, onClose, children }) {
  return <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "grid", placeItems: "center", padding: 20, background: "rgba(0,0,0,.62)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <section style={{ ...card, width: "min(680px,100%)", maxHeight: "90vh", overflow: "auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}><h3 style={{ margin: 0 }}>{title}</h3><button style={{ ...button, background: "transparent", color: "inherit", border: "1px solid var(--ad-border)" }} onClick={onClose}>Close</button></header>
      {children}
    </section>
  </div>;
}

export function CommercialControlsTab() {
  const [rules, setRules] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [ruleModal, setRuleModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(false);
  const [message, setMessage] = useState("");
  const [rule, setRule] = useState({ name: "", code: "", chargeType: "platform_fee", scope: "marketplace", businessId: "", calculation: "percentage", percent: 5, amountMinor: 0, isActive: true, notes: "" });
  const [adjustment, setAdjustment] = useState({ businessId: "", kind: "waiver", chargeType: "platform_fee", description: "", reason: "", amountMinor: 0, payoutEffect: "increase" });

  const load = useCallback(() => Promise.all([adminGetChargeRules(), adminGetAdjustments(), adminGetBusinesses()])
    .then(([r, a, b]) => { setRules(r.rules || []); setAdjustments(a.adjustments || []); setBusinesses(b.businesses || b.items || []); }), []);
  useEffect(() => { load().catch((e) => setMessage(e.message)); }, [load]);

  async function saveRule(e) {
    e.preventDefault();
    const payload = { ...rule, businessId: rule.businessId || null, amountMinor: Number(rule.amountMinor), percent: Number(rule.percent) };
    if (ruleModal?._id) await adminPatchChargeRule(ruleModal._id, payload); else await adminCreateChargeRule(payload);
    setRuleModal(null); setMessage("Charge rule saved with an audit entry."); await load();
  }
  async function saveAdjustment(e) {
    e.preventDefault();
    await adminCreateAdjustment({ ...adjustment, amountMinor: Number(adjustment.amountMinor) });
    setAdjustModal(false); setMessage("Financial adjustment recorded in the immutable ledger."); await load();
  }
  function openRule(existing = null) {
    setRuleModal(existing || {});
    setRule(existing ? { ...existing, businessId: existing.businessId?._id || existing.businessId || "" } : { name: "", code: "", chargeType: "platform_fee", scope: "marketplace", businessId: "", calculation: "percentage", percent: 5, amountMinor: 0, isActive: true, notes: "" });
  }

  return <div style={{ display: "grid", gap: 22 }}>
    {message && <p style={{ ...card, padding: 12, color: "#10b981" }}>{message}</p>}
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div><h3 style={{ margin: 0 }}>Charges, waivers and credits</h3><p style={{ margin: "5px 0 0", color: "var(--ad-text-muted,#888)" }}>Rules affect future calculations; adjustments preserve historical order totals.</p></div>
      <div style={{ display: "flex", gap: 8 }}><button style={button} onClick={() => openRule()}>+ Charge rule</button><button style={{ ...button, background: "#0f9f82" }} onClick={() => setAdjustModal(true)}>+ Waiver / adjustment</button></div>
    </div>
    <section style={card}><h4 style={{ marginTop: 0 }}>Active commercial rules</h4><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Rule</th><th style={th}>Scope</th><th style={th}>Value</th><th style={th}>Dates</th><th style={th}>Status</th><th style={th}></th></tr></thead><tbody>
      {rules.map((r) => <tr key={r._id}><td style={td}><strong>{r.name}</strong><br/><small>{r.chargeType} · {r.code}</small></td><td style={td}>{r.scope}{r.businessId?.businessName ? ` · ${r.businessId.businessName}` : ""}</td><td style={td}>{r.calculation === "percentage" ? `${r.percent}%` : money(r.amountMinor, r.currency)}</td><td style={td}><small>{r.startsAt ? new Date(r.startsAt).toLocaleDateString() : "Now"} – {r.endsAt ? new Date(r.endsAt).toLocaleDateString() : "No expiry"}</small></td><td style={td}>{r.isActive ? "Active" : "Inactive"}</td><td style={td}><button style={{ ...button, padding: "5px 9px" }} onClick={() => openRule(r)}>Edit</button></td></tr>)}
      {!rules.length && <tr><td style={td} colSpan={6}>No configurable rules yet. Existing business fee percentages remain active.</td></tr>}
    </tbody></table></div></section>
    <section style={card}><h4 style={{ marginTop: 0 }}>Recent adjustments</h4><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Business</th><th style={th}>Type</th><th style={th}>Description</th><th style={th}>Amount</th><th style={th}>Reason</th><th style={th}>Date</th></tr></thead><tbody>
      {adjustments.map((a) => <tr key={a._id}><td style={td}>{a.businessId?.businessName}</td><td style={td}>{a.kind}</td><td style={td}>{a.description}</td><td style={td}>{money(a.amountMinor, a.currency)}</td><td style={td}>{a.reason}</td><td style={td}>{new Date(a.createdAt).toLocaleDateString("nl-NL")}</td></tr>)}
      {!adjustments.length && <tr><td style={td} colSpan={6}>No waivers, credits or deductions recorded.</td></tr>}
    </tbody></table></div></section>

    {ruleModal && <Modal title={ruleModal._id ? "Edit charge rule" : "Create charge rule"} onClose={() => setRuleModal(null)}><form onSubmit={saveRule} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Name"><input style={input} required value={rule.name} onChange={(e) => setRule({ ...rule, name: e.target.value })}/></Field>
      <Field label="Code"><input style={input} required value={rule.code} onChange={(e) => setRule({ ...rule, code: e.target.value })}/></Field>
      <Field label="Charge type"><select style={input} value={rule.chargeType} onChange={(e) => setRule({ ...rule, chargeType: e.target.value })}>{["setup","subscription","platform_fee","processing","cashback","promotion","handling","manual"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Scope"><select style={input} value={rule.scope} onChange={(e) => setRule({ ...rule, scope: e.target.value })}>{["marketplace","plan","business","product"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Business override"><select style={input} value={rule.businessId || ""} onChange={(e) => setRule({ ...rule, businessId: e.target.value })}><option value="">All businesses</option>{businesses.map((b) => <option value={b._id} key={b._id}>{b.businessName}</option>)}</select></Field>
      <Field label="Calculation"><select style={input} value={rule.calculation} onChange={(e) => setRule({ ...rule, calculation: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></Field>
      {rule.calculation === "percentage" ? <Field label="Percent"><input style={input} type="number" min="0" max="100" step=".1" value={rule.percent} onChange={(e) => setRule({ ...rule, percent: e.target.value })}/></Field> : <Field label="Amount (cents)"><input style={input} type="number" min="0" value={rule.amountMinor} onChange={(e) => setRule({ ...rule, amountMinor: e.target.value })}/></Field>}
      <Field label="Internal notes"><input style={input} value={rule.notes || ""} onChange={(e) => setRule({ ...rule, notes: e.target.value })}/></Field>
      <button style={{ ...button, gridColumn: "1/-1" }}>Save rule</button>
    </form></Modal>}

    {adjustModal && <Modal title="Record waiver, credit or deduction" onClose={() => setAdjustModal(false)}><form onSubmit={saveAdjustment} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="Business"><select style={input} required value={adjustment.businessId} onChange={(e) => setAdjustment({ ...adjustment, businessId: e.target.value })}><option value="">Select…</option>{businesses.map((b) => <option value={b._id} key={b._id}>{b.businessName}</option>)}</select></Field>
      <Field label="Adjustment"><select style={input} value={adjustment.kind} onChange={(e) => setAdjustment({ ...adjustment, kind: e.target.value })}>{["waiver","credit","deduction","refund","manual_charge"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Charge type"><select style={input} value={adjustment.chargeType} onChange={(e) => setAdjustment({ ...adjustment, chargeType: e.target.value })}>{["setup","subscription","platform_fee","processing","cashback","promotion","handling","manual"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Amount (cents)"><input style={input} type="number" min="1" required value={adjustment.amountMinor} onChange={(e) => setAdjustment({ ...adjustment, amountMinor: e.target.value })}/></Field>
      <Field label="Description"><input style={input} required value={adjustment.description} onChange={(e) => setAdjustment({ ...adjustment, description: e.target.value })}/></Field>
      <Field label="Payout effect"><select style={input} value={adjustment.payoutEffect} onChange={(e) => setAdjustment({ ...adjustment, payoutEffect: e.target.value })}><option value="increase">Increase seller balance</option><option value="decrease">Decrease seller balance</option><option value="none">Record only</option></select></Field>
      <Field label="Required reason"><textarea style={{ ...input, minHeight: 75 }} required value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}/></Field>
      <button style={{ ...button, gridColumn: "1/-1" }}>Record immutable adjustment</button>
    </form></Modal>}
  </div>;
}

export function LedgerTab() {
  const [entries, setEntries] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessId] = useState("");
  useEffect(() => { adminGetBusinesses().then((d) => setBusinesses(d.businesses || d.items || [])); }, []);
  useEffect(() => { adminGetLedger(businessId ? { businessId } : {}).then((d) => setEntries(d.entries || [])); }, [businessId]);
  const balance = entries.reduce((sum, e) => sum + (e.direction === "credit" ? e.amountMinor : -e.amountMinor), 0);
  function exportCsv() {
    const escape = (value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
    const rows = [["date","business","entry_type","description","direction","amount_minor","currency","idempotency_key"], ...entries.map((e) => [e.createdAt,e.businessId?.businessName,e.entryType,e.description,e.direction,e.amountMinor,e.currency,e.idempotencyKey])];
    const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `vcommerce-ledger-${new Date().toISOString().slice(0,10)}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  }
  return <div style={{ display: "grid", gap: 18 }}><div style={{ ...card, display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}><Field label="Filter business"><select style={{ ...input, minWidth: 240 }} value={businessId} onChange={(e) => setBusinessId(e.target.value)}><option value="">All businesses</option>{businesses.map((b) => <option key={b._id} value={b._id}>{b.businessName}</option>)}</select></Field><div><small>Ledger balance in current view</small><strong style={{ display: "block", fontSize: "1.5rem" }}>{money(balance)}</strong></div><button style={button} onClick={exportCsv} disabled={!entries.length}>Export CSV</button></div>
    <section style={card}><h3 style={{ marginTop: 0 }}>Immutable ledger</h3><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Date</th><th style={th}>Business</th><th style={th}>Entry</th><th style={th}>Description</th><th style={th}>Direction</th><th style={th}>Amount</th><th style={th}>Key</th></tr></thead><tbody>{entries.map((e) => <tr key={e._id}><td style={td}>{new Date(e.createdAt).toLocaleString("nl-NL")}</td><td style={td}>{e.businessId?.businessName}</td><td style={td}>{e.entryType}</td><td style={td}>{e.description}</td><td style={td}>{e.direction}</td><td style={{ ...td, color: e.direction === "credit" ? "#10b981" : "#ef4444" }}>{e.direction === "credit" ? "+" : "−"}{money(e.amountMinor,e.currency)}</td><td style={td}><code style={{ fontSize: ".68rem" }}>{e.idempotencyKey}</code></td></tr>)}{!entries.length && <tr><td style={td} colSpan={7}>Ledger entries will appear when paid orders, payouts, or adjustments are recorded.</td></tr>}</tbody></table></div></section>
  </div>;
}

export function OperationsTab() {
  const [overview, setOverview] = useState(null);
  const [flags, setFlags] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [showFlag, setShowFlag] = useState(false);
  const [flag, setFlag] = useState({ businessId: "", title: "", category: "compliance", severity: "medium", detail: "" });
  const load = useCallback(() => Promise.all([adminGetOperationsOverview(), adminGetRiskFlags(), adminGetBusinesses()]).then(([o,f,b]) => { setOverview(o); setFlags(f.flags || []); setBusinesses(b.businesses || b.items || []); }), []);
  useEffect(() => { load(); }, [load]);
  async function create(e) { e.preventDefault(); await adminCreateRiskFlag(flag); setShowFlag(false); await load(); }
  async function resolve(id) { await adminPatchRiskFlag(id, { status: "resolved", resolution: "Resolved from operations console." }); await load(); }
  async function scan() { await adminRunRiskScan(); await load(); }
  return <div style={{ display: "grid", gap: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>{[
      ["Active charge rules",overview?.activeChargeRules || 0],["Open risk flags",overview?.openRisks || 0],["Orders on payout hold",overview?.heldOrders || 0],["Adjustment groups",overview?.adjustments?.length || 0],
    ].map(([label,value]) => <div style={card} key={label}><small>{label}</small><strong style={{ display: "block", fontSize: "1.7rem", marginTop: 6 }}>{value}</strong></div>)}</div>
    <section style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><h3 style={{ margin: 0 }}>Risk and compliance queue</h3><p style={{ color: "var(--ad-text-muted,#888)" }}>Manual flags complement automated payment, content and payout monitoring.</p></div><div style={{ display: "flex", gap: 8 }}><button style={{ ...button, background: "#087f8c" }} onClick={scan}>Run automated scan</button><button style={button} onClick={() => setShowFlag(true)}>+ Risk flag</button></div></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Business</th><th style={th}>Severity</th><th style={th}>Category</th><th style={th}>Issue</th><th style={th}>Status</th><th style={th}></th></tr></thead><tbody>{flags.map((f) => <tr key={f._id}><td style={td}>{f.businessId?.businessName}</td><td style={td}>{f.severity}</td><td style={td}>{f.category}</td><td style={td}><strong>{f.title}</strong><br/><small>{f.detail}</small></td><td style={td}>{f.status}</td><td style={td}>{!["resolved","dismissed"].includes(f.status) && <button style={{ ...button, padding: "5px 9px" }} onClick={() => resolve(f._id)}>Resolve</button>}</td></tr>)}{!flags.length && <tr><td style={td} colSpan={6}>No risk flags.</td></tr>}</tbody></table></div>
    </section>
    <section style={card}><h3 style={{ marginTop: 0 }}>Recent V.Commerce administration activity</h3>{(overview?.recentActivity || []).map((a) => <div key={a._id} style={{ padding: "9px 0", borderBottom: "1px solid var(--ad-border,rgba(128,128,128,.1))" }}><strong>{a.summary || a.action}</strong><br/><small>{a.adminId ? `${a.adminId.firstName} ${a.adminId.lastName}` : "System"} · {new Date(a.createdAt).toLocaleString("nl-NL")}</small></div>)}</section>
    {showFlag && <Modal title="Create risk flag" onClose={() => setShowFlag(false)}><form onSubmit={create} style={{ display: "grid", gap: 12 }}><Field label="Business"><select style={input} required value={flag.businessId} onChange={(e) => setFlag({ ...flag, businessId: e.target.value })}><option value="">Select…</option>{businesses.map((b) => <option value={b._id} key={b._id}>{b.businessName}</option>)}</select></Field><Field label="Title"><input style={input} required value={flag.title} onChange={(e) => setFlag({ ...flag, title: e.target.value })}/></Field><Field label="Severity"><select style={input} value={flag.severity} onChange={(e) => setFlag({ ...flag, severity: e.target.value })}>{["low","medium","high","critical"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Detail"><textarea style={{ ...input, minHeight: 90 }} value={flag.detail} onChange={(e) => setFlag({ ...flag, detail: e.target.value })}/></Field><button style={button}>Add to queue</button></form></Modal>}
  </div>;
}
