import heroBackground from "../../assets/Events/hero-bg.png";
import "../../styles/events-breadcrumb-section.css";

export default function EventsBreadcrumbSection() {
  return (
    <section className="events-page-hero" aria-label="Experience">
      <img
        className="events-page-hero__image"
        src={heroBackground}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
    </section>
  );
}
