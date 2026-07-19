import { useState } from "react";
import { getStripePromise } from "../../../utils/stripeClient.js";
import FieldHelp from "./FieldHelp.jsx";

const COUNTRIES = [
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "DE", label: "Germany" },
];

function AddressFields({ prefix, value, onChange }) {
  const addr = value || {};
  const set = (field) => (e) => onChange({ ...addr, [field]: e.target.value });
  return (
    <div className="vco-field-grid">
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-street`}>Street</label>
        <input id={`${prefix}-street`} className="vco-input" type="text" value={addr.street || ""} onChange={set("street")} placeholder="Prinsengracht" />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-houseNumber`}>House number</label>
        <input id={`${prefix}-houseNumber`} className="vco-input" type="text" value={addr.houseNumber || ""} onChange={set("houseNumber")} placeholder="12" />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-postalCode`}>Postal code</label>
        <input id={`${prefix}-postalCode`} className="vco-input" type="text" value={addr.postalCode || ""} onChange={set("postalCode")} placeholder="1015 DX" />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-city`}>City</label>
        <input id={`${prefix}-city`} className="vco-input" type="text" value={addr.city || ""} onChange={set("city")} placeholder="Amsterdam" />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-country`}>Country</label>
        <select id={`${prefix}-country`} className="vco-input vco-input--select" value={addr.country || "NL"} onChange={set("country")}>
          {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
    </div>
  );
}

/**
 * Collects everything Stripe needs to prefill Connect Express onboarding, except the
 * ID document photo and the raw IBAN. IBAN is tokenized client-side on blur via
 * Stripe.js — only the resulting token id + last 4 digits ever reach `onChange`/the
 * parent form, so the raw account number never touches our server or any draft
 * persisted to sessionStorage.
 *
 * `value` mirrors the server's payoutRegistration shape (entityType, legalName,
 * dateOfBirth, nationality, address, companyLegalName, representative,
 * bankAccountHolderName) plus companyRegistrationNumber/vatNumber passed alongside it.
 */
export default function PayoutRegistrationForm({ value, onChange, companyRegistrationNumber, vatNumber, onChangeCompanyFields }) {
  const reg = value || {};
  const isCompany = reg.entityType === "company";
  const [iban, setIban] = useState("");
  const [ibanStatus, setIbanStatus] = useState(reg.ibanLast4 ? "saved" : "idle"); // idle | checking | saved | error
  const [ibanError, setIbanError] = useState("");

  const patch = (fields) => onChange({ ...reg, ...fields });
  const set = (field) => (e) => patch({ [field]: e.target.value });

  async function tokenizeIban() {
    if (!iban.trim()) return;
    setIbanStatus("checking");
    setIbanError("");
    const stripe = await getStripePromise();
    if (!stripe) {
      setIbanStatus("error");
      setIbanError("Secure payments are not configured right now — try again shortly.");
      return;
    }
    const { token, error } = await stripe.createToken("bank_account", {
      country: reg.address?.country || "NL",
      currency: "eur",
      account_holder_name: reg.bankAccountHolderName || undefined,
      account_holder_type: isCompany ? "company" : "individual",
      account_number: iban.replace(/\s+/g, ""),
    });
    if (error) {
      setIbanStatus("error");
      setIbanError(error.message || "That IBAN could not be verified.");
      return;
    }
    setIbanStatus("saved");
    setIban(""); // the raw number is discarded — only the token/last4 are kept
    patch({ stripeBankToken: token.id, ibanLast4: token.bank_account?.last4 || "" });
  }

  return (
    <div className="vco-apply-form__section">
      <div className="vco-field">
        <div className="vco-label-row">
          <label className="vco-label">How are you registered? *</label>
          <FieldHelp text="This determines what Stripe (our payment partner) needs to verify you and route your payouts correctly." />
        </div>
        <div className="vco-applicant-type-grid">
          {[
            { value: "individual", icon: "🧑", title: "Sole trader / freelancer", desc: "No registered company — you trade under your own name." },
            { value: "company", icon: "🏢", title: "Registered company", desc: "You have a KvK (Chamber of Commerce) registration." },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`vco-applicant-type-card${reg.entityType === opt.value ? " vco-applicant-type-card--selected" : ""}`}
              onClick={() => patch({ entityType: opt.value })}
            >
              <span className="vco-applicant-type-card__icon">{opt.icon}</span>
              <span className="vco-applicant-type-card__title">{opt.title}</span>
              <span className="vco-applicant-type-card__desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {reg.entityType && (
        <div className="vco-apply-form__payout-fields">
          <p className="vco-apply-form__subsection-label">
            {isCompany ? "Company details" : "Your identity details"}
          </p>

          {isCompany && (
            <div className="vco-field-grid">
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="companyLegalName">Legal company name *</label>
                  <FieldHelp text="The registered name on your KvK extract — may differ from your shop's display name." example="De Groene Winkel B.V." />
                </div>
                <input id="companyLegalName" className="vco-input" type="text" value={reg.companyLegalName || ""} onChange={set("companyLegalName")} required />
              </div>
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="companyReg2">KvK number *</label>
                  <FieldHelp text="Your 8-digit Chamber of Commerce number. Find it on your KvK extract or at kvk.nl/zoeken." example="68750110" />
                </div>
                <input id="companyReg2" className="vco-input" type="text" value={companyRegistrationNumber || ""} onChange={(e) => onChangeCompanyFields({ companyRegistrationNumber: e.target.value })} maxLength={100} required />
              </div>
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="vatNumber2">VAT number</label>
                  <FieldHelp text="Starts with NL, ends in B + 2 digits. On your KvK extract or tax correspondence. Leave blank if VAT-exempt." example="NL123456789B01" />
                </div>
                <input id="vatNumber2" className="vco-input" type="text" value={vatNumber || ""} onChange={(e) => onChangeCompanyFields({ vatNumber: e.target.value })} maxLength={50} />
              </div>
            </div>
          )}

          <p className="vco-apply-form__subsection-label">
            {isCompany ? "The person managing this account (usually you)" : null}
          </p>

          <div className="vco-field-grid">
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="legalName">Legal full name *</label>
                <FieldHelp text="Your name exactly as it appears on your ID document — not a nickname or trade name." example="Fatima El Amrani" />
              </div>
              <input
                id="legalName"
                className="vco-input"
                type="text"
                value={isCompany ? (reg.representative?.legalName || "") : (reg.legalName || "")}
                onChange={(e) => isCompany
                  ? patch({ representative: { ...reg.representative, legalName: e.target.value } })
                  : patch({ legalName: e.target.value })}
                required
              />
            </div>
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="dob">Date of birth *</label>
                <FieldHelp text="Used only for identity verification with our payment partner, Stripe. Never shown publicly." />
              </div>
              <input
                id="dob"
                className="vco-input"
                type="date"
                value={String((isCompany ? reg.representative?.dateOfBirth : reg.dateOfBirth) || "").slice(0, 10)}
                onChange={(e) => isCompany
                  ? patch({ representative: { ...reg.representative, dateOfBirth: e.target.value } })
                  : patch({ dateOfBirth: e.target.value })}
                required
              />
            </div>
            {!isCompany && (
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="nationality">Nationality</label>
                  <FieldHelp text="As shown on your ID document." example="Dutch" />
                </div>
                <input id="nationality" className="vco-input" type="text" value={reg.nationality || ""} onChange={set("nationality")} />
              </div>
            )}
          </div>

          <div className="vco-field">
            <div className="vco-label-row">
              <label className="vco-label">{isCompany ? "Representative's address *" : "Home address *"}</label>
              <FieldHelp text="Where you're registered to live — must match your ID document, not your shop's address." example="Prinsengracht 12, 1015 DX Amsterdam" />
            </div>
            <AddressFields
              prefix="home-address"
              value={isCompany ? reg.representative?.address : reg.address}
              onChange={(addr) => isCompany
                ? patch({ representative: { ...reg.representative, address: addr } })
                : patch({ address: addr })}
            />
          </div>

          <p className="vco-apply-form__subsection-label">Payout bank account</p>
          <div className="vco-field-grid">
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="bankHolder">Account holder name *</label>
                <FieldHelp text="Must match the legal name above exactly, or Stripe will reject the account." />
              </div>
              <input id="bankHolder" className="vco-input" type="text" value={reg.bankAccountHolderName || ""} onChange={set("bankAccountHolderName")} required />
            </div>
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="iban">IBAN *</label>
                <FieldHelp text="Your business or personal bank account. We never store the full number — only Stripe does." example="NL91 ABNA 0417 1643 00" />
              </div>
              <input
                id="iban"
                className="vco-input"
                type="text"
                value={ibanStatus === "saved" ? `•••• •••• ${reg.ibanLast4}` : iban}
                onChange={(e) => { setIban(e.target.value); setIbanStatus("idle"); }}
                onBlur={tokenizeIban}
                placeholder="NL91 ABNA 0417 1643 00"
                disabled={ibanStatus === "checking"}
                required={ibanStatus !== "saved"}
              />
              {ibanStatus === "checking" && <span className="vco-field__hint">Verifying with Stripe…</span>}
              {ibanStatus === "saved" && <span className="vco-field__hint">Verified ✓ — click to enter a different account</span>}
              {ibanStatus === "error" && <p className="vco-apply-form__error">{ibanError}</p>}
            </div>
          </div>

          <p className="vco-payout-note">
            💡 That's everything we need. After approval, you'll complete one last step directly with Stripe —
            a photo of your ID — and everything else here will already be filled in for you.
          </p>
        </div>
      )}
    </div>
  );
}
