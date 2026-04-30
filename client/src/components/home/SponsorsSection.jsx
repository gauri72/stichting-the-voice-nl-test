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

const sponsorLogos = [
  logo1,
  logo2,
  logo3,
  logo4,
  logo5,
  logo6,
  logo7,
  logo8,
  logo9,
  logo10,
  logo11,
  logo12
];

export default function SponsorsSection() {
  const loopedLogos = [...sponsorLogos, ...sponsorLogos];

  return (
    <section className="sponsors-section" aria-labelledby="sponsors-title">
      <div className="sponsors-section__inner">
        <p className="sponsors-section__label">Our Network</p>
        <h2 id="sponsors-title" className="sponsors-section__heading">
          Proudly Supported by Our Sponsors
        </h2>

        <div className="sponsors-marquee" aria-label="Sponsor logos">
          <div className="sponsors-marquee__track">
            {loopedLogos.map((logoSrc, index) => (
              <article className="sponsors-marquee__card" key={`${logoSrc}-${index}`}>
                <img src={logoSrc} alt="Sponsor logo" loading="lazy" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
