import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { confirmApplicationPackagePayment, getApplyStatus, postApply } from "./shared/vcommerceApi.js";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "./shared/BUSINESS_CATEGORIES.js";
import { SELLING_MODES, VCOMMERCE_PLANS } from "./shared/VCOMMERCE_PLANS.js";
import "../../styles/vcommerce-marketplace.css";
import { buildLoginUrl } from "../../utils/authRedirect.js";

const STEPS = ["Your Business", "Selling Setup", "Contact & Links", "Review"];
const APPLICATION_DRAFT_KEY = "vcommerce_application_draft";

function readApplicationDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(APPLICATION_DRAFT_KEY) || "null") || {};
  } catch {
    return {};
  }
}

const STATUS_LABELS = {
  pending: "Under Review",
  approved: "Approved",
  rejected: "Not Approved",
};

function StepIndicator({ current }) {
  return (
    <div className="vco-apply-steps">
      {STEPS.map((label, i) => (
        <div key={label} className={`vco-apply-steps__step${i === current ? " vco-apply-steps__step--active" : i < current ? " vco-apply-steps__step--done" : ""}`}>
          <div className="vco-apply-steps__dot">{i < current ? "✓" : i + 1}</div>
          <span>{label}</span>
          {i < STEPS.length - 1 && <div className="vco-apply-steps__line" />}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: "vco-badge--warning",
    approved: "vco-badge--success",
    rejected: "vco-badge--error",
  };
  return (
    <span className={`vco-badge ${colors[status] || ""}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function VCommerceApplicationPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const [form, setForm] = useState(() => ({
    applicantType: "community_member",
    sellingMode: "hosted",
    packageId: "starter",
    billingCycle: "monthly",
    businessName: "",
    category: "",
    tagline: "",
    description: "",
    contactEmail: user?.email || "",
    contactPhone: "",
    website: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    tiktok: "",
    whatsapp: "",
    companyRegistrationNumber: "",
    vatNumber: "",
    applicationMessage: "",
    ...readApplicationDraft(),
  }));

  useEffect(() => {
    document.title = "Apply to V.Commerce — V.O.I.C.E. NL";
    return () => { document.title = "V.O.I.C.E. NL"; };
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, contactEmail: f.contactEmail || user.email || "" }));
    setStatusLoading(true);
    getApplyStatus()
      .then(setStatusData)
      .catch(() => setStatusData(null))
      .finally(() => setStatusLoading(false));
  }, [user]);

  useEffect(() => {
    const draft = statusData?.applicationDraft;
    if (!draft) return;
    setForm((current) => ({
      ...current,
      ...draft,
      instagram: draft.socialLinks?.instagram || current.instagram,
      facebook: draft.socialLinks?.facebook || current.facebook,
      linkedin: draft.socialLinks?.linkedin || current.linkedin,
      tiktok: draft.socialLinks?.tiktok || current.tiktok,
      whatsapp: draft.socialLinks?.whatsapp || current.whatsapp,
    }));
  }, [statusData?.applicationDraft]);

  useEffect(() => {
    try {
      sessionStorage.setItem(APPLICATION_DRAFT_KEY, JSON.stringify(form));
    } catch {
      // The form still works when storage is unavailable.
    }
  }, [form]);

  useEffect(() => {
    if (statusData?.hasApprovedBusiness) {
      navigate("/dashboard/vcommerce", { replace: true });
    }
  }, [statusData, navigate]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (searchParams.get("payment") !== "success" || !sessionId || !user) return;
    setConfirmingPayment(true);
    confirmApplicationPackagePayment(sessionId)
      .then(() => {
        try { sessionStorage.removeItem(APPLICATION_DRAFT_KEY); } catch { /* no-op */ }
        navigate("/dashboard/vcommerce?onboarding=1&payment=success", { replace: true });
      })
      .catch((err) => {
        setError(err?.message || "We could not verify your package payment.");
        setConfirmingPayment(false);
      });
  }, [navigate, searchParams, user]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSwitchAccount() {
    logout();
    navigate(buildLoginUrl("/vcommerce/apply", { journey: "business-onboarding" }), { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await postApply({
        applicantType: form.applicantType,
        sellingMode: form.sellingMode,
        packageId: form.packageId,
        billingCycle: form.billingCycle,
        businessName: form.businessName,
        category: form.category,
        tagline: form.tagline,
        description: form.description,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        website: form.website,
        socialLinks: {
          instagram: form.instagram,
          facebook: form.facebook,
          linkedin: form.linkedin,
          tiktok: form.tiktok,
          whatsapp: form.whatsapp,
        },
        companyRegistrationNumber: form.companyRegistrationNumber,
        vatNumber: form.vatNumber,
        applicationMessage: form.applicationMessage,
      });
      if (!result?.url) throw new Error("Secure package checkout could not be started.");
      window.location.assign(result.url);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner">
          <p className="vco-apply-page__loading">Loading…</p>
        </div>
      </div>
    );
  }

  if (confirmingPayment) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-payment-orbit" aria-hidden="true"><span /><span /><span /></div>
          <h1 className="vco-apply-page__title">Preparing your business workspace</h1>
          <p className="vco-apply-page__subtitle">Payment received. We’re securely creating your private V.Commerce setup area.</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-gate-icon">🔒</div>
          <h1 className="vco-apply-page__title">Sign in to Apply</h1>
          <p className="vco-apply-page__subtitle">
            You need a V.O.I.C.E. NL account to apply for a V.Commerce business listing.
          </p>
          <Link
            to={buildLoginUrl(
              searchParams.get("payment") === "success"
                ? `/vcommerce/apply?${searchParams.toString()}`
                : "/vcommerce/apply",
              { journey: "business-onboarding" }
            )}
            className="vco-btn vco-btn--primary"
          >
            Sign in or Create Account
          </Link>
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            Back to V.Commerce
          </Link>
        </div>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner">
          <p className="vco-apply-page__loading">Preparing your business setup…</p>
        </div>
      </div>
    );
  }

  // Already applied — show status tracker
  if (statusData?.alreadyApplied && ["setup", "pending", "approved"].includes(statusData.applicationStatus)) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-gate-icon">📋</div>
          <h1 className="vco-apply-page__title">Application Status</h1>
          <p className="vco-apply-page__subtitle">
            We've received your application. Here's where things stand:
          </p>
          <div className="vco-status-tracker">
            <StatusBadge status={statusData.applicationStatus} />
            {statusData.applicationStatus === "pending" && (
              <p className="vco-status-tracker__note">
                Our team reviews applications within 5 business days. We'll send you an email once a decision is made.
              </p>
            )}
            {statusData.applicationStatus === "approved" && (
              <p className="vco-status-tracker__note">
                Congratulations! Your business has been approved. Go to your dashboard to set up your storefront.
              </p>
            )}
          </div>
          <div className="vco-status-account">
            <div className="vco-status-account__identity">
              <span className="vco-status-account__avatar" aria-hidden="true">
                {(user?.firstName || user?.email || "A").charAt(0).toUpperCase()}
              </span>
              <span>
                <small>Signed in as</small>
                <strong>{user?.email || "Your account"}</strong>
              </span>
            </div>
            <p>
              One application can be under review per account. To apply for a different business using another
              account, sign out and continue with that account.
            </p>
            <button type="button" className="vco-btn vco-btn--switch-account" onClick={handleSwitchAccount}>
              <span aria-hidden="true">↪</span> Sign out and use another account
            </button>
          </div>
          {statusData.applicationStatus === "approved" && (
            <Link to="/dashboard/vcommerce" className="vco-btn vco-btn--primary">
              Go to My Business Dashboard
            </Link>
          )}
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            Back to V.Commerce
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vco-apply-page">
      <div className="vco-apply-page__inner">
        <div className="vco-apply-page__header">
          <Link to="/vcommerce" className="vco-apply-page__back">
            ← Back to V.Commerce
          </Link>
          <h1 className="vco-apply-page__title">Apply to Join V.Commerce</h1>
          <p className="vco-apply-page__subtitle">
            List your business, sell products and services, and reach the V.O.I.C.E. NL community. Weekly featured spots available.
          </p>
          {statusData?.alreadyApplied && statusData.applicationStatus === "rejected" && statusData.reviewNote && (
            <div className="vco-apply-page__rejected-note">
              <strong>Previous application note:</strong> {statusData.reviewNote}
            </div>
          )}
        </div>

        <StepIndicator current={step} />

        <form onSubmit={handleSubmit} className="vco-apply-form">
          {step === 0 && (
            <div className="vco-apply-form__section">
              {/* Applicant type selector */}
              <div className="vco-field">
                <label className="vco-label">I am applying as…</label>
                <div className="vco-applicant-type-grid">
                  {[
                    {
                      value: "community_member",
                      icon: "👩",
                      title: "Community Member",
                      desc: "Independent, local and community-led businesses. No membership is required.",
                    },
                    {
                      value: "sponsor",
                      icon: "🏢",
                      title: "Sponsor / Business",
                      desc: "Brands, distributors, and businesses selling to our community (no membership required)",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`vco-applicant-type-card${form.applicantType === opt.value ? " vco-applicant-type-card--selected" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, applicantType: opt.value }))}
                    >
                      <span className="vco-applicant-type-card__icon">{opt.icon}</span>
                      <span className="vco-applicant-type-card__title">{opt.title}</span>
                      <span className="vco-applicant-type-card__desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="businessName">Business Name *</label>
                <input
                  id="businessName"
                  className="vco-input"
                  type="text"
                  value={form.businessName}
                  onChange={set("businessName")}
                  placeholder="e.g. Aisha's Artisan Skincare"
                  maxLength={120}
                  required
                />
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="category">Category *</label>
                <select
                  id="category"
                  className="vco-input vco-input--select"
                  value={form.category}
                  onChange={set("category")}
                  required
                >
                  <option value="">Select a category…</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{BUSINESS_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="tagline">Tagline</label>
                <input
                  id="tagline"
                  className="vco-input"
                  type="text"
                  value={form.tagline}
                  onChange={set("tagline")}
                  placeholder="One sentence that captures your brand"
                  maxLength={160}
                />
                <span className="vco-field__hint">{form.tagline.length}/160</span>
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="description">Business Description *</label>
                <textarea
                  id="description"
                  className="vco-input vco-input--textarea"
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Tell us about your business, what you offer, and what makes it special…"
                  maxLength={2000}
                  rows={5}
                  required
                />
                <span className="vco-field__hint">{form.description.length}/2000</span>
              </div>

              {/* Sponsor-only extra fields */}
              {form.applicantType === "sponsor" && (
                <div className="vco-apply-form__sponsor-fields">
                  <p className="vco-apply-form__subsection-label">Business Registration (optional but recommended for faster approval)</p>
                  <div className="vco-field-grid">
                    <div className="vco-field">
                      <label className="vco-label" htmlFor="companyReg">Company Registration / KvK</label>
                      <input
                        id="companyReg"
                        className="vco-input"
                        type="text"
                        value={form.companyRegistrationNumber}
                        onChange={set("companyRegistrationNumber")}
                        maxLength={100}
                        placeholder="e.g. 12345678"
                      />
                    </div>
                    <div className="vco-field">
                      <label className="vco-label" htmlFor="vatNumber">VAT Number</label>
                      <input
                        id="vatNumber"
                        className="vco-input"
                        type="text"
                        value={form.vatNumber}
                        onChange={set("vatNumber")}
                        maxLength={50}
                        placeholder="e.g. NL123456789B01"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="vco-apply-form__section vco-commercial-step">
              <div>
                <span className="vco-kicker">Choose how you sell</span>
                <h2 className="vco-commercial-step__title">Your shop, your way</h2>
                <p className="vco-commercial-step__intro">No website? No problem. V.Commerce can become your complete online storefront.</p>
              </div>
              <div className="vco-selling-grid">
                {SELLING_MODES.map((mode) => (
                  <button key={mode.id} type="button"
                    className={`vco-selling-card${form.sellingMode === mode.id ? " is-selected" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, sellingMode: mode.id }))}>
                    <span className="vco-selling-card__icon">{mode.icon}</span>
                    <strong>{mode.name}</strong>
                    <span>{mode.description}</span>
                  </button>
                ))}
              </div>
              <div className="vco-billing-toggle" aria-label="Billing cycle">
                {["monthly", "annual"].map((cycle) => (
                  <button key={cycle} type="button" className={form.billingCycle === cycle ? "is-active" : ""}
                    onClick={() => setForm((f) => ({ ...f, billingCycle: cycle }))}>
                    {cycle === "monthly" ? "Monthly" : "Annual · save more"}
                  </button>
                ))}
              </div>
              <div className="vco-plan-grid">
                {VCOMMERCE_PLANS.map((plan) => (
                  <button key={plan.id} type="button"
                    className={`vco-plan-card vco-plan-card--${plan.accent}${form.packageId === plan.id ? " is-selected" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, packageId: plan.id }))}>
                    {plan.id === "growth" && <span className="vco-plan-card__flag">Most popular</span>}
                    <span className="vco-plan-card__name">{plan.name}</span>
                    <span className="vco-plan-card__price">{form.billingCycle === "annual" ? plan.annual : plan.monthly}<small>/{form.billingCycle === "annual" ? "year" : "month"}</small></span>
                    <span className="vco-plan-card__founding">Founding offer from {plan.founding}/month</span>
                    <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                  </button>
                ))}
              </div>
              <div className="vco-fee-notice">
                <strong>Simple and transparent:</strong> V.Commerce retains 5% only on sales completed through our checkout. Seller payouts are normally initiated on the fifth business day after successful payment.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="vco-apply-form__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="contactEmail">Contact Email *</label>
                <input
                  id="contactEmail"
                  className="vco-input"
                  type="email"
                  value={form.contactEmail}
                  onChange={set("contactEmail")}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="contactPhone">Phone / WhatsApp</label>
                <input
                  id="contactPhone"
                  className="vco-input"
                  type="tel"
                  value={form.contactPhone}
                  onChange={set("contactPhone")}
                  placeholder="+31 6 12345678"
                />
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="website">Website</label>
                <input
                  id="website"
                  className="vco-input"
                  type="url"
                  value={form.website}
                  onChange={set("website")}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <p className="vco-apply-form__subsection-label">Social Media (optional)</p>

              <div className="vco-field-grid">
                {[
                  { key: "instagram", placeholder: "instagram.com/yourbusiness" },
                  { key: "facebook", placeholder: "facebook.com/yourbusiness" },
                  { key: "linkedin", placeholder: "linkedin.com/in/you" },
                  { key: "tiktok", placeholder: "tiktok.com/@you" },
                  { key: "whatsapp", placeholder: "+31 6 12345678" },
                ].map(({ key, placeholder }) => (
                  <div key={key} className="vco-field">
                    <label className="vco-label" htmlFor={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input
                      id={key}
                      className="vco-input"
                      type="text"
                      value={form[key]}
                      onChange={set(key)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="vco-apply-form__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="applicationMessage">
                  Why do you want to join V.Commerce? *
                </label>
                <textarea
                  id="applicationMessage"
                  className="vco-input vco-input--textarea"
                  value={form.applicationMessage}
                  onChange={set("applicationMessage")}
                  placeholder="Tell us about your goals, your community connection, and what you hope to achieve through V.Commerce…"
                  maxLength={1000}
                  rows={6}
                  required
                />
                <span className="vco-field__hint">{form.applicationMessage.length}/1000</span>
              </div>

              <div className="vco-apply-form__summary">
                <h3 className="vco-apply-form__summary-title">Review your application</h3>
                <div className="vco-apply-form__summary-grid">
                  <div><span>Business:</span> <strong>{form.businessName || "—"}</strong></div>
                  <div><span>Category:</span> <strong>{BUSINESS_CATEGORY_LABELS[form.category] || "—"}</strong></div>
                  <div><span>Email:</span> <strong>{form.contactEmail || "—"}</strong></div>
                  <div><span>Selling:</span> <strong>{SELLING_MODES.find((m) => m.id === form.sellingMode)?.name}</strong></div>
                  <div><span>Package:</span> <strong>{VCOMMERCE_PLANS.find((p) => p.id === form.packageId)?.name}</strong></div>
                </div>
              </div>

              <p className="vco-apply-form__terms">
                By submitting, you agree to the{" "}
                <Link to="/terms-and-conditions" target="_blank">V.Commerce Terms &amp; Conditions</Link>.
                {" "}Our team normally reviews complete applications within 5 business days. Hosted V.Commerce sales carry a transparent 5% platform fee.
              </p>

              {error && <p className="vco-apply-form__error">{error}</p>}
            </div>
          )}

          <div className="vco-apply-form__nav">
            {step > 0 && (
              <button
                type="button"
                className="vco-btn vco-btn--ghost"
                onClick={() => setStep((s) => s - 1)}
                disabled={submitting}
              >
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 && (
              <button
                type="button"
                className="vco-btn vco-btn--primary"
                onClick={() => setStep((s) => s + 1)}
              >
                Continue →
              </button>
            )}
            {step === STEPS.length - 1 && (
              <button
                type="submit"
                className="vco-btn vco-btn--primary"
                disabled={submitting}
              >
                {submitting ? "Opening secure checkout…" : "Continue to Secure Payment"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
