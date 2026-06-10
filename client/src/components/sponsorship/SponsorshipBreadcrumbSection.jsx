import breadcrumbBgLight from "../../assets/Sponsorship/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../assets/Sponsorship/breadcrumb-bg-dark.png";
import "../../styles/sponsorship-breadcrumb-section.css";

export default function SponsorshipBreadcrumbSection() {
  return (
    <section className="sponsorship-page-hero" aria-label="Sponsorship">
      <img
        className="sponsorship-page-hero__image sponsorship-page-hero__image--light"
        src={breadcrumbBgLight}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <img
        className="sponsorship-page-hero__image sponsorship-page-hero__image--dark"
        src={breadcrumbBgDark}
        alt=""
        decoding="async"
      />
    </section>
  );
}
