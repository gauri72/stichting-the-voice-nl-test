import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { confirmApplicationPackagePayment, getApplyStatus, postApply } from "./shared/vcommerceApi.js";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "./shared/BUSINESS_CATEGORIES.js";
import { SELLING_MODES, VCOMMERCE_PLANS } from "./shared/VCOMMERCE_PLANS.js";
import PayoutRegistrationForm from "./shared/PayoutRegistrationForm.jsx";
import "../../styles/vcommerce-marketplace.css";
import { buildLoginUrl } from "../../utils/authRedirect.js";

const STEP_KEYS = ["business", "selling", "contact", "payout", "review"];
const APPLICATION_DRAFT_KEY = "vcommerce_application_draft";

function readApplicationDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(APPLICATION_DRAFT_KEY) || "null") || {};
  } catch {
    return {};
  }
}

function StepIndicator({ current }) {
  const { t } = useTranslation(["vcommercePortal"]);
  return (
    <div className="vco-apply-steps">
      {STEP_KEYS.map((key, i) => (
        <div key={key} className={`vco-apply-steps__step${i === current ? " vco-apply-steps__step--active" : i < current ? " vco-apply-steps__step--done" : ""}`}>
          <div className="vco-apply-steps__dot">{i < current ? "✓" : i + 1}</div>
          <span>{t(`vcommercePortal:application.steps.${key}`)}</span>
          {i < STEP_KEYS.length - 1 && <div className="vco-apply-steps__line" />}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const colors = {
    pending: "vco-badge--warning",
    approved: "vco-badge--success",
    rejected: "vco-badge--error",
  };
  const statusLabels = {
    pending: t("vcommercePortal:application.status.pending"),
    approved: t("vcommercePortal:application.status.approved"),
    rejected: t("vcommercePortal:application.status.rejected"),
  };
  return (
    <span className={`vco-badge ${colors[status] || ""}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function VCommerceApplicationPage() {
  const { t } = useTranslation(["vcommercePortal"]);
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
    // Never contains a raw IBAN — PayoutRegistrationForm tokenizes bank details locally
    // and only ever hands back a Stripe token id + last 4 digits.
    payoutRegistration: {},
    ...readApplicationDraft(),
  }));

  useEffect(() => {
    document.title = t("vcommercePortal:application.meta.pageTitle");
    return () => { document.title = "V.O.I.C.E. NL"; };
  }, [t]);

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
      // Bank token/last-4 are never sent back by the server for a resumed draft — the
      // IBAN always needs to be re-entered and re-tokenized.
      payoutRegistration: draft.payoutRegistration || current.payoutRegistration,
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
        setError(err?.message || t("vcommercePortal:application.errors.paymentNotVerified"));
        setConfirmingPayment(false);
      });
  }, [navigate, searchParams, user, t]);

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
        payoutRegistration: { ...form.payoutRegistration, consentAcceptedAt: true },
      });
      if (!result?.url) throw new Error(t("vcommercePortal:application.errors.checkoutNotStarted"));
      window.location.assign(result.url);
    } catch (err) {
      setError(err?.message || t("vcommercePortal:application.errors.genericSubmit"));
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner">
          <p className="vco-apply-page__loading">{t("vcommercePortal:application.loading")}</p>
        </div>
      </div>
    );
  }

  if (confirmingPayment) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-payment-orbit" aria-hidden="true"><span /><span /><span /></div>
          <h1 className="vco-apply-page__title">{t("vcommercePortal:application.confirmingPayment.title")}</h1>
          <p className="vco-apply-page__subtitle">{t("vcommercePortal:application.confirmingPayment.subtitle")}</p>
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
          <h1 className="vco-apply-page__title">{t("vcommercePortal:application.authGate.title")}</h1>
          <p className="vco-apply-page__subtitle">
            {t("vcommercePortal:application.authGate.subtitle")}
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
            {t("vcommercePortal:application.authGate.signInButton")}
          </Link>
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            {t("vcommercePortal:application.authGate.backButton")}
          </Link>
        </div>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner">
          <p className="vco-apply-page__loading">{t("vcommercePortal:application.statusLoading")}</p>
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
          <h1 className="vco-apply-page__title">{t("vcommercePortal:application.alreadyApplied.title")}</h1>
          <p className="vco-apply-page__subtitle">
            {t("vcommercePortal:application.alreadyApplied.subtitle")}
          </p>
          <div className="vco-status-tracker">
            <StatusBadge status={statusData.applicationStatus} />
            {statusData.applicationStatus === "pending" && (
              <p className="vco-status-tracker__note">
                {t("vcommercePortal:application.alreadyApplied.pendingNote")}
              </p>
            )}
            {statusData.applicationStatus === "approved" && (
              <p className="vco-status-tracker__note">
                {t("vcommercePortal:application.alreadyApplied.approvedNote")}
              </p>
            )}
          </div>
          <div className="vco-status-account">
            <div className="vco-status-account__identity">
              <span className="vco-status-account__avatar" aria-hidden="true">
                {(user?.firstName || user?.email || "A").charAt(0).toUpperCase()}
              </span>
              <span>
                <small>{t("vcommercePortal:application.alreadyApplied.signedInAs")}</small>
                <strong>{user?.email || t("vcommercePortal:application.alreadyApplied.yourAccount")}</strong>
              </span>
            </div>
            <p>
              {t("vcommercePortal:application.alreadyApplied.oneApplicationNote")}
            </p>
            <button type="button" className="vco-btn vco-btn--switch-account" onClick={handleSwitchAccount}>
              <span aria-hidden="true">↪</span> {t("vcommercePortal:application.alreadyApplied.switchAccountButton")}
            </button>
          </div>
          {statusData.applicationStatus === "approved" && (
            <Link to="/dashboard/vcommerce" className="vco-btn vco-btn--primary">
              {t("vcommercePortal:application.alreadyApplied.goToDashboard")}
            </Link>
          )}
          <Link to="/vcommerce" className="vco-btn vco-btn--ghost">
            {t("vcommercePortal:application.alreadyApplied.backToVCommerce")}
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
            {t("vcommercePortal:application.header.backLink")}
          </Link>
          <h1 className="vco-apply-page__title">{t("vcommercePortal:application.header.title")}</h1>
          <p className="vco-apply-page__subtitle">
            {t("vcommercePortal:application.header.subtitle")}
          </p>
          {statusData?.alreadyApplied && statusData.applicationStatus === "rejected" && statusData.reviewNote && (
            <div className="vco-apply-page__rejected-note">
              <strong>{t("vcommercePortal:application.header.previousNote")}</strong> {statusData.reviewNote}
            </div>
          )}
        </div>

        <StepIndicator current={step} />

        <form onSubmit={handleSubmit} className="vco-apply-form">
          {step === 0 && (
            <div className="vco-apply-form__section">
              {/* Applicant type selector */}
              <div className="vco-field">
                <label className="vco-label">{t("vcommercePortal:application.step0.applicantTypeLabel")}</label>
                <div className="vco-applicant-type-grid">
                  {[
                    {
                      value: "community_member",
                      icon: "👩",
                      title: t("vcommercePortal:application.step0.communityMember.title"),
                      desc: t("vcommercePortal:application.step0.communityMember.desc"),
                    },
                    {
                      value: "sponsor",
                      icon: "🏢",
                      title: t("vcommercePortal:application.step0.sponsor.title"),
                      desc: t("vcommercePortal:application.step0.sponsor.desc"),
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
                <label className="vco-label" htmlFor="businessName">{t("vcommercePortal:application.step0.businessName.label")}</label>
                <input
                  id="businessName"
                  className="vco-input"
                  type="text"
                  value={form.businessName}
                  onChange={set("businessName")}
                  placeholder={t("vcommercePortal:application.step0.businessName.placeholder")}
                  maxLength={120}
                  required
                />
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="category">{t("vcommercePortal:application.step0.category.label")}</label>
                <select
                  id="category"
                  className="vco-input vco-input--select"
                  value={form.category}
                  onChange={set("category")}
                  required
                >
                  <option value="">{t("vcommercePortal:application.step0.category.placeholder")}</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{BUSINESS_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="tagline">{t("vcommercePortal:application.step0.tagline.label")}</label>
                <input
                  id="tagline"
                  className="vco-input"
                  type="text"
                  value={form.tagline}
                  onChange={set("tagline")}
                  placeholder={t("vcommercePortal:application.step0.tagline.placeholder")}
                  maxLength={160}
                />
                <span className="vco-field__hint">{form.tagline.length}/160</span>
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="description">{t("vcommercePortal:application.step0.description.label")}</label>
                <textarea
                  id="description"
                  className="vco-input vco-input--textarea"
                  value={form.description}
                  onChange={set("description")}
                  placeholder={t("vcommercePortal:application.step0.description.placeholder")}
                  maxLength={2000}
                  rows={5}
                  required
                />
                <span className="vco-field__hint">{form.description.length}/2000</span>
              </div>

            </div>
          )}

          {step === 1 && (
            <div className="vco-apply-form__section vco-commercial-step">
              <div>
                <span className="vco-kicker">{t("vcommercePortal:application.step1.kicker")}</span>
                <h2 className="vco-commercial-step__title">{t("vcommercePortal:application.step1.title")}</h2>
                <p className="vco-commercial-step__intro">{t("vcommercePortal:application.step1.intro")}</p>
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
              <div className="vco-billing-toggle" aria-label={t("vcommercePortal:application.step1.billingAriaLabel")}>
                {["monthly", "annual"].map((cycle) => (
                  <button key={cycle} type="button" className={form.billingCycle === cycle ? "is-active" : ""}
                    onClick={() => setForm((f) => ({ ...f, billingCycle: cycle }))}>
                    {cycle === "monthly" ? t("vcommercePortal:application.step1.monthly") : t("vcommercePortal:application.step1.annual")}
                  </button>
                ))}
              </div>
              <div className="vco-plan-grid">
                {VCOMMERCE_PLANS.map((plan) => (
                  <button key={plan.id} type="button"
                    className={`vco-plan-card vco-plan-card--${plan.accent}${form.packageId === plan.id ? " is-selected" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, packageId: plan.id }))}>
                    {plan.id === "growth" && <span className="vco-plan-card__flag">{t("vcommercePortal:application.step1.mostPopular")}</span>}
                    <span className="vco-plan-card__name">{plan.name}</span>
                    <span className="vco-plan-card__price">{form.billingCycle === "annual" ? plan.annual : plan.monthly}<small>{form.billingCycle === "annual" ? t("vcommercePortal:application.step1.perYear") : t("vcommercePortal:application.step1.perMonth")}</small></span>
                    <span className="vco-plan-card__founding">{t("vcommercePortal:application.step1.foundingOffer", { amount: plan.founding })}</span>
                    <ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                  </button>
                ))}
              </div>
              <div className="vco-fee-notice">
                <strong>{t("vcommercePortal:application.step1.feeNoticeStrong")}</strong> {t("vcommercePortal:application.step1.feeNoticeText")}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="vco-apply-form__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="contactEmail">{t("vcommercePortal:application.step2.contactEmail.label")}</label>
                <input
                  id="contactEmail"
                  className="vco-input"
                  type="email"
                  value={form.contactEmail}
                  onChange={set("contactEmail")}
                  placeholder={t("vcommercePortal:application.step2.contactEmail.placeholder")}
                  required
                />
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="contactPhone">{t("vcommercePortal:application.step2.contactPhone.label")}</label>
                <input
                  id="contactPhone"
                  className="vco-input"
                  type="tel"
                  value={form.contactPhone}
                  onChange={set("contactPhone")}
                  placeholder={t("vcommercePortal:application.step2.contactPhone.placeholder")}
                />
              </div>

              <div className="vco-field">
                <label className="vco-label" htmlFor="website">{t("vcommercePortal:application.step2.website.label")}</label>
                <input
                  id="website"
                  className="vco-input"
                  type="url"
                  value={form.website}
                  onChange={set("website")}
                  placeholder={t("vcommercePortal:application.step2.website.placeholder")}
                />
              </div>

              <p className="vco-apply-form__subsection-label">{t("vcommercePortal:application.step2.socialMediaLabel")}</p>

              <div className="vco-field-grid">
                {[
                  { key: "instagram", labelKey: "instagram", placeholder: t("vcommercePortal:application.step2.social.instagram.placeholder") },
                  { key: "facebook", labelKey: "facebook", placeholder: t("vcommercePortal:application.step2.social.facebook.placeholder") },
                  { key: "linkedin", labelKey: "linkedin", placeholder: t("vcommercePortal:application.step2.social.linkedin.placeholder") },
                  { key: "tiktok", labelKey: "tiktok", placeholder: t("vcommercePortal:application.step2.social.tiktok.placeholder") },
                  { key: "whatsapp", labelKey: "whatsapp", placeholder: t("vcommercePortal:application.step2.social.whatsapp.placeholder") },
                ].map(({ key, labelKey, placeholder }) => (
                  <div key={key} className="vco-field">
                    <label className="vco-label" htmlFor={key}>
                      {t(`vcommercePortal:application.step2.social.${labelKey}.label`)}
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
            <>
              <div className="vco-apply-form__section">
                <span className="vco-kicker">{t("vcommercePortal:application.step3.kicker")}</span>
                <h2 className="vco-commercial-step__title">{t("vcommercePortal:application.step3.title")}</h2>
                <p className="vco-commercial-step__intro">
                  {t("vcommercePortal:application.step3.intro")}
                </p>
              </div>
              <PayoutRegistrationForm
                value={form.payoutRegistration}
                onChange={(reg) => setForm((f) => ({ ...f, payoutRegistration: reg }))}
                companyRegistrationNumber={form.companyRegistrationNumber}
                vatNumber={form.vatNumber}
                onChangeCompanyFields={(fields) => setForm((f) => ({ ...f, ...fields }))}
              />
            </>
          )}

          {step === 4 && (
            <div className="vco-apply-form__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="applicationMessage">
                  {t("vcommercePortal:application.step4.messageLabel")}
                </label>
                <textarea
                  id="applicationMessage"
                  className="vco-input vco-input--textarea"
                  value={form.applicationMessage}
                  onChange={set("applicationMessage")}
                  placeholder={t("vcommercePortal:application.step4.messagePlaceholder")}
                  maxLength={1000}
                  rows={6}
                  required
                />
                <span className="vco-field__hint">{form.applicationMessage.length}/1000</span>
              </div>

              <div className="vco-apply-form__summary">
                <h3 className="vco-apply-form__summary-title">{t("vcommercePortal:application.step4.summary.title")}</h3>
                <div className="vco-apply-form__summary-grid">
                  <div><span>{t("vcommercePortal:application.step4.summary.business")}</span> <strong>{form.businessName || "—"}</strong></div>
                  <div><span>{t("vcommercePortal:application.step4.summary.category")}</span> <strong>{BUSINESS_CATEGORY_LABELS[form.category] || "—"}</strong></div>
                  <div><span>{t("vcommercePortal:application.step4.summary.email")}</span> <strong>{form.contactEmail || "—"}</strong></div>
                  <div><span>{t("vcommercePortal:application.step4.summary.selling")}</span> <strong>{SELLING_MODES.find((m) => m.id === form.sellingMode)?.name}</strong></div>
                  <div><span>{t("vcommercePortal:application.step4.summary.package")}</span> <strong>{VCOMMERCE_PLANS.find((p) => p.id === form.packageId)?.name}</strong></div>
                </div>
              </div>

              <p className="vco-apply-form__terms">
                {t("vcommercePortal:application.step4.termsPrefix")}{" "}
                <Link to="/terms-and-conditions" target="_blank">{t("vcommercePortal:application.step4.termsLink")}</Link>.
                {" "}{t("vcommercePortal:application.step4.termsSuffix")}
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
                {t("vcommercePortal:application.nav.back")}
              </button>
            )}
            {step < STEP_KEYS.length - 1 && (
              <button
                type="button"
                className="vco-btn vco-btn--primary"
                onClick={() => setStep((s) => s + 1)}
              >
                {t("vcommercePortal:application.nav.continue")}
              </button>
            )}
            {step === STEP_KEYS.length - 1 && (
              <button
                type="submit"
                className="vco-btn vco-btn--primary"
                disabled={submitting}
              >
                {submitting ? t("vcommercePortal:application.nav.submitting") : t("vcommercePortal:application.nav.submit")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
