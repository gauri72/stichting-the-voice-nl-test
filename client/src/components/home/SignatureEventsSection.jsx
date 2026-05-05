import eventOneImage from "../../assets/Home/one.png";
import eventTwoImage from "../../assets/Home/two.png";
import eventThreeImage from "../../assets/Home/three.png";
import eventFourImage from "../../assets/Home/four.png";
import eventFiveImage from "../../assets/Home/five.png";
import eventSixImage from "../../assets/Home/six.png";
import { FaClapperboard, FaMicrophoneLines, FaMusic, FaPersonDress } from "react-icons/fa6";
import { GiCricketBat } from "react-icons/gi";
import { MdOutlineEmojiPeople } from "react-icons/md";
import "../../styles/signature-events.css";

const signatureEvents = [
  {
    title: "International Short Film Festival",
    description: "Showcasing powerful stories through cinema.",
    image: eventOneImage,
    icon: FaClapperboard,
    iconClassName: "signature-event-icon--green"
  },
  {
    title: "International Music Festival",
    description: "Uniting global voices through rhythm and harmony.",
    image: eventTwoImage,
    icon: FaMusic,
    iconClassName: "signature-event-icon--blue"
  },
  {
    title: "International Dance Festival",
    description: "Celebrating movement, culture and expression.",
    image: eventThreeImage,
    icon: MdOutlineEmojiPeople,
    iconClassName: "signature-event-icon--green"
  },
  {
    title: "Shaam-e-Ghazal",
    description: "An evening where poetry, music and emotion come together.",
    image: eventFourImage,
    icon: FaMicrophoneLines,
    iconClassName: "signature-event-icon--blue"
  },
  {
    title: "KNCB Cricket Festival",
    description: "Bringing communities together through sports and spirit.",
    image: eventFiveImage,
    icon: GiCricketBat,
    iconClassName: "signature-event-icon--green"
  },
  {
    title: "Her Beats Her Night",
    description: "Celebrating women in music, creativity and leadership.",
    image: eventSixImage,
    icon: FaPersonDress,
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
          {signatureEvents.map(({ title, description, image, icon: Icon, iconClassName }, index) => (
            <article
              key={title}
              className={`signature-event-card ${index >= 3 ? "signature-event-card--compact-title" : ""}`}
              role="listitem"
            >
              <img className="signature-event-image" src={image} alt={title} />
              <div className={`signature-event-icon-wrap ${iconClassName}`}>
                <Icon className="signature-event-icon" aria-hidden="true" />
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
