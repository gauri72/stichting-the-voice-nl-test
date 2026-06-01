import "../../styles/hero.css";
import heroBgLight from "../../assets/Home/hero-bg-light.png";
import heroBgDark from "../../assets/Home/hero-bg-dark.png";

export default function Hero() {
  return (
    <section className="hero-section" aria-label="Stichting The V.O.I.C.E. NL">
      <img
        className="hero-section__image hero-section__image--light"
        src={heroBgLight}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      <img
        className="hero-section__image hero-section__image--dark"
        src={heroBgDark}
        alt=""
        decoding="async"
      />
    </section>
  );
}
