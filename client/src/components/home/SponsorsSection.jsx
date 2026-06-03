import "../../styles/sponsors-section.css";
import { sponsorLogos } from "../../data/sponsorLogos.js";

export default function SponsorsSection() {
  const loopedLogos = [...sponsorLogos, ...sponsorLogos];

  return (
    <section className="network-section" aria-labelledby="network-section-title">
      <div className="network-section__inner">
        <div className="network-section__heading">
          <span className="network-section__heading-line" aria-hidden="true" />
          <h2 id="network-section-title" className="network-section__title">
            Our Network
          </h2>
          <span className="network-section__heading-line" aria-hidden="true" />
        </div>
        <p className="network-section__subtitle">Proudly supported by our sponsors</p>

        <div className="network-marquee" aria-label="Partner and sponsor logos">
          <div className="network-marquee__track">
            {loopedLogos.map((logoSrc, index) => (
              <article className="network-marquee__card" key={`${logoSrc}-${index}`}>
                <img src={logoSrc} alt="Partner logo" loading="lazy" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
