import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { getApplyStatus, postApply } from "./shared/vcommerceApi.js";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "./shared/BUSINESS_CATEGORIES.js";

const STEPS = ["Your Business", "Contact & Links", "Application"];

const STATUS_LABELS = {
  pending: "Under Review",
  approved: "Approved",
  rejected: "Not Approved",
};

const FAMILY_PLAN_NAMES = {
  privilegedFamily: "Privileged Family",
  premiumFamily: "Premium Family",
  family: "Family",
  privileged: "Privileged",
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    applicantType: "community_member",
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
  });

  useEffect(() => {
    document.title = "Apply to VCommerce — V.O.I.C.E. NL";
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
    if (statusData?.hasApprovedBusiness) {
      navigate("/dashboard/vcommerce", { replace: true });
    }
  }, [statusData, navigate]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await postApply({
        applicantType: form.applicantType,
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
      navigate("/vcommerce/apply/success");
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

  // Auth gate
  if (!user) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-gate-icon">🔒</div>
          <h1 className="vco-apply-page__title">Sign in to Apply</h1>
          <p className="vco-apply-page__subtitle">
            You need a V.O.I.C.E. NL account to apply for a VCommerce business listing.
          </p>
          <Link
            to="/my-account?return=/vcommerce/apply"
            className="vco-btn vco-btn--primary"
          >
            Sign in or Create Account
          </Link>
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            Back to VCommerce
          </Link>
        </div>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner">
          <p className="vco-apply-page__loading">Checking your membership…</p>
        </div>
      </div>
    );
  }

  // Membership gate — only for community members, not sponsors
  if (statusData && !statusData.hasFamilyMembership && form.applicantType === "community_member") {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-gate-icon">👑</div>
          <h1 className="vco-apply-page__title">Family Membership Required</h1>
          <p className="vco-apply-page__subtitle">
            Community member listings are exclusive to Family Membership holders. Upgrade your membership to
            apply, or apply as a Sponsor / Business below.
          </p>
          <div className="vco-apply-page__plan-list">
            {Object.entries(FAMILY_PLAN_NAMES).map(([, name]) => (
              <div key={name} className="vco-plan-pill">✓ {name}</div>
            ))}
          </div>
          <Link to="/membership" className="vco-btn vco-btn--primary">
            Explore Membership Plans
          </Link>
          <button type="button" className="vco-btn vco-btn--ghost"
            onClick={() => setForm((f) => ({ ...f, applicantType: "sponsor" }))}>
            Apply as Sponsor / Business instead
          </button>
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            Back to VCommerce
          </Link>
        </div>
      </div>
    );
  }

  // Already applied — show status tracker
  if (statusData?.alreadyApplied && statusData.applicationStatus !== "rejected") {
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
          {statusData.applicationStatus === "approved" && (
            <Link to="/dashboard/vcommerce" className="vco-btn vco-btn--primary">
              Go to My Business Dashboard
            </Link>
          )}
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            Back to VCommerce
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
            ← Back to VCommerce
          </Link>
          <h1 className="vco-apply-page__title">Apply to Join VCommerce</h1>
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
                      desc: "Women-led businesses from the V.O.I.C.E. NL community (Family Membership required)",
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

          {step === 2 && (
            <div className="vco-apply-form__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="applicationMessage">
                  Why do you want to join VCommerce? *
                </label>
                <textarea
                  id="applicationMessage"
                  className="vco-input vco-input--textarea"
                  value={form.applicationMessage}
                  onChange={set("applicationMessage")}
                  placeholder="Tell us about your goals, your community connection, and what you hope to achieve through VCommerce…"
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
                </div>
              </div>

              <p className="vco-apply-form__terms">
                By submitting, you agree to the{" "}
                <Link to="/terms-and-conditions" target="_blank">VCommerce Terms &amp; Conditions</Link>.
                {form.applicantType === "community_member"
                  ? " Community listings are for women-led businesses within the V.O.I.C.E. NL community."
                  : " Sponsor listings are open to all businesses and brands. Our team reviews applications within 5 days."
                }{" "}
                Platform fee is 0% by default.
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
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
