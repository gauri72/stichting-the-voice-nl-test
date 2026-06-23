import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import "../../../styles/dashboard-closing-cta-section.css";

const STYLE_CLASS = {
  primary: "dash-cta__btn dash-cta__btn--profile",
  secondary: "dash-cta__btn dash-cta__btn--discover",
  teal: "dash-cta__btn dash-cta__btn--discover",
  outline: "dash-cta__btn dash-cta__btn--discover",
  gradient: "dash-cta__btn dash-cta__btn--profile",
  ghost: "dash-cta__btn dash-cta__btn--discover",
};

export default function CustomerDashboardCustomCtaBanner({ section }) {
  const ctas = (section?.ctas || []).filter((c) => c.visible !== false);
  const themeClass = section?.settings?.themeMode === "light" ? " dash-cta--light" : "";

  return (
    <section className={`dash-cta${themeClass}`} aria-labelledby={`dash-cta-${section.sectionId}`}>
      <div className="dash-cta__content">
        {section?.imageUrl ? (
          <img className="dash-cta__logo logo-glow" src={section.imageUrl} alt="" decoding="async" />
        ) : null}
        <div className="dash-cta__copy">
          {section?.title ? (
            <h2 id={`dash-cta-${section.sectionId}`} className="dash-cta__title">
              <span className="dash-cta__title-row">{section.title}</span>
              {section.subtitle ? (
                <span className="dash-cta__title-row dash-cta__title-row--accent dash-grad-text">
                  {section.subtitle}
                </span>
              ) : null}
            </h2>
          ) : null}
          {section?.description ? <p className="dash-cta__text">{section.description}</p> : null}
        </div>
        {ctas.map((cta) => {
          const className = STYLE_CLASS[cta.style] || STYLE_CLASS.primary;
          const isExternal = cta.url?.startsWith("http");
          if (isExternal) {
            return (
              <a
                key={cta.id}
                href={cta.url}
                className={className}
                target={cta.target === "_blank" ? "_blank" : undefined}
                rel={cta.target === "_blank" ? "noopener noreferrer" : undefined}
              >
                {cta.text} <FaArrowRight aria-hidden />
              </a>
            );
          }
          return (
            <Link key={cta.id} to={cta.url || "#"} className={className}>
              {cta.text} <FaArrowRight aria-hidden />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
