import "../../styles/hero.css";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-heading">
            Where Talent Shines,
            <br />
            <span>Culture Comes Alive.</span>
          </h1>

          <p className="hero-tagline">
            Come for the experience. Stay for{" "}
            <br />
            the community. Grow with the family.
          </p>

          <p className="hero-description">
            Be part of something bigger than an event. Stichting The V.O.I.C.E. NL is building a
            vibrant international cultural community where people come together through music,
            dance, cinema, sports, and shared experiences. Join us in shaping a future filled with
            culture, inspiration, and togetherness.
          </p>

          <div className="hero-whatsapp-cta">
            <p>For latest news and updates, join our WhatsApp group.</p>
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">
              Join WhatsApp Group
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
