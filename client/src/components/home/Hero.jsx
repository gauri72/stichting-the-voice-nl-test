import "../../styles/hero.css";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-main">
              Where Talent{" "}
              <br className="hero-mobile-break" />
              {" "}Shines,
            </span>
            <span className="hero-title-accent">
              Culture{" "}
              <br className="hero-accent-mobile-break" />
              {" "}Comes Alive.
            </span>
          </h1>

          <p className="hero-description">
            <span className="hero-description-line">
              Stichting The V.O.I.C.E. NL is a Netherlands-based
            </span>
            <br />
            <span className="hero-description-line">
              non-profit cultural foundation dedicated to international
            </span>
            <br />
            <span className="hero-description-line">cultural exchange through music, dance, film,</span>
            <br />
            <span className="hero-description-line">
              community engagement, and artistic collaboration.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
