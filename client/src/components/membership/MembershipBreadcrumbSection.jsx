import breadcrumbBgLight from "../../assets/Membership/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../assets/Membership/breadcrumb-bg-dark.png";
import "../../styles/membership-breadcrumb-section.css";

export default function MembershipBreadcrumbSection() {
  return (
    <section className="membership-page-hero" aria-label="Membership">
      <img
        className="membership-page-hero__image membership-page-hero__image--light"
        src={breadcrumbBgLight}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <img
        className="membership-page-hero__image membership-page-hero__image--dark"
        src={breadcrumbBgDark}
        alt=""
        decoding="async"
      />
    </section>
  );
}
