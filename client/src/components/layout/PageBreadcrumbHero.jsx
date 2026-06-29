import VoiceVMarkLink from "./VoiceVMarkLink.jsx";
import "../../styles/page-breadcrumb-hero.css";

export default function PageBreadcrumbHero({
  className = "",
  ariaLabel,
  lightSrc,
  darkSrc,
  fetchPriority = "auto",
  showVMark = false,
}) {
  return (
    <section
      className={`page-breadcrumb-hero ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <img
        className="page-breadcrumb-hero__image page-breadcrumb-hero__image--light"
        src={lightSrc}
        alt=""
        decoding="async"
        fetchPriority={fetchPriority === "high" ? "high" : undefined}
      />
      <img
        className="page-breadcrumb-hero__image page-breadcrumb-hero__image--dark"
        src={darkSrc}
        alt=""
        decoding="async"
      />
      {showVMark ? <VoiceVMarkLink /> : null}
    </section>
  );
}
