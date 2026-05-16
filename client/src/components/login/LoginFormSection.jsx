import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiFetch } from "../../utils/api.js";
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
  onToggle,
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

export default function LoginFormSection({ mode = "login", onModeChange }) {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const isSignUp = mode === "signup";
  const skipNextSignUpSubmitRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpError, setSignUpError] = useState("");
  const [hasSignUpAttempt, setHasSignUpAttempt] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  useEffect(() => {
    if (isSignUp) {
      setSignUpError("");
      setHasSignUpAttempt(false);
    }
  }, [isSignUp]);

  function clearSignUpFeedback() {
    setSignUpError("");
    setHasSignUpAttempt(false);
    setSignUpSuccess(null);
    setOtp("");
    setOtpError("");
  }

  async function handleVerifyOtpSubmit(event) {
    event.preventDefault();
    if (!signUpSuccess?.email) return;

    const trimmedOtp = otp.replace(/\D/g, "").slice(0, 6);
    if (trimmedOtp.length !== 6) {
      setOtpError("Please enter the 6-digit code from your email.");
      return;
    }

    setOtpError("");
    setIsVerifyingOtp(true);

    try {
      const data = await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: signUpSuccess.email, otp: trimmedOtp })
      });
      await loginWithToken(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setOtpError(error.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!signUpSuccess?.email || isResendingOtp) return;

    setOtpError("");
    setIsResendingOtp(true);

    try {
      const data = await apiFetch("/api/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email: signUpSuccess.email })
      });
      setSignUpSuccess((prev) => ({
        ...prev,
        message: data.message,
        devOtp: data.devOtp
      }));
      setOtp("");
    } catch (error) {
      setOtpError(error.message || "Could not resend code. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  }

  function handleOtpChange(event) {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(digitsOnly);
    if (otpError) setOtpError("");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe })
      });
      await loginWithToken(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginError(error.message || "Log in failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSignUpSubmit(event) {
    event.preventDefault();

    if (skipNextSignUpSubmitRef.current) {
      skipNextSignUpSubmitRef.current = false;
      return;
    }

    setHasSignUpAttempt(true);
    setSignUpError("");

    const trimmedPassword = createPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim()) {
      setSignUpError("Please fill in all fields.");
      return;
    }

    if (!trimmedPassword || !trimmedConfirm) {
      setSignUpError("Please enter and confirm your password.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setSignUpError("Passwords do not match. Please check and try again.");
      return;
    }

    if (trimmedPassword.length < 8) {
      setSignUpError("Password must be at least 8 characters long.");
      return;
    }

    setIsSigningUp(true);

    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: signUpEmail.trim(),
          password: trimmedPassword
        })
      });

      setSignUpSuccess({
        message: data.message,
        email: data.email,
        devOtp: data.devOtp
      });
      setOtp("");
      setOtpError("");
    } catch (error) {
      setSignUpError(error.message || "Could not create account. Please try again.");
    } finally {
      setIsSigningUp(false);
    }
  }

  function switchToSignUp(event) {
    event.preventDefault();
    event.stopPropagation();
    skipNextSignUpSubmitRef.current = true;
    clearSignUpFeedback();
    onModeChange?.("signup");
  }

  function switchToLogin(event) {
    event.preventDefault();
    event.stopPropagation();
    clearSignUpFeedback();
    onModeChange?.("login");
  }

  function handleCreatePasswordChange(event) {
    setCreatePassword(event.target.value);
    if (hasSignUpAttempt) setSignUpError("");
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);
    if (hasSignUpAttempt) setSignUpError("");
  }

  return (
    <section className="login-form-section" aria-labelledby="login-form-title">
      <div className="login-form-section__card">
        <header className="login-form-section__header">
          <h2 id="login-form-title" className="login-form-section__title">
            {isSignUp ? "Sign Up" : "Log In"}
          </h2>
          <p className="login-form-section__intro">
            {isSignUp
              ? "Fill in your details below to create your account."
              : "Please enter your credentials to access your account."}
          </p>
        </header>

        {isSignUp && signUpSuccess ? (
          <div className="login-form-section__success" role="status">
            <h3>Verify your email</h3>
            <p>{signUpSuccess.message}</p>
            <p>
              Enter the 6-digit code sent to <strong>{signUpSuccess.email}</strong>.
            </p>
            {signUpSuccess.devOtp ? (
              <p className="login-form-section__dev-link">
                Dev mode (SMTP not configured): your code is{" "}
                <strong>{signUpSuccess.devOtp}</strong>
              </p>
            ) : null}
            <form className="login-form-section__otp-form" onSubmit={handleVerifyOtpSubmit} noValidate>
              <div className="login-form-section__field">
                <label htmlFor="signup-otp">Verification code</label>
                <input
                  id="signup-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="login-form-section__otp-input"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  required
                />
              </div>
              {otpError ? (
                <p className="login-form-section__error" role="alert">
                  {otpError}
                </p>
              ) : null}
              <button type="submit" className="login-form-section__submit" disabled={isVerifyingOtp}>
                <FaEnvelope aria-hidden />
                {isVerifyingOtp ? "Verifying…" : "Verify & go to dashboard"}
              </button>
            </form>
            <button
              type="button"
              className="login-form-section__resend-otp"
              onClick={handleResendOtp}
              disabled={isResendingOtp}
            >
              {isResendingOtp ? "Sending new code…" : "Resend code"}
            </button>
            <button type="button" className="login-form-section__switch-mode" onClick={switchToLogin}>
              <FaLock aria-hidden />
              Back to Log In
            </button>
          </div>
        ) : isSignUp ? (
          <form
            key="signup-form"
            className="login-form-section__form"
            onSubmit={handleSignUpSubmit}
            noValidate
          >
            <div className="login-form-section__name-row">
              <div className="login-form-section__field">
                <label htmlFor="signup-first-name">First Name</label>
                <div className="login-form-section__input-wrap">
                  <FaUser className="login-form-section__input-icon" aria-hidden />
                  <input
                    id="signup-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="John"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-form-section__field">
                <label htmlFor="signup-last-name">Last Name</label>
                <div className="login-form-section__input-wrap">
                  <FaUser className="login-form-section__input-icon" aria-hidden />
                  <input
                    id="signup-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="login-form-section__field">
              <label htmlFor="signup-email">Email Address</label>
              <div className="login-form-section__input-wrap">
                <FaEnvelope className="login-form-section__input-icon" aria-hidden />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john.doe@email.com"
                  value={signUpEmail}
                  onChange={(event) => setSignUpEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <PasswordField
              id="signup-create-password"
              name="createPassword"
              label="Create Password"
              value={createPassword}
              onChange={handleCreatePasswordChange}
              placeholder="Create a password"
              autoComplete="new-password"
              showPassword={showCreatePassword}
              onToggle={() => setShowCreatePassword((visible) => !visible)}
            />

            <PasswordField
              id="signup-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
              showPassword={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((visible) => !visible)}
            />

            {hasSignUpAttempt && signUpError ? (
              <p className="login-form-section__error" role="alert">
                {signUpError}
              </p>
            ) : null}

            <button type="submit" className="login-form-section__submit" disabled={isSigningUp}>
              <FaUser aria-hidden />
              {isSigningUp ? "Sending verification…" : "Create New Account"}
            </button>

            <div className="login-form-section__divider" role="separator" aria-label="or">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="login-form-section__switch-mode"
              onClick={switchToLogin}
            >
              <FaLock aria-hidden />
              Log In
            </button>
          </form>
        ) : (
          <form
            key="login-form"
            className="login-form-section__form"
            onSubmit={handleLoginSubmit}
            noValidate
          >
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

            <PasswordField
              id="login-password"
              name="password"
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              showPassword={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
            />

            {loginError ? (
              <p className="login-form-section__error" role="alert">
                {loginError}
              </p>
            ) : null}

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

            <button type="submit" className="login-form-section__submit" disabled={isLoggingIn}>
              <FaLock aria-hidden />
              {isLoggingIn ? "Logging in…" : "Log In"}
            </button>

            <div className="login-form-section__divider" role="separator" aria-label="or">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="login-form-section__switch-mode"
              onClick={switchToSignUp}
            >
              <FaUser aria-hidden />
              Create New Account
            </button>
          </form>
        )}

        <p className="login-form-section__legal">
          {isSignUp ? (
            <>
              By creating an account, you agree to our{" "}
              <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and{" "}
              <Link to="/privacy-policy">Privacy Policy</Link>.
            </>
          ) : (
            <>
              By logging in, you agree to our{" "}
              <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> and{" "}
              <Link to="/privacy-policy">Privacy Policy</Link>.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
