import "../../styles/sponsors-section.css";
import logo1 from "../../assets/Home/logos/logo-1.png";
import logo2 from "../../assets/Home/logos/logo-2.png";
import logo3 from "../../assets/Home/logos/logo-3.png";
import logo4 from "../../assets/Home/logos/logo-4.png";
import logo5 from "../../assets/Home/logos/logo-5.png";
import logo6 from "../../assets/Home/logos/logo-6.png";
import logo7 from "../../assets/Home/logos/logo-7.png";
import logo8 from "../../assets/Home/logos/logo-8.png";
import logo9 from "../../assets/Home/logos/logo-9.png";
import logo10 from "../../assets/Home/logos/logo-10.png";
import logo11 from "../../assets/Home/logos/logo-11.png";
import logo12 from "../../assets/Home/logos/logo-12.png";
import logo13 from "../../assets/Home/logos/logo-13.png";
import logo14 from "../../assets/Home/logos/logo-14.png";

const sponsorLogos = [
  logo3,
  logo12,
  logo6,
  logo8,
  logo13,
  logo14,
  logo1,
  logo2,
  logo4,
  logo5,
  logo7,
  logo9,
  logo10,
  logo11,
];

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
