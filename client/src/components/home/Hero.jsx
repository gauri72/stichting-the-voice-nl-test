import "../../styles/hero.css";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-overlay">
        <div className="hero-content">
          <p className="hero-label">About Us</p>

          <h1 className="hero-heading">
            Where Talent Shines,
            <br />
            <span>Culture Comes Alive.</span>
          </h1>

          <p className="hero-tagline">Celebrating Diversity. Inspiring Unity.</p>

          <p className="hero-description">
            Stichting The V.O.I.C.E. NL is a Netherlands-based non-profit cultural foundation
            dedicated to international cultural exchange through music, dance, film, community
            engagement, and artistic collaboration.
          </p>

          <p className="hero-about-para">
            We organize cultural, artistic and social events that bring people together, spark
            dialogue, and create lasting impact across generations.
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
