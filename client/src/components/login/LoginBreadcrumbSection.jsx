import heroBackground from "../../assets/Log In/hero-bg.png";
import "../../styles/login-breadcrumb-section.css";

export default function LoginBreadcrumbSection() {
  return (
    <section
      className="login-page-hero"
      aria-labelledby="login-hero-title"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="login-page-hero__container">
        <h1 id="login-hero-title">
          <span className="login-page-hero__title-line">Welcome Back!</span>
          <span className="login-page-hero__title-gradient">Sign in to your account</span>
        </h1>
        <p className="login-page-hero__intro">
          Access your memberships, donations, event registrations and update your account details.
        </p>
      </div>
    </section>
  );
}
