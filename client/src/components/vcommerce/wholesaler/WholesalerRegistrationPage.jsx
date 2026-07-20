import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { postRegisterWholesaler } from "../shared/vcommerceApi.js";
import "../../../styles/vcommerce-marketplace.css";
import { buildLoginUrl } from "../../../utils/authRedirect.js";

const WHOLESALER_DRAFT_KEY = "vcommerce_wholesaler_draft";

function readWholesalerDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(WHOLESALER_DRAFT_KEY) || "null");
  } catch {
    return null;
  }
}

const COMPANY_TYPE_CODES = ["grocery_store", "distributor", "retailer", "restaurant", "hotel", "other"];
const COMPANY_TYPE_KEYS = {
  grocery_store: "groceryStore",
  distributor: "distributor",
  retailer: "retailer",
  restaurant: "restaurant",
  hotel: "hotel",
  other: "other",
};

const EU_COUNTRY_CODES = ["NL", "BE", "DE", "FR", "GB", "OTHER"];

const EMPTY = {
  companyName: "",
  companyType: "",
  kvkNumber: "",
  vatNumber: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  address: { street: "", city: "", postcode: "", country: "NL" },
};

export default function WholesalerRegistrationPage() {
  const { t } = useTranslation(["vcommercePortal"]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const draft = readWholesalerDraft();
  const [step, setStep] = useState(draft?.step === 1 ? 1 : 0);
  const [form, setForm] = useState(() => draft?.form || EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function persistDraft(nextForm, nextStep = step) {
    try {
      sessionStorage.setItem(WHOLESALER_DRAFT_KEY, JSON.stringify({ form: nextForm, step: nextStep }));
    } catch {
      // no-op
    }
  }

  function set(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      persistDraft(next);
      return next;
    });
  }

  function setAddr(key, value) {
    setForm((f) => {
      const next = { ...f, address: { ...f.address, [key]: value } };
      persistDraft(next);
      return next;
    });
  }

  function validateStep0() {
    if (!form.companyName.trim()) return t("vcommercePortal:wholesalerRegister.validation.companyNameRequired");
    if (!form.companyType) return t("vcommercePortal:wholesalerRegister.validation.companyTypeRequired");
    return null;
  }

  function validateStep1() {
    if (!form.contactEmail.trim()) return t("vcommercePortal:wholesalerRegister.validation.contactEmailRequired");
    if (!form.address.city.trim()) return t("vcommercePortal:wholesalerRegister.validation.cityRequired");
    return null;
  }

  function handleNext() {
    const err = step === 0 ? validateStep0() : null;
    if (err) { setError(err); return; }
    setError("");
    setStep(1);
    persistDraft(form, 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      await postRegisterWholesaler(form);
      try { sessionStorage.removeItem(WHOLESALER_DRAFT_KEY); } catch { /* no-op */ }
      navigate("/vcommerce/wholesaler/register/success");
    } catch (ex) {
      setError(ex.message || t("vcommercePortal:wholesalerRegister.registrationFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="vco-page vco-page--center">
        <div className="vco-auth-gate">
          <h2 className="vco-auth-gate__title">{t("vcommercePortal:wholesalerRegister.authGate.title")}</h2>
          <p className="vco-auth-gate__text">{t("vcommercePortal:wholesalerRegister.authGate.text")}</p>
          <Link
            to={buildLoginUrl("/vcommerce/wholesaler/register", { journey: "wholesaler-registration" })}
            className="vco-btn vco-btn--primary"
          >
            {t("vcommercePortal:wholesalerRegister.authGate.signInButton")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vco-page">
      <div className="mkt-registration">
        <div className="mkt-registration__header">
          <div className="mkt-registration__step-indicator">
            <div className={`mkt-step ${step >= 0 ? "mkt-step--active" : ""}`}>
              <span className="mkt-step__num">1</span>
              <span className="mkt-step__label">{t("vcommercePortal:wholesalerRegister.steps.businessInfo")}</span>
            </div>
            <div className="mkt-step__connector" />
            <div className={`mkt-step ${step >= 1 ? "mkt-step--active" : ""}`}>
              <span className="mkt-step__num">2</span>
              <span className="mkt-step__label">{t("vcommercePortal:wholesalerRegister.steps.contactAddress")}</span>
            </div>
          </div>
          <h1 className="mkt-registration__title">{t("vcommercePortal:wholesalerRegister.title")}</h1>
          <p className="mkt-registration__subtitle">
            {t("vcommercePortal:wholesalerRegister.subtitle")}
          </p>
        </div>

        {error && <div className="vco-error-banner" role="alert">{error}</div>}

        <form className="mkt-registration__form" onSubmit={handleSubmit} noValidate>
          {step === 0 && (
            <section className="mkt-registration__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="companyName">{t("vcommercePortal:wholesalerRegister.step0.companyName")} <span aria-hidden>*</span></label>
                <input id="companyName" className="vco-input" type="text" value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)} maxLength={200} required />
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="companyType">{t("vcommercePortal:wholesalerRegister.step0.companyType")} <span aria-hidden>*</span></label>
                <select id="companyType" className="vco-input" value={form.companyType}
                  onChange={(e) => set("companyType", e.target.value)} required>
                  <option value="">{t("vcommercePortal:wholesalerRegister.step0.selectType")}</option>
                  {COMPANY_TYPE_CODES.map((code) => (
                    <option key={code} value={code}>{t(`vcommercePortal:wholesalerRegister.companyTypes.${COMPANY_TYPE_KEYS[code]}`)}</option>
                  ))}
                </select>
              </div>
              <div className="vco-field-grid">
                <div className="vco-field">
                  <label className="vco-label" htmlFor="kvkNumber">{t("vcommercePortal:wholesalerRegister.step0.kvkNumber")}</label>
                  <input id="kvkNumber" className="vco-input" type="text" value={form.kvkNumber}
                    onChange={(e) => set("kvkNumber", e.target.value)} maxLength={20} />
                </div>
                <div className="vco-field">
                  <label className="vco-label" htmlFor="vatNumber">{t("vcommercePortal:wholesalerRegister.step0.vatNumber")}</label>
                  <input id="vatNumber" className="vco-input" type="text" value={form.vatNumber}
                    onChange={(e) => set("vatNumber", e.target.value)} maxLength={50}
                    placeholder={t("vcommercePortal:wholesalerRegister.step0.vatNumberPlaceholder")} />
                </div>
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="website">{t("vcommercePortal:wholesalerRegister.step0.website")}</label>
                <input id="website" className="vco-input" type="url" value={form.website}
                  onChange={(e) => set("website", e.target.value)} maxLength={500} />
              </div>
              <div className="mkt-registration__actions">
                <button type="button" className="vco-btn vco-btn--primary" onClick={handleNext}>
                  {t("vcommercePortal:wholesalerRegister.step0.nextButton")}
                </button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="mkt-registration__section">
              <div className="vco-field-grid">
                <div className="vco-field">
                  <label className="vco-label" htmlFor="contactEmail">{t("vcommercePortal:wholesalerRegister.step1.contactEmail")} <span aria-hidden>*</span></label>
                  <input id="contactEmail" className="vco-input" type="email" value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)} maxLength={254} required />
                </div>
                <div className="vco-field">
                  <label className="vco-label" htmlFor="contactPhone">{t("vcommercePortal:wholesalerRegister.step1.contactPhone")}</label>
                  <input id="contactPhone" className="vco-input" type="tel" value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)} maxLength={30} />
                </div>
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="addrStreet">{t("vcommercePortal:wholesalerRegister.step1.street")}</label>
                <input id="addrStreet" className="vco-input" type="text" value={form.address.street}
                  onChange={(e) => setAddr("street", e.target.value)} />
              </div>
              <div className="vco-field-grid">
                <div className="vco-field">
                  <label className="vco-label" htmlFor="addrCity">{t("vcommercePortal:wholesalerRegister.step1.city")} <span aria-hidden>*</span></label>
                  <input id="addrCity" className="vco-input" type="text" value={form.address.city}
                    onChange={(e) => setAddr("city", e.target.value)} required />
                </div>
                <div className="vco-field">
                  <label className="vco-label" htmlFor="addrPostcode">{t("vcommercePortal:wholesalerRegister.step1.postcode")}</label>
                  <input id="addrPostcode" className="vco-input" type="text" value={form.address.postcode}
                    onChange={(e) => setAddr("postcode", e.target.value)} />
                </div>
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="addrCountry">{t("vcommercePortal:wholesalerRegister.step1.country")}</label>
                <select id="addrCountry" className="vco-input" value={form.address.country}
                  onChange={(e) => setAddr("country", e.target.value)}>
                  {EU_COUNTRY_CODES.map((code) => (
                    <option key={code} value={code}>{t(`vcommercePortal:wholesalerRegister.countries.${code}`)}</option>
                  ))}
                </select>
              </div>
              <div className="mkt-registration__actions mkt-registration__actions--row">
                <button type="button" className="vco-btn vco-btn--ghost" onClick={() => { setError(""); setStep(0); }}>
                  {t("vcommercePortal:wholesalerRegister.step1.backButton")}
                </button>
                <button type="submit" className="vco-btn vco-btn--primary" disabled={submitting}>
                  {submitting ? t("vcommercePortal:wholesalerRegister.step1.submitting") : t("vcommercePortal:wholesalerRegister.step1.submitButton")}
                </button>
              </div>
            </section>
          )}
        </form>
      </div>
    </div>
  );
}
