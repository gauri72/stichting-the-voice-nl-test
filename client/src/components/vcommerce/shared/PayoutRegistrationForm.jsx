import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getVCommerceStripePromise } from "../../../utils/stripeClient.js";
import FieldHelp from "./FieldHelp.jsx";

const COUNTRY_CODES = ["NL", "BE", "DE"];

function AddressFields({ prefix, value, onChange }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const addr = value || {};
  const set = (field) => (e) => onChange({ ...addr, [field]: e.target.value });
  return (
    <div className="vco-field-grid">
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-street`}>{t("vcommercePortal:payoutForm.address.street.label")}</label>
        <input id={`${prefix}-street`} className="vco-input" type="text" value={addr.street || ""} onChange={set("street")} placeholder={t("vcommercePortal:payoutForm.address.street.placeholder")} />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-houseNumber`}>{t("vcommercePortal:payoutForm.address.houseNumber.label")}</label>
        <input id={`${prefix}-houseNumber`} className="vco-input" type="text" value={addr.houseNumber || ""} onChange={set("houseNumber")} placeholder={t("vcommercePortal:payoutForm.address.houseNumber.placeholder")} />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-postalCode`}>{t("vcommercePortal:payoutForm.address.postalCode.label")}</label>
        <input id={`${prefix}-postalCode`} className="vco-input" type="text" value={addr.postalCode || ""} onChange={set("postalCode")} placeholder={t("vcommercePortal:payoutForm.address.postalCode.placeholder")} />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-city`}>{t("vcommercePortal:payoutForm.address.city.label")}</label>
        <input id={`${prefix}-city`} className="vco-input" type="text" value={addr.city || ""} onChange={set("city")} placeholder={t("vcommercePortal:payoutForm.address.city.placeholder")} />
      </div>
      <div className="vco-field">
        <label className="vco-label" htmlFor={`${prefix}-country`}>{t("vcommercePortal:payoutForm.address.country.label")}</label>
        <select id={`${prefix}-country`} className="vco-input vco-input--select" value={addr.country || "NL"} onChange={set("country")}>
          {COUNTRY_CODES.map((code) => <option key={code} value={code}>{t(`vcommercePortal:payoutForm.countries.${code}`)}</option>)}
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
  const { t } = useTranslation(["vcommercePortal"]);
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
    const stripe = await getVCommerceStripePromise();
    if (!stripe) {
      setIbanStatus("error");
      setIbanError(t("vcommercePortal:payoutForm.errors.stripeNotConfigured"));
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
      setIbanError(error.message || t("vcommercePortal:payoutForm.errors.ibanVerificationFailed"));
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
          <label className="vco-label">{t("vcommercePortal:payoutForm.entityQuestion.label")}</label>
          <FieldHelp text={t("vcommercePortal:payoutForm.entityQuestion.help")} />
        </div>
        <div className="vco-applicant-type-grid">
          {[
            { value: "individual", icon: "🧑", title: t("vcommercePortal:payoutForm.entityOptions.individual.title"), desc: t("vcommercePortal:payoutForm.entityOptions.individual.desc") },
            { value: "company", icon: "🏢", title: t("vcommercePortal:payoutForm.entityOptions.company.title"), desc: t("vcommercePortal:payoutForm.entityOptions.company.desc") },
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
            {isCompany ? t("vcommercePortal:payoutForm.companyDetailsLabel") : t("vcommercePortal:payoutForm.identityDetailsLabel")}
          </p>

          {isCompany && (
            <div className="vco-field-grid">
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="companyLegalName">{t("vcommercePortal:payoutForm.companyLegalName.label")}</label>
                  <FieldHelp text={t("vcommercePortal:payoutForm.companyLegalName.help")} example={t("vcommercePortal:payoutForm.companyLegalName.example")} />
                </div>
                <input id="companyLegalName" className="vco-input" type="text" value={reg.companyLegalName || ""} onChange={set("companyLegalName")} required />
              </div>
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="companyReg2">{t("vcommercePortal:payoutForm.kvkNumber.label")}</label>
                  <FieldHelp text={t("vcommercePortal:payoutForm.kvkNumber.help")} example={t("vcommercePortal:payoutForm.kvkNumber.example")} />
                </div>
                <input id="companyReg2" className="vco-input" type="text" value={companyRegistrationNumber || ""} onChange={(e) => onChangeCompanyFields({ companyRegistrationNumber: e.target.value })} maxLength={100} required />
              </div>
              <div className="vco-field">
                <div className="vco-label-row">
                  <label className="vco-label" htmlFor="vatNumber2">{t("vcommercePortal:payoutForm.vatNumber.label")}</label>
                  <FieldHelp text={t("vcommercePortal:payoutForm.vatNumber.help")} example={t("vcommercePortal:payoutForm.vatNumber.example")} />
                </div>
                <input id="vatNumber2" className="vco-input" type="text" value={vatNumber || ""} onChange={(e) => onChangeCompanyFields({ vatNumber: e.target.value })} maxLength={50} />
              </div>
            </div>
          )}

          <p className="vco-apply-form__subsection-label">
            {isCompany ? t("vcommercePortal:payoutForm.representativeLabel") : null}
          </p>

          <div className="vco-field-grid">
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="legalName">{t("vcommercePortal:payoutForm.legalName.label")}</label>
                <FieldHelp text={t("vcommercePortal:payoutForm.legalName.help")} example={t("vcommercePortal:payoutForm.legalName.example")} />
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
                <label className="vco-label" htmlFor="dob">{t("vcommercePortal:payoutForm.dob.label")}</label>
                <FieldHelp text={t("vcommercePortal:payoutForm.dob.help")} />
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
                  <label className="vco-label" htmlFor="nationality">{t("vcommercePortal:payoutForm.nationality.label")}</label>
                  <FieldHelp text={t("vcommercePortal:payoutForm.nationality.help")} example={t("vcommercePortal:payoutForm.nationality.example")} />
                </div>
                <input id="nationality" className="vco-input" type="text" value={reg.nationality || ""} onChange={set("nationality")} />
              </div>
            )}
          </div>

          <div className="vco-field">
            <div className="vco-label-row">
              <label className="vco-label">{isCompany ? t("vcommercePortal:payoutForm.addressSection.representativeLabel") : t("vcommercePortal:payoutForm.addressSection.homeLabel")}</label>
              <FieldHelp text={t("vcommercePortal:payoutForm.addressSection.help")} example={t("vcommercePortal:payoutForm.addressSection.example")} />
            </div>
            <AddressFields
              prefix="home-address"
              value={isCompany ? reg.representative?.address : reg.address}
              onChange={(addr) => isCompany
                ? patch({ representative: { ...reg.representative, address: addr } })
                : patch({ address: addr })}
            />
          </div>

          <p className="vco-apply-form__subsection-label">{t("vcommercePortal:payoutForm.bankSectionLabel")}</p>
          <div className="vco-field-grid">
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="bankHolder">{t("vcommercePortal:payoutForm.bankHolder.label")}</label>
                <FieldHelp text={t("vcommercePortal:payoutForm.bankHolder.help")} />
              </div>
              <input id="bankHolder" className="vco-input" type="text" value={reg.bankAccountHolderName || ""} onChange={set("bankAccountHolderName")} required />
            </div>
            <div className="vco-field">
              <div className="vco-label-row">
                <label className="vco-label" htmlFor="iban">{t("vcommercePortal:payoutForm.iban.label")}</label>
                <FieldHelp text={t("vcommercePortal:payoutForm.iban.help")} example={t("vcommercePortal:payoutForm.iban.example")} />
              </div>
              <input
                id="iban"
                className="vco-input"
                type="text"
                value={ibanStatus === "saved" ? `•••• •••• ${reg.ibanLast4}` : iban}
                onChange={(e) => { setIban(e.target.value); setIbanStatus("idle"); }}
                onBlur={tokenizeIban}
                placeholder={t("vcommercePortal:payoutForm.iban.placeholder")}
                disabled={ibanStatus === "checking"}
                required={ibanStatus !== "saved"}
              />
              {ibanStatus === "checking" && <span className="vco-field__hint">{t("vcommercePortal:payoutForm.ibanStatus.verifying")}</span>}
              {ibanStatus === "saved" && <span className="vco-field__hint">{t("vcommercePortal:payoutForm.ibanStatus.verified")}</span>}
              {ibanStatus === "error" && <p className="vco-apply-form__error">{ibanError}</p>}
            </div>
          </div>

          <p className="vco-payout-note">
            {t("vcommercePortal:payoutForm.payoutNote")}
          </p>
        </div>
      )}
    </div>
  );
}
