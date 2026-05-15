import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import "../../styles/login-form-section.css";

export default function LoginFormSection() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <section className="login-form-section" aria-labelledby="login-form-title">
      <div className="login-form-section__card">
        <header className="login-form-section__header">
          <h2 id="login-form-title" className="login-form-section__title">
            Log In
          </h2>
          <p className="login-form-section__intro">
            Please enter your credentials to access your account.
          </p>
        </header>

        <form className="login-form-section__form" onSubmit={handleSubmit} noValidate>
          <div className="login-form-section__field">
            <label htmlFor="login-email">Email Address</label>
            <div className="login-form-section__input-wrap">
              <FaEnvelope className="login-form-section__input-icon" aria-hidden />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="john.doe@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-form-section__field">
            <label htmlFor="login-password">Password</label>
            <div className="login-form-section__input-wrap">
              <FaLock className="login-form-section__input-icon" aria-hidden />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="login-form-section__toggle-password"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
              </button>
            </div>
          </div>

          <div className="login-form-section__row">
            <label className="login-form-section__remember">
              <input
                type="checkbox"
                name="remember"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <Link className="login-form-section__forgot" to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="login-form-section__submit">
            <FaLock aria-hidden />
            Log In
          </button>

          <div className="login-form-section__divider" role="separator" aria-label="or">
            <span>OR</span>
          </div>

          <Link className="login-form-section__create-account" to="/membership">
            <FaUser aria-hidden />
            Create New Account
          </Link>
        </form>

        <p className="login-form-section__legal">
          By logging in, you agree to our{" "}
          <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}
