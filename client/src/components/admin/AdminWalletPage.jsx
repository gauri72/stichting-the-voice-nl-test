import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import VIconButton from "../icons/VIconButton.jsx";
import "../../styles/admin-sponsorships-donations-page.css";

export default function AdminWalletPage() {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [aiBookings, setAiBookings] = useState([]);
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [creditForm, setCreditForm] = useState({ customerId: "", amountMinor: "", reason: "" });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [walletsData, txData, aiData, settingsData, analyticsData] = await Promise.all([
        apiFetch("/api/admin/wallet/wallets", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/wallet/transactions", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/wallet/ai-bookings", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/wallet/settings", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/wallet/analytics", { headers: adminAuthHeaders() }),
      ]);
      setWallets(walletsData.wallets || []);
      setTransactions(txData.transactions || []);
      setAiBookings(aiData.bookings || []);
      setSettings(settingsData.settings);
      setAnalytics(analyticsData.analytics);
    } catch (err) {
      setError(err.message || "Could not load wallet data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSettingsChange(field, value) {
    try {
      const data = await apiFetch("/api/admin/wallet/settings", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ [field]: value }),
      });
      setSettings(data.settings);
    } catch (err) {
      setError(err.message || "Could not update settings.");
    }
  }

  async function handleCredit(e) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/wallet/credit", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          customerId: creditForm.customerId,
          amountMinor: Math.round(Number(creditForm.amountMinor) * 100),
          reason: creditForm.reason,
        }),
      });
      setMessage("Wallet credited.");
      setCreditForm({ customerId: "", amountMinor: "", reason: "" });
      setTimeout(() => setMessage(""), 2000);
      loadAll();
    } catch (err) {
      setError(err.message || "Could not credit wallet.");
    }
  }

  async function handleDebit(e) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/wallet/debit", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          customerId: creditForm.customerId,
          amountMinor: Math.round(Number(creditForm.amountMinor) * 100),
          reason: creditForm.reason,
        }),
      });
      setMessage("Wallet debited.");
      setCreditForm({ customerId: "", amountMinor: "", reason: "" });
      setTimeout(() => setMessage(""), 2000);
      loadAll();
    } catch (err) {
      setError(err.message || "Could not debit wallet.");
    }
  }

  if (loading) return <AdminLayout pageTitle="V.Wallet"><p className="admin-finance__status">Loading…</p></AdminLayout>;

  return (
    <AdminLayout pageTitle="V.Wallet" pageSubtitle="Customer balances, reward points, top-up revenue, and AI-initiated bookings.">
      <div className="admin-finance">
        {error ? <p className="admin-finance__error" role="alert">{error}</p> : null}
        {message ? <p className="admin-finance__status">{message}</p> : null}

        {analytics ? (
          <div className="admin-finance__stats">
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">{wallets.length}</p><p className="admin-finance__stat-label">Active Wallets</p></article>
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">€{(analytics.topUpRevenueMinor / 100).toFixed(2)}</p><p className="admin-finance__stat-label">Top-up Revenue</p></article>
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">€{(analytics.purchaseVolumeMinor / 100).toFixed(2)}</p><p className="admin-finance__stat-label">Wallet Purchase Volume</p></article>
            <article className="admin-finance__stat"><p className="admin-finance__stat-value">{analytics.aiBookings.count}</p><p className="admin-finance__stat-label">AI-Initiated Bookings (€{(analytics.aiBookings.totalMinor / 100).toFixed(2)})</p></article>
          </div>
        ) : null}

        {settings ? (
          <section className="admin-finance__section">
            <h2>Global Settings</h2>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={settings.enabled} onChange={(e) => handleSettingsChange("enabled", e.target.checked)} />
              Enable V.Wallet for all customers
            </label>
            <div className="admin-finance__field-row" style={{ flexWrap: "wrap", marginTop: 16 }}>
              <div className="admin-finance__field">
                <label>Max wallet balance (€)</label>
                <input type="number" defaultValue={settings.maxWalletBalanceMinor / 100} onBlur={(e) => handleSettingsChange("maxWalletBalanceMinor", Math.round(Number(e.target.value) * 100))} />
              </div>
              <div className="admin-finance__field">
                <label>2FA threshold for top-ups (€)</label>
                <input type="number" defaultValue={settings.twoFactorTopUpThresholdMinor / 100} onBlur={(e) => handleSettingsChange("twoFactorTopUpThresholdMinor", Math.round(Number(e.target.value) * 100))} />
              </div>
              <div className="admin-finance__field">
                <label>Points per €1 spent</label>
                <input type="number" defaultValue={settings.pointsPerEuroSpent} onBlur={(e) => handleSettingsChange("pointsPerEuroSpent", Number(e.target.value))} />
              </div>
              <div className="admin-finance__field">
                <label>Points per event attended</label>
                <input type="number" defaultValue={settings.pointsPerEventAttended} onBlur={(e) => handleSettingsChange("pointsPerEventAttended", Number(e.target.value))} />
              </div>
              <div className="admin-finance__field">
                <label>Min points to redeem</label>
                <input type="number" defaultValue={settings.minRedemptionPoints} onBlur={(e) => handleSettingsChange("minRedemptionPoints", Number(e.target.value))} />
              </div>
              <div className="admin-finance__field">
                <label>Points needed per €1 discount</label>
                <input type="number" defaultValue={settings.pointsNeededPerEuroDiscount} onBlur={(e) => handleSettingsChange("pointsNeededPerEuroDiscount", Number(e.target.value))} />
              </div>
              <div className="admin-finance__field">
                <label>Points expiry (days)</label>
                <input type="number" defaultValue={settings.pointsExpiryDays} onBlur={(e) => handleSettingsChange("pointsExpiryDays", Number(e.target.value))} />
              </div>
            </div>
          </section>
        ) : null}

        <section className="admin-finance__section">
          <h2>Manual Credit / Debit</h2>
          <form className="admin-finance__line-row" style={{ gridTemplateColumns: "2fr 1fr 2fr auto auto" }}>
            <input placeholder="Customer ID" value={creditForm.customerId} onChange={(e) => setCreditForm((f) => ({ ...f, customerId: e.target.value }))} />
            <input placeholder="Amount (€)" type="number" value={creditForm.amountMinor} onChange={(e) => setCreditForm((f) => ({ ...f, amountMinor: e.target.value }))} />
            <input placeholder="Reason (required)" value={creditForm.reason} onChange={(e) => setCreditForm((f) => ({ ...f, reason: e.target.value }))} />
            <button type="button" className="admin-finance__btn admin-finance__btn--primary" onClick={handleCredit}>Credit</button>
            <button type="button" className="admin-finance__btn" onClick={handleDebit}>Debit</button>
          </form>
        </section>

        <section className="admin-finance__section">
          <h2>Customer Wallets</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead><tr><th>Customer</th><th>Email</th><th>Balance</th><th>Points</th><th>Lifetime Earned</th><th>Lifetime Spent</th><th>Actions</th></tr></thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.customerId}>
                    <td>{w.name}</td>
                    <td>{w.email}</td>
                    <td>€{(w.balanceMinor / 100).toFixed(2)}</td>
                    <td>{w.rewardPoints}</td>
                    <td>€{(w.totalEarnedMinor / 100).toFixed(2)}</td>
                    <td>€{(w.totalSpentMinor / 100).toFixed(2)}</td>
                    <td>
                      <VIconButton
                        variant="top-up"
                        color="accent"
                        size="sm"
                        tooltip="Pre-fill credit form"
                        onClick={() => setCreditForm((f) => ({ ...f, customerId: w.customerId }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-finance__section">
          <h2>AI-Initiated Bookings</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead><tr><th>Customer</th><th>Event</th><th>Qty</th><th>Amount</th><th>Status</th><th>When</th></tr></thead>
              <tbody>
                {aiBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.customerName}</td>
                    <td>{b.eventTitle}</td>
                    <td>{b.quantity}</td>
                    <td>€{(b.totalAmountMinor / 100).toFixed(2)}</td>
                    <td><span className={b.status === "confirmed" ? "admin-finance__badge admin-finance__badge--paid" : "admin-finance__badge admin-finance__badge--overdue"}>{b.status}</span></td>
                    <td>{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-finance__section">
          <h2>Transaction Ledger</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead><tr><th>Customer</th><th>Type</th><th>Amount</th><th>Points</th><th>Initiated By</th><th>When</th></tr></thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.customerName}</td>
                    <td>{t.type}</td>
                    <td>{t.amountMinor ? `€${(t.amountMinor / 100).toFixed(2)}` : "—"}</td>
                    <td>{t.points || "—"}</td>
                    <td>{t.initiatedBy}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
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
