import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { apiFetch } from "../../utils/api.js";
import LoginBreadcrumbSection from "./LoginBreadcrumbSection.jsx";
import LoginCtaSection from "./LoginCtaSection.jsx";
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
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: trimmedPassword })
      });
      setSuccess({ message: data.message });
    } catch (err) {
      setError(err.message || "Could not reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="login-navbar-top">
      <LoginBreadcrumbSection mode="login" />
      <section className="login-form-section" aria-labelledby="reset-password-title">
        <div className="login-form-section__card">
          <header className="login-form-section__header">
            <h2 id="reset-password-title" className="login-form-section__title">
              Reset Password
            </h2>
            <p className="login-form-section__intro">Choose a new password for your account.</p>
          </header>

          {!token ? (
            <p className="login-form-section__error" role="alert">
              This reset link is invalid or has expired.{" "}
              <Link to="/my-account" state={{ authMode: "forgot-password" }}>
                Request a new link
              </Link>
              .
            </p>
          ) : success ? (
            <div className="login-form-section__success" role="status">
              <h3>Password updated</h3>
              <p>{success.message}</p>
              <Link className="login-form-section__switch-mode" to="/my-account">
                <FaLock aria-hidden />
                Log In
              </Link>
            </div>
          ) : (
            <form className="login-form-section__form" onSubmit={handleSubmit} noValidate>
              <PasswordField
                id="reset-password"
                name="password"
                label="New Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
              />

              <PasswordField
                id="reset-confirm-password"
                name="confirmPassword"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((visible) => !visible)}
              />

              {error ? (
                <p className="login-form-section__error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="login-form-section__submit" disabled={isSubmitting}>
                <FaLock aria-hidden />
                {isSubmitting ? "Updating…" : "Update Password"}
              </button>

              <Link
                className="login-form-section__switch-mode"
                to="/my-account"
                state={{ authMode: "forgot-password" }}
              >
                Request a new reset link
              </Link>
            </form>
          )}
        </div>
      </section>
      <LoginCtaSection />
    </div>
  );
}
