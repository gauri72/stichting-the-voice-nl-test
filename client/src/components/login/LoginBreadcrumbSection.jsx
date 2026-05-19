import heroBackground from "../../assets/Log In/hero-bg.png";
import "../../styles/login-breadcrumb-section.css";

export default function LoginBreadcrumbSection({ mode = "login" }) {
  const isSignUp = mode === "signup";
  const isForgotPassword = mode === "forgot-password";

  return (
    <section
      className="login-page-hero"
      aria-labelledby="login-hero-title"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="login-page-hero__container">
        <h1 id="login-hero-title">
          {isSignUp ? (
            <>
              <span className="login-page-hero__title-line">Join Us Today!</span>
              <span className="login-page-hero__title-gradient">Create your account</span>
            </>
          ) : isForgotPassword ? (
            <>
              <span className="login-page-hero__title-line">Forgot Password?</span>
              <span className="login-page-hero__title-gradient">We will help you reset it</span>
            </>
          ) : (
            <>
              <span className="login-page-hero__title-line">Welcome Back!</span>
              <span className="login-page-hero__title-gradient">Sign in to your account</span>
            </>
          )}
        </h1>
        <p className="login-page-hero__intro">
          {isSignUp
            ? "Create an account to manage memberships, donations, event registrations, and your profile."
            : isForgotPassword
              ? "Enter your email and we will send you a link to choose a new password."
              : "Access your memberships, donations, event registrations and update your account details."}
        </p>
      </div>
    </section>
  );
}
