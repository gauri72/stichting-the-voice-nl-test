import breadcrumbBgDark from "../../../assets/Dashboard/breadcrumb-bg-dark.png";
import breadcrumbBgLight from "../../../assets/Dashboard/breadcrumb-bg-light.png";
import { useTheme } from "../../../contexts/ThemeContext.jsx";

export default function ProfileHeroSection() {
  const { isDark } = useTheme();

  return (
    <section className="profile-hero" aria-labelledby="profile-hero-title">
      <img
        className="profile-hero__bg profile-hero__bg--light"
        src={breadcrumbBgLight}
        alt=""
        decoding="async"
      />
      <img
        className="profile-hero__bg profile-hero__bg--dark"
        src={breadcrumbBgDark}
        alt=""
        decoding="async"
      />
      <div className="profile-hero__overlay" aria-hidden />
      <div className="profile-hero__content">
        <h1
          id="profile-hero-title"
          className={`profile-hero__title${isDark ? "" : " profile-hero__title--gradient"}`}
        >
          My Profile
        </h1>
        <p className="profile-hero__subtitle">
          Manage your personal information, security settings and payment methods.
        </p>
      </div>
    </section>
  );
}
