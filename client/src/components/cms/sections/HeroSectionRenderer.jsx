import BreadcrumbPageHeader from "../../layout/BreadcrumbPageHeader.jsx";
import heroBgLight from "../../../assets/Home/hero-bg-light.png";
import heroBgDark from "../../../assets/Home/hero-bg-dark.png";

export default function HeroSectionRenderer({ section }) {
  const { content = {}, images = {} } = section;
  const hero = images.hero || {};
  const mobile = images.mobile || {};

  return (
    <section className="cms-hero-section">
      <BreadcrumbPageHeader
        ariaLabel={content.heading || section.title || "Stichting The V.O.I.C.E. NL"}
        lightSrc={hero.url || heroBgLight}
        darkSrc={hero.url || heroBgDark}
        heroClassName="hero-section"
        fetchPriority="high"
        mobileSrc={mobile.url || undefined}
      />
      {(content.heading || content.description) && (
        <div className="cms-hero-section__overlay">
          {content.heading ? <h1>{content.heading}</h1> : null}
          {content.subheading ? <p className="cms-hero-section__sub">{content.subheading}</p> : null}
          {content.description ? <p>{content.description}</p> : null}
        </div>
      )}
    </section>
  );
}
