import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { postRegisterWholesaler } from "../shared/vcommerceApi.js";
import "../../../styles/vcommerce-marketplace.css";

const COMPANY_TYPES = [
  { value: "grocery_store", label: "Grocery Store / Supermarket" },
  { value: "distributor", label: "Distributor / Wholesaler" },
  { value: "retailer", label: "Retailer / Shop" },
  { value: "restaurant", label: "Restaurant / Catering" },
  { value: "hotel", label: "Hotel / Hospitality" },
  { value: "other", label: "Other" },
];

const EU_COUNTRIES = [
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "GB", label: "United Kingdom" },
  { value: "OTHER", label: "Other" },
];

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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setAddr(key, value) {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
  }

  function validateStep0() {
    if (!form.companyName.trim()) return "Company name is required.";
    if (!form.companyType) return "Please select a company type.";
    return null;
  }

  function validateStep1() {
    if (!form.contactEmail.trim()) return "Contact email is required.";
    if (!form.address.city.trim()) return "City is required.";
    return null;
  }

  function handleNext() {
    const err = step === 0 ? validateStep0() : null;
    if (err) { setError(err); return; }
    setError("");
    setStep(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      await postRegisterWholesaler(form);
      navigate("/vcommerce/wholesaler/register/success");
    } catch (ex) {
      setError(ex.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="vco-page vco-page--center">
        <div className="vco-auth-gate">
          <h2 className="vco-auth-gate__title">Sign in to register as a wholesaler</h2>
          <p className="vco-auth-gate__text">You need an account to apply for a wholesaler account.</p>
          <Link to="/my-account" className="vco-btn vco-btn--primary">Sign In</Link>
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
              <span className="mkt-step__label">Business Info</span>
            </div>
            <div className="mkt-step__connector" />
            <div className={`mkt-step ${step >= 1 ? "mkt-step--active" : ""}`}>
              <span className="mkt-step__num">2</span>
              <span className="mkt-step__label">Contact &amp; Address</span>
            </div>
          </div>
          <h1 className="mkt-registration__title">Register as a Wholesaler</h1>
          <p className="mkt-registration__subtitle">
            Join the V.O.I.C.E. NL marketplace to access bulk pricing and wholesale catalogues from our sponsors.
          </p>
        </div>

        {error && <div className="vco-error-banner" role="alert">{error}</div>}

        <form className="mkt-registration__form" onSubmit={handleSubmit} noValidate>
          {step === 0 && (
            <section className="mkt-registration__section">
              <div className="vco-field">
                <label className="vco-label" htmlFor="companyName">Company Name <span aria-hidden>*</span></label>
                <input id="companyName" className="vco-input" type="text" value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)} maxLength={200} required />
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="companyType">Company Type <span aria-hidden>*</span></label>
                <select id="companyType" className="vco-input" value={form.companyType}
                  onChange={(e) => set("companyType", e.target.value)} required>
                  <option value="">Select type…</option>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="vco-field-grid">
                <div className="vco-field">
                  <label className="vco-label" htmlFor="kvkNumber">Chamber of Commerce / KvK Number</label>
                  <input id="kvkNumber" className="vco-input" type="text" value={form.kvkNumber}
                    onChange={(e) => set("kvkNumber", e.target.value)} maxLength={20} />
                </div>
                <div className="vco-field">
                  <label className="vco-label" htmlFor="vatNumber">VAT Number</label>
                  <input id="vatNumber" className="vco-input" type="text" value={form.vatNumber}
                    onChange={(e) => set("vatNumber", e.target.value)} maxLength={50}
                    placeholder="e.g. NL123456789B01" />
                </div>
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="website">Website (optional)</label>
                <input id="website" className="vco-input" type="url" value={form.website}
                  onChange={(e) => set("website", e.target.value)} maxLength={500} />
              </div>
              <div className="mkt-registration__actions">
                <button type="button" className="vco-btn vco-btn--primary" onClick={handleNext}>
                  Next: Contact &amp; Address
                </button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="mkt-registration__section">
              <div className="vco-field-grid">
                <div className="vco-field">
                  <label className="vco-label" htmlFor="contactEmail">Contact Email <span aria-hidden>*</span></label>
                  <input id="contactEmail" className="vco-input" type="email" value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)} maxLength={254} required />
                </div>
                <div className="vco-field">
                  <label className="vco-label" htmlFor="contactPhone">Phone</label>
                  <input id="contactPhone" className="vco-input" type="tel" value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)} maxLength={30} />
                </div>
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="addrStreet">Street Address</label>
                <input id="addrStreet" className="vco-input" type="text" value={form.address.street}
                  onChange={(e) => setAddr("street", e.target.value)} />
              </div>
              <div className="vco-field-grid">
                <div className="vco-field">
                  <label className="vco-label" htmlFor="addrCity">City <span aria-hidden>*</span></label>
                  <input id="addrCity" className="vco-input" type="text" value={form.address.city}
                    onChange={(e) => setAddr("city", e.target.value)} required />
                </div>
                <div className="vco-field">
                  <label className="vco-label" htmlFor="addrPostcode">Postcode</label>
                  <input id="addrPostcode" className="vco-input" type="text" value={form.address.postcode}
                    onChange={(e) => setAddr("postcode", e.target.value)} />
                </div>
              </div>
              <div className="vco-field">
                <label className="vco-label" htmlFor="addrCountry">Country</label>
                <select id="addrCountry" className="vco-input" value={form.address.country}
                  onChange={(e) => setAddr("country", e.target.value)}>
                  {EU_COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="mkt-registration__actions mkt-registration__actions--row">
                <button type="button" className="vco-btn vco-btn--ghost" onClick={() => { setError(""); setStep(0); }}>
                  Back
                </button>
                <button type="submit" className="vco-btn vco-btn--primary" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>
              </div>
            </section>
          )}
        </form>
      </div>
    </div>
  );
}
