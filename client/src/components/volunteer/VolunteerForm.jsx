import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPaperPlane } from "react-icons/fa6";
import { apiFetch } from "../../utils/api.js";
import { useCaptcha } from "../../hooks/useCaptcha.js";
import { CAPTCHA_REQUIRED_MESSAGE } from "../../utils/captcha.js";
import CaptchaField from "../common/CaptchaField.jsx";

function FormNotice({ message, variant = "success" }) {
  if (!message) return null;
  return (
    <p
      className={`volunteer-form__notice${variant === "error" ? " volunteer-form__notice--error" : ""}`}
      role="status"
    >
      {message}
    </p>
  );
}

export default function VolunteerForm() {
  const { t } = useTranslation(["misc"]);
  const [status, setStatus] = useState({ text: "", variant: "success" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const captcha = useCaptcha();

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ text: "", variant: "success" });

    if (captcha.required && !captcha.token) {
      setStatus({ text: CAPTCHA_REQUIRED_MESSAGE, variant: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const data = Object.fromEntries(new FormData(event.target).entries());
      await apiFetch("/api/contact/volunteer", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          captchaToken: captcha.token
        })
      });
      setSubmitted(true);
    } catch (error) {
      setStatus({
        text: error.message || t("misc:volunteer.errorGeneric"),
        variant: "error"
      });
    } finally {
      captcha.reset();
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="volunteer-form__success" role="status">
        <p className="volunteer-form__success-message">
          {t("misc:volunteer.successMessage")}
        </p>
      </div>
    );
  }

  return (
    <form className="volunteer-form" onSubmit={handleSubmit} noValidate>
      <div className="volunteer-form__row volunteer-form__row--split">
        <label className="volunteer-form__field">
          <span className="visually-hidden">{t("misc:volunteer.fullName")}</span>
          <input
            type="text"
            name="name"
            placeholder={t("misc:volunteer.fullNamePlaceholder")}
            required
            autoComplete="name"
            disabled={submitting}
          />
        </label>
        <label className="volunteer-form__field">
          <span className="visually-hidden">{t("misc:volunteer.email")}</span>
          <input
            type="email"
            name="email"
            placeholder={t("misc:volunteer.emailPlaceholder")}
            required
            autoComplete="email"
            disabled={submitting}
          />
        </label>
      </div>

      <label className="volunteer-form__field">
        <span className="visually-hidden">{t("misc:volunteer.phone")}</span>
        <input
          type="tel"
          name="phone"
          placeholder={t("misc:volunteer.phonePlaceholder")}
          autoComplete="tel"
          disabled={submitting}
        />
      </label>

      <label className="volunteer-form__field">
        <span className="visually-hidden">{t("misc:volunteer.message")}</span>
        <textarea
          name="message"
          rows={6}
          placeholder={t("misc:volunteer.messagePlaceholder")}
          required
          disabled={submitting}
        />
      </label>

      <CaptchaField captcha={captcha} className="volunteer-form__captcha" />

      <button type="submit" className="volunteer-form__submit" disabled={submitting}>
        <FaPaperPlane aria-hidden />
        {submitting ? t("misc:volunteer.sending") : t("misc:volunteer.submit")}
      </button>

      <FormNotice message={status.text} variant={status.variant} />
    </form>
  );
}
