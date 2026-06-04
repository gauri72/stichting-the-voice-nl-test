import breadcrumbBgLight from "../../assets/Events/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../assets/Events/breadcrumb-bg-dark.png";
import "../../styles/events-breadcrumb-section.css";

export default function EventsBreadcrumbSection() {
  return (
    <section className="events-page-hero" aria-label="Experience">
      <img
        className="events-page-hero__image events-page-hero__image--light"
        src={breadcrumbBgLight}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <img
        className="events-page-hero__image events-page-hero__image--dark"
        src={breadcrumbBgDark}
        alt=""
        decoding="async"
      />
    </section>
  );
}
