import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import CaptchaField from "../common/CaptchaField.jsx";
import { useCaptcha } from "../../hooks/useCaptcha.js";
import { apiFetch } from "../../utils/api.js";
import { CAPTCHA_REQUIRED_MESSAGE } from "../../utils/captcha.js";
import LoginBreadcrumbSection from "./LoginBreadcrumbSection.jsx";
import LoginCtaSection from "./LoginCtaSection.jsx";
import "../../styles/login-page.css";
import "../../styles/login-form-section.css";

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  showPassword,
  onToggle
}) {
  const { t } = useTranslation(["auth"]);
  return (
    <div className="login-form-section__field">
      <label htmlFor={id}>{label}</label>
      <div className="login-form-section__input-wrap">
        <FaLock className="login-form-section__input-icon" aria-hidden />
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          className="login-form-section__toggle-password"
          onClick={onToggle}
          aria-label={showPassword ? t("auth:form.fields.hidePassword") : t("auth:form.fields.showPassword")}
        >
          {showPassword ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation(["auth"]);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const captcha = useCaptcha();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError(t("auth:resetPassword.errors.invalidToken"));
      return;
    }

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 8) {
      setError(t("auth:resetPassword.errors.tooShort"));
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError(t("auth:resetPassword.errors.mismatch"));
      return;
    }

    if (captcha.required && !captcha.token) {
      setError(CAPTCHA_REQUIRED_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: trimmedPassword,
          captchaToken: captcha.token
        })
      });
      setSuccess({ message: data.message });
    } catch (err) {
      setError(err.message || t("auth:resetPassword.errors.failed"));
    } finally {
      captcha.reset();
      setIsSubmitting(false);
    }
  }

  return (
    <div id="login-navbar-top" className="login-page-shell">
      <LoginBreadcrumbSection mode="login" />
      <section className="login-form-section" aria-labelledby="reset-password-title">
        <div className="login-form-section__card">
          <header className="login-form-section__header">
            <h2 id="reset-password-title" className="login-form-section__title">
              {t("auth:resetPassword.title")}
            </h2>
            <p className="login-form-section__intro">{t("auth:resetPassword.intro")}</p>
          </header>

          {!token ? (
            <p className="login-form-section__error" role="alert">
              {t("auth:resetPassword.invalidLink")}{" "}
              <Link to="/my-account" state={{ authMode: "forgot-password" }}>
                {t("auth:resetPassword.requestNewLink")}
              </Link>
              .
            </p>
          ) : success ? (
            <div className="login-form-section__success" role="status">
              <h3>{t("auth:resetPassword.updated")}</h3>
              <p>{success.message}</p>
              <Link className="login-form-section__switch-mode" to="/my-account">
                <FaLock aria-hidden />
                {t("auth:form.buttons.logIn")}
              </Link>
            </div>
          ) : (
            <form className="login-form-section__form" onSubmit={handleSubmit} noValidate>
              <PasswordField
                id="reset-password"
                name="password"
                label={t("auth:resetPassword.newPassword")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth:resetPassword.newPasswordPlaceholder")}
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
              />

              <PasswordField
                id="reset-confirm-password"
                name="confirmPassword"
                label={t("auth:form.fields.confirmPassword")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t("auth:resetPassword.confirmNewPasswordPlaceholder")}
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((visible) => !visible)}
              />

              {error ? (
                <p className="login-form-section__error" role="alert">
                  {error}
                </p>
              ) : null}

              <CaptchaField captcha={captcha} className="login-form-section__captcha" />

              <button type="submit" className="login-form-section__submit" disabled={isSubmitting}>
                <FaLock aria-hidden />
                {isSubmitting ? t("auth:resetPassword.updating") : t("auth:resetPassword.updatePassword")}
              </button>

              <Link
                className="login-form-section__switch-mode"
                to="/my-account"
                state={{ authMode: "forgot-password" }}
              >
                {t("auth:resetPassword.requestNewResetLink")}
              </Link>
            </form>
          )}
        </div>
      </section>
      <LoginCtaSection />
    </div>
  );
}
