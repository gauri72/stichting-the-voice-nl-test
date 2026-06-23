import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { canWriteSettingsCategory } from "../../../utils/settingsAdmin.js";

const FIELD_SCHEMAS = {
  general: [
    { key: "foundationName", label: "Foundation name", type: "text" },
    { key: "brandName", label: "Public brand name", type: "text" },
    { key: "websiteUrl", label: "Website URL", type: "url" },
    { key: "supportEmail", label: "Support email", type: "email" },
    { key: "contactEmail", label: "Contact email", type: "email" },
    { key: "financeEmail", label: "Finance email", type: "email" },
    { key: "defaultCurrency", label: "Default currency", type: "text" },
    { key: "timezone", label: "Timezone", type: "text" },
    { key: "defaultLanguage", label: "Default language", type: "text" },
    { key: "logoUrl", label: "Logo URL", type: "url" },
    { key: "footerCopyright", label: "Footer copyright", type: "textarea" },
    { key: "termsUrl", label: "Terms URL", type: "text" },
    { key: "privacyUrl", label: "Privacy policy URL", type: "text" },
  ],
  payment: [
    { key: "onlinePaymentsEnabled", label: "Enable online payments", type: "checkbox" },
    { key: "defaultProvider", label: "Default provider", type: "text" },
    { key: "mode", label: "Payment mode", type: "select", options: ["test", "live"] },
    { key: "currency", label: "Currency", type: "text" },
    { key: "bookingFeeEnabled", label: "Booking fee enabled", type: "checkbox" },
    { key: "bookingFeeAmount", label: "Booking fee amount", type: "number" },
    { key: "bookingFeePercent", label: "Booking fee %", type: "number" },
    { key: "vatEnabled", label: "VAT enabled", type: "checkbox" },
    { key: "vatPercent", label: "VAT %", type: "number" },
    { key: "freeOrderAutoComplete", label: "Free order auto-complete", type: "checkbox" },
    { key: "successRedirectUrl", label: "Success redirect URL", type: "text" },
    { key: "failedRedirectUrl", label: "Failed redirect URL", type: "text" },
  ],
  ticketing: [
    { key: "qrVerificationUrl", label: "QR verification URL", type: "text" },
    { key: "freeBookingAutoComplete", label: "Free booking auto-complete", type: "checkbox" },
    { key: "allowTicketResend", label: "Allow ticket resend", type: "checkbox" },
    { key: "allowTicketPdfDownload", label: "Allow ticket PDF download", type: "checkbox" },
    { key: "allowQrDownload", label: "Allow QR download", type: "checkbox" },
    { key: "defaultTicketTerms", label: "Default ticket terms", type: "textarea" },
    { key: "checkInEnabled", label: "Check-in app enabled", type: "checkbox" },
    { key: "defaultSeatHoldMinutes", label: "Default seat hold duration (minutes)", type: "number" },
    { key: "enableReservedSeating", label: "Enable reserved seating globally", type: "checkbox" },
    { key: "allowSeatChangesAfterBooking", label: "Allow seat changes after booking", type: "checkbox" },
    { key: "requireSeatSelectionBeforeCheckout", label: "Require seat selection before checkout", type: "checkbox" },
    { key: "defaultSeatMapZoom", label: "Default seat map zoom", type: "number" },
    { key: "seatMapImageMaxSizeMb", label: "Seat map image max size (MB)", type: "number" },
  ],
  membership: [
    { key: "expiryReminderDays", label: "Expiry reminder days", type: "number" },
    { key: "membershipCodeFormat", label: "Membership code format", type: "text" },
    { key: "qrVerificationUrl", label: "QR verification URL", type: "text" },
    { key: "ticketTailorLookupEnabled", label: "TicketTailor lookup enabled", type: "checkbox" },
    { key: "membershipDiscountsEnabled", label: "Membership discounts enabled", type: "checkbox" },
    { key: "autoLinkExternalMemberships", label: "Auto-link external memberships", type: "checkbox" },
  ],
  sponsorship: [
    { key: "paymentTermsDays", label: "Payment terms (days)", type: "number" },
    { key: "receiptNumberFormat", label: "Receipt number format", type: "text" },
    { key: "defaultFinanceEmail", label: "Default finance email", type: "email" },
  ],
  donation: [
    { key: "receiptNumberFormat", label: "Receipt number format", type: "text" },
    { key: "anonymousDonationsEnabled", label: "Anonymous donations enabled", type: "checkbox" },
    { key: "recurringDonationsEnabled", label: "Recurring donations enabled", type: "checkbox" },
  ],
  invoice: [
    { key: "invoiceNumberFormat", label: "Invoice number format", type: "text" },
    { key: "paymentTermsDays", label: "Payment terms (days)", type: "number" },
    { key: "defaultVatRate", label: "Default VAT %", type: "number" },
    { key: "footerText", label: "Invoice footer text", type: "textarea" },
  ],
  security: [
    { key: "requireReauthForFinancialChanges", label: "Require re-auth for financial changes", type: "checkbox" },
    { key: "sessionTimeoutMinutes", label: "Session timeout (minutes)", type: "number" },
    { key: "maxLoginAttempts", label: "Max login attempts", type: "number" },
    { key: "auditRetentionDays", label: "Audit retention (days)", type: "number" },
  ],
  integrations: [
    { key: "ticketTailorEnabled", label: "TicketTailor enabled", type: "checkbox" },
    { key: "stripeEnabled", label: "Stripe enabled", type: "checkbox" },
    { key: "googleAnalyticsId", label: "Google Analytics ID", type: "text" },
    { key: "googleTagManagerId", label: "Google Tag Manager ID", type: "text" },
    { key: "whatsappUrl", label: "WhatsApp link", type: "url" },
    { key: "youtubeUrl", label: "YouTube link", type: "url" },
    { key: "pwaEnabled", label: "PWA enabled", type: "checkbox" },
  ],
};

