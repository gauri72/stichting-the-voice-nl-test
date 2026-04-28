import eventOneImage from "../../assets/Home/one.png";
import eventTwoImage from "../../assets/Home/two.png";
import eventThreeImage from "../../assets/Home/three.png";
import eventFourImage from "../../assets/Home/four.png";
import eventFiveImage from "../../assets/Home/five.png";
import eventSixImage from "../../assets/Home/six.png";
import danceIcon from "../../assets/icons/signature-events/dance.svg";
import cricketIcon from "../../assets/icons/signature-events/cricket.svg";
import filmIcon from "../../assets/icons/signature-events/film.svg";
import micIcon from "../../assets/icons/signature-events/mic.svg";
import musicIcon from "../../assets/icons/signature-events/music.svg";
import womenIcon from "../../assets/icons/signature-events/women.svg";
import "../../styles/signature-events.css";

const signatureEvents = [
  {
    title: "International Short Film Festival",
    description: "Showcasing powerful stories through cinema.",
    image: eventOneImage,
    icon: filmIcon,
    iconClassName: "signature-event-icon--green"
  },
  {
    title: "International Music Festival",
    description: "Uniting global voices through rhythm and harmony.",
    image: eventTwoImage,
    icon: musicIcon,
    iconClassName: "signature-event-icon--blue"
  },
  {
    title: "International Dance Festival",
    description: "Celebrating movement, culture and expression.",
    image: eventThreeImage,
    icon: danceIcon,
    iconClassName: "signature-event-icon--green"
  },
  {
    title: "Shaam-e-Ghazal",
    description: "An evening where poetry, music and emotion come together.",
    image: eventFourImage,
    icon: micIcon,
    iconClassName: "signature-event-icon--blue"
  },
  {
    title: "KNCB Cricket Festival",
    description: "Bringing communities together through sports and spirit.",
    image: eventFiveImage,
    icon: cricketIcon,
    iconClassName: "signature-event-icon--green"
  },
  {
    title: "Her Beats Her Night",
    description: "Celebrating women in music, creativity and leadership.",
    image: eventSixImage,
    icon: womenIcon,
    iconClassName: "signature-event-icon--blue"
  }
];

export default function SignatureEventsSection() {
  return (
    <section className="signature-events-section" aria-labelledby="signature-events-title">
      <div className="signature-events-inner">
        <div className="signature-events-heading">
          <span className="signature-events-heading-line" aria-hidden="true" />
          <h2 id="signature-events-title" className="signature-events-title">
            Our Signature Events
          </h2>
          <span className="signature-events-heading-line" aria-hidden="true" />
        </div>

        <div className="signature-events-grid" role="list" aria-label="Our signature events">
          {signatureEvents.map(({ title, description, image, icon, iconClassName }, index) => (
            <article
              key={title}
              className={`signature-event-card ${index >= 3 ? "signature-event-card--compact-title" : ""}`}
              role="listitem"
            >
              <img className="signature-event-image" src={image} alt={title} />
              <div className={`signature-event-icon-wrap ${iconClassName}`}>
                <span
                  className="signature-event-icon"
                  style={{ "--signature-icon-url": `url(${icon})` }}
                  aria-hidden="true"
                />
              </div>
              <div className="signature-event-content">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
