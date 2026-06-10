import { useEffect, useState } from "react";

import { Navigate, useNavigate } from "react-router-dom";

import {

  IconEye,

  IconEyeOff,

  IconHeadset,

  IconLock,

  IconShieldCheck,

  IconUser,

} from "@tabler/icons-react";

import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";

import {

  apiFetch,

  getRememberedAdminEmail,

  setRememberedAdminEmail,

} from "../../utils/api.js";

import { ADMIN_LOGIN } from "../../data/adminLoginDisplay.js";

import ThemeToggle from "../layout/ThemeToggle.jsx";

import "../../styles/admin-login-page.css";



export default function AdminLoginPage() {

  const { admin, loading, loginWithAdminToken } = useAdminAuth();

  const navigate = useNavigate();



  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);



  useEffect(() => {

    const savedEmail = getRememberedAdminEmail();

    if (savedEmail) {

      setEmail(savedEmail);

      setRememberMe(true);

    }

  }, []);



  if (!loading && admin) {

    return <Navigate to="/admin/dashboard" replace />;

  }



  async function handleSubmit(event) {

    event.preventDefault();

    setError("");

    setIsSubmitting(true);



    try {

      const data = await apiFetch("/api/admin/login", {

        method: "POST",

        body: JSON.stringify({ email, password, rememberMe }),

      });

      setRememberedAdminEmail(email.trim(), rememberMe);

      await loginWithAdminToken(data.token, data.admin, rememberMe);

      navigate("/admin/dashboard", { replace: true });

    } catch (submitError) {

      setError(submitError.message || "Sign in failed. Please try again.");

    } finally {

      setIsSubmitting(false);

    }

  }



  const {

    heroBackground,

    brandMark,

    orgLineSmall,

    orgLineMain,

    orgTagline,

    titleLead,

    titleAccent,

    subtitle,

    emailLabel,

    emailPlaceholder,

    passwordLabel,

    passwordPlaceholder,

    rememberLabel,

    forgotLabel,

    signInLabel,

    securityKeyLabel,

    helpLead,

    helpLinkLabel,

    helpHref,

    copyright,

  } = ADMIN_LOGIN;



  return (

    <div className="admin-login-shell">

      <img

        className="admin-login-shell__bg"

        src={heroBackground}

        alt=""

        aria-hidden="true"

        decoding="async"

      />

      <div className="admin-login-shell__overlay" aria-hidden="true" />



      <div className="admin-login-shell__theme">

        <ThemeToggle />

      </div>



      <div className="admin-login-page">

        <header className="admin-login-brand">

          <div className="admin-login-brand__mark-wrap">

            <span className="admin-login-brand__mark">{brandMark}</span>

            <span className="admin-login-brand__dot" aria-hidden="true" />

          </div>

          <p className="admin-login-brand__small">{orgLineSmall}</p>

          <p className="admin-login-brand__main">

            <span>THE </span>

            <span className="admin-login-brand__voice">V.O.I.C.E.</span>

            <span> NL</span>

          </p>

          <p className="admin-login-brand__tagline">{orgTagline}</p>

        </header>



        <div className="admin-login-heading">

          <div className="admin-login-heading__icon-row" aria-hidden="true">

            <span className="admin-login-heading__line" />

            <span className="admin-login-heading__icon">

              <IconLock size={18} stroke={1.8} />

            </span>

            <span className="admin-login-heading__line" />

          </div>

          <h1 className="admin-login-heading__title">

            {titleLead} <span className="admin-login-heading__accent">{titleAccent}</span>

          </h1>

          <p className="admin-login-heading__subtitle">{subtitle}</p>

        </div>



        <div className="admin-login-card">

          <form className="admin-login-form" onSubmit={handleSubmit} noValidate>

            <div className="admin-login-form__field">

              <label htmlFor="admin-email">{emailLabel}</label>

              <div className="admin-login-form__input-wrap">

                <IconUser className="admin-login-form__input-icon" size={18} stroke={1.6} aria-hidden />

                <input

                  id="admin-email"

                  name="email"

                  type="email"

                  autoComplete="username"

                  placeholder={emailPlaceholder}

                  value={email}

                  onChange={(event) => setEmail(event.target.value)}

                  required

                  disabled={isSubmitting}

                />

              </div>

            </div>



            <div className="admin-login-form__field">

              <div className="admin-login-form__label-row">

                <label htmlFor="admin-password">{passwordLabel}</label>

                <span className="admin-login-form__forgot">{forgotLabel}</span>

              </div>

              <div className="admin-login-form__input-wrap">

                <IconLock className="admin-login-form__input-icon" size={18} stroke={1.6} aria-hidden />

                <input

                  id="admin-password"

                  name="password"

                  type={showPassword ? "text" : "password"}

                  autoComplete="current-password"

                  placeholder={passwordPlaceholder}

                  value={password}

                  onChange={(event) => setPassword(event.target.value)}

                  required

                  disabled={isSubmitting}

                />

                <button

                  type="button"

                  className="admin-login-form__toggle-password"

                  onClick={() => setShowPassword((prev) => !prev)}

                  aria-label={showPassword ? "Hide password" : "Show password"}

                >

                  {showPassword ? (

                    <IconEyeOff size={18} stroke={1.6} aria-hidden />

                  ) : (

                    <IconEye size={18} stroke={1.6} aria-hidden />

                  )}

                </button>

              </div>

            </div>



            <label className="admin-login-form__remember">

              <input

                type="checkbox"

                name="rememberMe"

                checked={rememberMe}

                onChange={(event) => setRememberMe(event.target.checked)}

                disabled={isSubmitting}

              />

              <span>{rememberLabel}</span>

            </label>



            {error ? (

              <p className="admin-login-form__error" role="alert">

                {error}

              </p>

            ) : null}



            <button type="submit" className="admin-login-form__submit" disabled={isSubmitting}>

              <IconLock size={16} stroke={1.8} aria-hidden />

              {isSubmitting ? "Signing in…" : signInLabel}

            </button>

          </form>



          <div className="admin-login-form__divider" role="separator" aria-label="or">

            <span />

            <span>OR</span>

            <span />

          </div>



          <button type="button" className="admin-login-form__security-key" disabled>

            <IconShieldCheck size={18} stroke={1.6} aria-hidden />

            {securityKeyLabel}

          </button>



          <p className="admin-login-form__support">

            <IconHeadset size={18} stroke={1.6} aria-hidden />

            <span>

              {helpLead}{" "}

              <a href={helpHref}>{helpLinkLabel}</a>

            </span>

          </p>

        </div>



        <footer className="admin-login-footer">

          <p>{copyright}</p>

        </footer>

      </div>

    </div>

  );

}


