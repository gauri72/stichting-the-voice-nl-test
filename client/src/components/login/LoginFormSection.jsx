import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { apiFetch, getRememberedEmail, setRememberedEmail } from "../../utils/api.js";
import GoogleSignInButton, { isGoogleSignInEnabled } from "./GoogleSignInButton.jsx";
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
  const isForgotPassword = mode === "forgot-password";
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

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  useEffect(() => {
    if (isSignUp) {
      setSignUpError("");
      setHasSignUpAttempt(false);
    }
  }, [isSignUp]);

  useEffect(() => {
    if (!isForgotPassword) return;
    setForgotError("");
    setForgotSuccess(null);
  }, [isForgotPassword]);

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  function clearSignUpFeedback() {
    setSignUpError("");
    setHasSignUpAttempt(false);
    setSignUpSuccess(null);
    setOtp("");
    setOtpError("");
  }

  function clearForgotFeedback() {
    setForgotError("");
    setForgotSuccess(null);
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
      await loginWithToken(data.token, data.user, true);
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

  async function handleGoogleSignIn(credential) {
    setLoginError("");
    setSignUpError("");
    setIsGoogleSigningIn(true);

    const useRememberMe = isSignUp ? true : rememberMe;

    try {
      const data = await apiFetch("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential, rememberMe: useRememberMe })
      });
      if (data.user?.email) {
        setRememberedEmail(data.user.email, useRememberMe);
      }
      await loginWithToken(data.token, data.user, useRememberMe);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error.message || "Google sign-in failed. Please try again.";
      if (isSignUp) {
        setSignUpError(message);
        setHasSignUpAttempt(true);
      } else {
        setLoginError(message);
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  }

  function renderOrDivider() {
    return (
      <div className="login-form-section__divider" role="separator" aria-label="or">
        <span>OR</span>
      </div>
    );
  }

  function renderSocialAuth() {
    if (!isGoogleSignInEnabled()) {
      return null;
    }

    return (
      <div className="login-form-section__social-block">
        <div
          className="login-form-section__divider login-form-section__divider--subtle"
          role="separator"
          aria-label="or continue with"
        >
          <span>or continue with</span>
        </div>
        <GoogleSignInButton
          disabled={isGoogleSigningIn}
          onSuccess={handleGoogleSignIn}
          onError={(message) => {
            if (isSignUp) {
              setSignUpError(message);
              setHasSignUpAttempt(true);
            } else {
              setLoginError(message);
            }
          }}
        />
      </div>
    );
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
      setRememberedEmail(email.trim(), rememberMe);
      await loginWithToken(data.token, data.user, rememberMe);
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

  async function handleForgotSubmit(event) {
    event.preventDefault();
    setForgotError("");
    setIsSubmittingForgot(true);

    try {
      const data = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      setForgotSuccess({
        message: data.message,
        devResetUrl: data.devResetUrl
      });
    } catch (error) {
      setForgotError(error.message || "Could not send reset email. Please try again.");
    } finally {
      setIsSubmittingForgot(false);
    }
  }

  function switchToSignUp(event) {
    event.preventDefault();
    event.stopPropagation();
    skipNextSignUpSubmitRef.current = true;
    clearSignUpFeedback();
    clearForgotFeedback();
    onModeChange?.("signup");
  }

  function switchToLogin(event) {
    event.preventDefault();
    event.stopPropagation();
    clearSignUpFeedback();
    clearForgotFeedback();
    onModeChange?.("login");
  }

  function switchToForgotPassword(event) {
    event.preventDefault();
    event.stopPropagation();
    clearForgotFeedback();
    setForgotEmail(email.trim() || forgotEmail);
    onModeChange?.("forgot-password");
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
            {isForgotPassword ? "Forgot Password" : isSignUp ? "Sign Up" : "Log In"}
          </h2>
          <p className="login-form-section__intro">
            {isForgotPassword
              ? "Enter your email address and we will send you a link to reset your password."
              : isSignUp
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
        ) : isForgotPassword && forgotSuccess ? (
          <div className="login-form-section__success" role="status">
            <h3>Check your email</h3>
            <p>{forgotSuccess.message}</p>
            {forgotSuccess.devResetUrl ? (
              <p className="login-form-section__dev-link">
                Dev mode (SMTP not configured):{" "}
                <a href={forgotSuccess.devResetUrl}>{forgotSuccess.devResetUrl}</a>
              </p>
            ) : null}
            <button type="button" className="login-form-section__switch-mode" onClick={switchToLogin}>
              <FaLock aria-hidden />
              Back to Log In
            </button>
          </div>
        ) : isForgotPassword ? (
          <form
            key="forgot-form"
            className="login-form-section__form"
            onSubmit={handleForgotSubmit}
            noValidate
          >
            <div className="login-form-section__field">
              <label htmlFor="forgot-email">Email Address</label>
              <div className="login-form-section__input-wrap">
                <FaEnvelope className="login-form-section__input-icon" aria-hidden />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="john.doe@email.com"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            {forgotError ? (
              <p className="login-form-section__error" role="alert">
                {forgotError}
              </p>
            ) : null}

            <button type="submit" className="login-form-section__submit" disabled={isSubmittingForgot}>
              <FaEnvelope aria-hidden />
              {isSubmittingForgot ? "Sending…" : "Send Reset Link"}
            </button>

            <button type="button" className="login-form-section__switch-mode" onClick={switchToLogin}>
              <FaLock aria-hidden />
              Back to Log In
            </button>
          </form>
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

            {renderSocialAuth()}
            {renderOrDivider()}

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
              <button
                type="button"
                className="login-form-section__forgot"
                onClick={switchToForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="login-form-section__submit" disabled={isLoggingIn}>
              <FaLock aria-hidden />
              {isLoggingIn ? "Logging in…" : "Log In"}
            </button>

            {renderSocialAuth()}
            {renderOrDivider()}

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
          ) : isForgotPassword ? (
            <>
              By requesting a reset, you agree to our{" "}
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