const TITLES = {
  general: "General Settings",
  payment: "Payment Settings",
  ticketing: "Ticketing Settings",
  membership: "Membership Settings",
  sponsorship: "Sponsorship Settings",
  donation: "Donation Settings",
  invoice: "Invoice Settings",
  security: "Security Settings",
  integrations: "Integrations",
};

export default function AdminSettingsCategoryPage() {
  const location = useLocation();
  const category = location.pathname.split("/").filter(Boolean).pop();
  const { admin } = useAdminAuth();
  const canWrite = canWriteSettingsCategory(admin?.role, category);
  const financeCategory = ["payment", "invoice"].includes(category);

  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const fields = FIELD_SCHEMAS[category] || [];

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/admin/settings/${category}`, { headers: adminAuthHeaders() })
      .then((d) => setForm(d.settings || {}))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const body = { ...form };
      if (financeCategory) body.confirm = confirmed;
      await apiFetch(`/api/admin/settings/${category}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(body),
      });
      setMessage("Settings saved.");
    } catch (err) {
      if (err.requireConfirm) setError("Please confirm financial settings changes.");
      else setError(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function renderField(field) {
    const value = form[field.key];
    if (field.type === "checkbox") {
      return (
        <label key={field.key} className="admin-settings__checkbox">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.checked }))}
            disabled={!canWrite}
          />
          {field.label}
        </label>
      );
    }
    if (field.type === "textarea") {
      return (
        <label key={field.key} className="admin-settings__field admin-settings__field--full">
          {field.label}
          <textarea
            rows={3}
            value={value ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
            disabled={!canWrite}
          />
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label key={field.key} className="admin-settings__field">
          {field.label}
          <select
            value={value ?? field.options[0]}
            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
            disabled={!canWrite}
          >
            {field.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
      );
    }
    return (
      <label key={field.key} className="admin-settings__field">
        {field.label}
        <input
          type={field.type || "text"}
          value={value ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
            }))
          }
          disabled={!canWrite}
        />
      </label>
    );
  }

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>{TITLES[category] || category}</h1>
      </header>

      {loading ? <p>Loading…</p> : null}
      {message ? <p className="admin-settings__message">{message}</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}

      <form className="admin-settings__form" onSubmit={handleSubmit}>
        <div className="admin-settings__form-grid">
          {fields.map(renderField)}
        </div>

        {financeCategory && canWrite ? (
          <label className="admin-settings__checkbox admin-settings__confirm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I confirm these financial settings changes
          </label>
        ) : null}

        {canWrite ? (
          <button type="submit" className="admin-settings__btn admin-settings__btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        ) : (
          <p className="admin-settings__readonly">Read-only access</p>
        )}
      </form>
    </section>
  );
}
