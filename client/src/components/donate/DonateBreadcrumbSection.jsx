import breadcrumbBgLight from "../../assets/Sponsorship/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../assets/Sponsorship/breadcrumb-bg-dark.png";
import "../../styles/donate-breadcrumb-section.css";

export default function DonateBreadcrumbSection() {
  return (
    <section className="donate-page-hero" aria-label="Donate">
      <img
        className="donate-page-hero__image donate-page-hero__image--light"
        src={breadcrumbBgLight}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <img
        className="donate-page-hero__image donate-page-hero__image--dark"
        src={breadcrumbBgDark}
        alt=""
        decoding="async"
      />
    </section>
  );
}
