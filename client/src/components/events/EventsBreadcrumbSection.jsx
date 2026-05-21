import heroBackground from "../../assets/Events/hero-bg.png";
import "../../styles/events-breadcrumb-section.css";

export default function EventsBreadcrumbSection() {
  return (
    <section
      className="events-page-hero"
      aria-labelledby="events-hero-title"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="events-page-hero__container">
        <h1 id="events-hero-title">
          <span className="events-page-hero__title-line">Celebrating Our</span>
          <span className="events-page-hero__title-gradient">Past Events</span>
        </h1>
        <p className="events-page-hero__intro">
          From vibrant festivals to intimate cultural evenings, our events have brought communities
          together across the Netherlands and beyond. Explore the moments that shaped our mission
          and continue to inspire what comes next.
        </p>
      </div>
    </section>
  );
}
