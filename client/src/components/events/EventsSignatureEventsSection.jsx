import { FaArrowRightLong } from "react-icons/fa6";
import {
  FaClapperboard,
  FaHeadphones,
  FaMicrophoneLines,
  FaMusic,
} from "react-icons/fa6";
import { GiCricketBat } from "react-icons/gi";
import { MdOutlineEmojiPeople } from "react-icons/md";
import { IoCalendarOutline } from "react-icons/io5";
import signatureEvent1 from "../../assets/Events/signature-events-1.png";
import signatureEvent2 from "../../assets/Events/signature-events-2.png";
import signatureEvent3 from "../../assets/Events/signature-events-3.png";
import signatureEvent4 from "../../assets/Events/signature-events-4.png";
import signatureEvent5 from "../../assets/Events/signature-events-5.png";
import signatureEvent6 from "../../assets/Events/signature-events-6.png";
import "../../styles/donate-section-heading.css";
import "../../styles/events-signature-events-section.css";

const signatureEvents = [
  {
    title: "International Short Film Festival",
    description:
      "Showcasing powerful stories through cinema and giving emerging filmmakers a global stage.",
    image: signatureEvent1,
    imageFocus: "right",
    icon: FaClapperboard,
    years: "2018 – 2024",
    href: "/film-festival",
  },
  {
    title: "International Music Festival",
    description: "Uniting global voices through rhythm, harmony, and unforgettable live performances.",
    image: signatureEvent2,
    icon: FaMusic,
    years: "2017 – 2024",
    href: "#events-highlights",
  },
  {
    title: "International Dance Festival",
    description:
      "Celebrating movement, culture, and creative expression from artists around the world.",
    image: signatureEvent3,
    imageFocus: "right",
    icon: MdOutlineEmojiPeople,
    years: "2016 – 2024",
    href: "#events-highlights",
  },
  {
    title: "Shaam-e-Ghazal",
    description: "An evening where poetry, music, and emotion come together under one roof.",
    image: signatureEvent4,
    imageFocus: "right",
    icon: FaMicrophoneLines,
    years: "2015 – 2024",
    href: "#events-highlights",
  },
  {
    title: "KNCB Cricket Festival",
    description: "Bringing communities together through sports, spirit, and shared celebration.",
    image: signatureEvent5,
    icon: GiCricketBat,
    years: "2014 – 2024",
    href: "#events-highlights",
  },
  {
    title: "Her Beats Her Night",
    description: "Celebrating women in music, creativity, and leadership across every performance.",
    image: signatureEvent6,
    icon: FaHeadphones,
    years: "2022 – 2024",
    href: "#events-highlights",
  },
];

export default function EventsSignatureEventsSection() {
  return (
    <section className="events-signature" aria-labelledby="events-signature-title">
      <div className="events-signature__inner">
        <header className="donate-section__header events-signature__header">
          <p className="donate-section__eyebrow">Our Signature Events</p>
          <div className="donate-section__heading">
            <span className="donate-section__heading-line" aria-hidden="true" />
            <h2 id="events-signature-title" className="donate-section__title events-signature__title">
              A Legacy of Culture, Creativity &amp; Community
            </h2>
            <span className="donate-section__heading-line" aria-hidden="true" />
          </div>
        </header>

        <div className="events-signature__grid" role="list" aria-label="Our signature events">
          {signatureEvents.map(
            ({ title, description, image, imageFocus, icon: Icon, years, href }) => (
              <article key={title} className="events-signature-card" role="listitem">
                <div className="events-signature-card__media">
                  <img
                    className={`events-signature-card__image${
                      imageFocus === "right" ? " events-signature-card__image--focus-right" : ""
                    }`}
                    src={image}
                    alt={title}
                  />
                  <span className="events-signature-card__icon-wrap">
                    <Icon className="events-signature-card__icon" aria-hidden="true" />
                  </span>
                </div>
                <div className="events-signature-card__content">
                  <div className="events-signature-card__row events-signature-card__row--title">
                    <h3>{title}</h3>
                  </div>
                  <div className="events-signature-card__row events-signature-card__row--description">
                    <p className="events-signature-card__description">{description}</p>
                  </div>
                  <div className="events-signature-card__row events-signature-card__row--years">
                    <p className="events-signature-card__years">
                      <IoCalendarOutline aria-hidden="true" />
                      <span>{years}</span>
                    </p>
                  </div>
                  <div className="events-signature-card__row events-signature-card__row--cta">
                    <a className="events-signature-card__cta" href={href}>
                      View Highlights
                      <FaArrowRightLong aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </div>
    </section>
  );
}
