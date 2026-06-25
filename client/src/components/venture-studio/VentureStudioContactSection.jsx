import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/venture-studio-contact-section.css";
import {
  FaBuilding,
  FaChevronRight,
  FaEnvelope,
  FaLocationDot,
  FaPaperPlane,
  FaPhone
} from "react-icons/fa6";
import { apiFetch } from "../../utils/api.js";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { useCaptcha } from "../../hooks/useCaptcha.js";
import { CAPTCHA_REQUIRED_MESSAGE } from "../../utils/captcha.js";
import CaptchaField from "../common/CaptchaField.jsx";

const DEFAULT_CONTACT_EMAIL = "info@stichtingthevoice.nl";

const CONTACT = {
  phone: "+31 6 19032104",
  phoneHref: "tel:+31619032104",
  addressLines: ["Wengehout 30,", "2719 KA Zoetermeer,", "The Netherlands"],
  kvk: "92180213"
};

function FormNotice({ message, variant = "success" }) {
  if (!message) return null;
  return (
    <p
      className={`vvs-contact__notice${variant === "error" ? " vvs-contact__notice--error" : ""}`}
      role="status"
    >
      {message}
    </p>
  );
}

function formDataFromForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export default function VentureStudioContactSection() {
  const { t } = useTranslation(["innovation"]);
  const SERVICE_OPTIONS = t("innovation:contact.serviceOptions", { returnObjects: true });
  const overrides = useContentOverrides();
  const phone = overrides.ventureContactPhone || CONTACT.phone;
  const phoneHref = overrides.ventureContactPhoneHref || CONTACT.phoneHref;
  const addressLines = overrides.ventureContactAddress
    ? overrides.ventureContactAddress.split("\n").filter(Boolean)
    : CONTACT.addressLines;
  const kvk = overrides.ventureContactKvk || CONTACT.kvk;
  const [contactEmail, setContactEmail] = useState(DEFAULT_CONTACT_EMAIL);
  const [messageStatus, setMessageStatus] = useState({ text: "", variant: "success" });
  const [quoteStatus, setQuoteStatus] = useState({ text: "", variant: "success" });
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const messageCaptcha = useCaptcha();
  const quoteCaptcha = useCaptcha();

  useEffect(() => {
    apiFetch("/api/public/site")
      .then((data) => {
        if (data?.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  async function handleMessageSubmit(e) {
    e.preventDefault();
    setMessageStatus({ text: "", variant: "success" });

    if (messageCaptcha.required && !messageCaptcha.token) {
      setMessageStatus({ text: CAPTCHA_REQUIRED_MESSAGE, variant: "error" });
      return;
    }

    setMessageSubmitting(true);

    try {
      const data = formDataFromForm(e.target);
      const result = await apiFetch("/api/contact/venture-studio/message", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          captchaToken: messageCaptcha.token
        })
      });
      setMessageStatus({ text: result.message, variant: "success" });
      e.target.reset();
    } catch (error) {
      setMessageStatus({
        text: error.message || t("innovation:contact.messageError"),
        variant: "error"
      });
    } finally {
      messageCaptcha.reset();
      setMessageSubmitting(false);
    }
  }

  async function handleQuoteSubmit(e) {
    e.preventDefault();
    setQuoteStatus({ text: "", variant: "success" });

    if (quoteCaptcha.required && !quoteCaptcha.token) {
      setQuoteStatus({ text: CAPTCHA_REQUIRED_MESSAGE, variant: "error" });
      return;
    }

    setQuoteSubmitting(true);

    try {
      const data = formDataFromForm(e.target);
      const result = await apiFetch("/api/contact/venture-studio/quote", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          captchaToken: quoteCaptcha.token
        })
      });
      setQuoteStatus({ text: result.message, variant: "success" });
      e.target.reset();
    } catch (error) {
      setQuoteStatus({
        text: error.message || t("innovation:contact.quoteError"),
        variant: "error"
      });
    } finally {
      quoteCaptcha.reset();
      setQuoteSubmitting(false);
    }
  }

  return (
    <section id="vvs-contact" className="vvs-contact" aria-labelledby="vvs-contact-heading">
      <div className="vvs-contact__inner">
        <h2 id="vvs-contact-heading" className="vvs-visually-hidden">
          {t("innovation:contact.heading")}
        </h2>

        <div className="vvs-contact__grid">
          <div className="vvs-contact__card vvs-contact__card--info">
            <h3 className="vvs-contact__card-title">{t("innovation:contact.infoTitle")}</h3>
            <ul className="vvs-contact__info-list">
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaEnvelope />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>{t("innovation:contact.email")}</strong>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaPhone />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>{t("innovation:contact.officePhone")}</strong>
                  <a href={phoneHref}>{phone}</a>
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaLocationDot />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>{t("innovation:contact.address")}</strong>
                  {addressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaBuilding />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>{t("innovation:contact.kvk")}</strong>
                  <span>{kvk}</span>
                </div>
              </li>
            </ul>
          </div>

          <form
            className="vvs-contact__card vvs-contact__card--form"
            onSubmit={handleMessageSubmit}
            noValidate
          >
            <h3 className="vvs-contact__card-title">{t("innovation:contact.messageFormTitle")}</h3>
            <div className="vvs-contact__row vvs-contact__row--split">
              <label className="vvs-contact__field">
                <span className="vvs-visually-hidden">{t("innovation:contact.fullName")}</span>
                <input
                  type="text"
                  name="name"
                  placeholder={t("innovation:contact.fullName")}
                  required
                  autoComplete="name"
                  disabled={messageSubmitting}
                />
              </label>
              <label className="vvs-contact__field">
                <span className="vvs-visually-hidden">{t("innovation:contact.emailAddress")}</span>
                <input
                  type="email"
                  name="email"
                  placeholder={t("innovation:contact.emailAddress")}
                  required
                  autoComplete="email"
                  disabled={messageSubmitting}
                />
              </label>
            </div>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">{t("innovation:contact.subject")}</span>
              <input
                type="text"
                name="subject"
                placeholder={t("innovation:contact.subject")}
                required
                disabled={messageSubmitting}
              />
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">{t("innovation:contact.yourMessage")}</span>
              <textarea
                name="message"
                rows={5}
                placeholder={t("innovation:contact.yourMessage")}
                required
                disabled={messageSubmitting}
              />
            </label>
            <CaptchaField captcha={messageCaptcha} className="vvs-contact__captcha" />
            <button type="submit" className="vvs-contact__btn" disabled={messageSubmitting}>
              <FaPaperPlane aria-hidden />
              {messageSubmitting ? t("innovation:contact.sending") : t("innovation:contact.sendMessage")}
            </button>
            <FormNotice message={messageStatus.text} variant={messageStatus.variant} />
          </form>

          <form
            className="vvs-contact__card vvs-contact__card--form vvs-contact__card--quote"
            onSubmit={handleQuoteSubmit}
            noValidate
          >
            <h3 className="vvs-contact__card-title">{t("innovation:contact.quoteFormTitle")}</h3>
            <p className="vvs-contact__card-lead">
              {t("innovation:contact.quoteLead")}
            </p>
            <label className="vvs-contact__field vvs-contact__field--select">
              <span className="vvs-visually-hidden">{t("innovation:contact.iNeedHelpWith")}</span>
              <select name="service" required defaultValue="" disabled={quoteSubmitting}>
                <option value="" disabled>
                  {t("innovation:contact.iNeedHelpWith")}
                </option>
                {Array.isArray(SERVICE_OPTIONS)
                  ? SERVICE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))
                  : null}
              </select>
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">{t("innovation:contact.projectType")}</span>
              <input
                type="text"
                name="projectType"
                placeholder={t("innovation:contact.projectType")}
                disabled={quoteSubmitting}
              />
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">{t("innovation:contact.timeline")}</span>
              <input
                type="text"
                name="timeline"
                placeholder={t("innovation:contact.timeline")}
                disabled={quoteSubmitting}
              />
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">{t("innovation:contact.projectDetails")}</span>
              <textarea
                name="details"
                rows={5}
                placeholder={t("innovation:contact.projectDetails")}
                required
                disabled={quoteSubmitting}
              />
            </label>
            <CaptchaField captcha={quoteCaptcha} className="vvs-contact__captcha" />
            <button type="submit" className="vvs-contact__btn" disabled={quoteSubmitting}>
              {quoteSubmitting ? t("innovation:contact.sending") : t("innovation:contact.requestQuote")}
              {!quoteSubmitting && <FaChevronRight aria-hidden />}
            </button>
            <FormNotice message={quoteStatus.text} variant={quoteStatus.variant} />
          </form>
        </div>
      </div>
    </section>
  );
}
