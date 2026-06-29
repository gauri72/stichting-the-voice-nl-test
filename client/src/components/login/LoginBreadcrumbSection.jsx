import { useTranslation } from "react-i18next";
import heroBgLight from "../../assets/Home/hero-bg-light.png";
import heroBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import "../../styles/login-breadcrumb-section.css";

const MODE_KEYS = {
  login: "login",
  signup: "signup",
  "forgot-password": "forgotPassword",
};

export default function LoginBreadcrumbSection({ mode = "login" }) {
  const { t } = useTranslation(["auth"]);
  const modeKey = MODE_KEYS[mode] || MODE_KEYS.login;

  return (
    <>
      <BreadcrumbPageHeader
        ariaLabel="Log in or sign up"
        lightSrc={heroBgLight}
        darkSrc={heroBgDark}
        heroClassName="login-page-hero"
        fetchPriority="high"
        showVMark
      />

      <section className="login-hero" aria-labelledby="login-hero-title">
        <div className="login-hero__copy">
          <h1 id="login-hero-title" className="login-hero__title">
            {t(`auth:breadcrumb.${modeKey}.titleLead`)}{" "}
            <span className="login-grad-text">{t(`auth:breadcrumb.${modeKey}.titleAccent`)}</span>
          </h1>
          <p className="login-hero__intro">{t(`auth:breadcrumb.${modeKey}.intro`)}</p>
        </div>
      </section>
    </>
  );
}
