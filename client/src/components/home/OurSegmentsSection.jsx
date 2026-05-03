import vownlImage from "../../assets/Home/VOWNL.png";
import visionOfSoundsImage from "../../assets/Home/Vision Of Sounds.jpeg";
import voiceOfVisionariesImage from "../../assets/Home/Voice Of Visionaries.jpeg";
import { FaLightbulb, FaMusic, FaUser, FaUsers } from "react-icons/fa6";
import "../../styles/our-segments.css";

const segments = [
  {
    title: "Vision of Sounds",
    description:
      "A creative platform where music and insight come together to amplify stories, rhythm, and shared expression.",
    image: visionOfSoundsImage,
    alt: "Vision of Sounds logo showing a treble clef merged with an eye symbol",
    Icon: FaMusic
  },
  {
    title: "Voice of Women in the Netherlands",
    description:
      "A women-led segment focused on welfare, belonging, and empowerment through collective action.",
    image: vownlImage,
    alt: "VOWNL identity artwork featuring a woman's profile with colorful petals",
    Icon: FaUser
  },
  {
    title: "Voice of Visionaries",
    description:
      "A leadership and ideas segment that spotlights forward thinkers shaping culture, community, and social impact.",
    image: voiceOfVisionariesImage,
    alt: "Voice of Visionaries logo with a profile icon and bold typography",
    Icon: FaLightbulb
  }
];

export default function OurSegmentsSection() {
  return (
    <section className="our-segments-section" aria-labelledby="our-segments-title">
      <div className="our-segments-inner">
        <p className="our-segments-kicker">Our Segments</p>
        <h2 id="our-segments-title" className="our-segments-title">
          Three Voices. One Mission.
        </h2>
        <p className="our-segments-subtitle">
          Our segments amplify unique voices and drive meaningful change across culture, empowerment,
          and leadership.
        </p>

        <div className="our-segments-grid" role="list" aria-label="Our organization segments">
          {segments.map(({ title, description, image, alt, Icon }) => (
            <article key={title} className="our-segments-card" role="listitem">
              <div className="our-segments-image-wrap">
                <img className="our-segments-image" src={image} alt={alt} loading="lazy" />
              </div>
              <div className="our-segments-icon-badge" aria-hidden="true">
                <Icon />
              </div>
              <div className="our-segments-content">
                <h3>{title}</h3>
                <span className="our-segments-content-line" aria-hidden="true" />
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="our-segments-callout" role="note" aria-label="Segments impact statement">
          <span className="our-segments-callout-icon" aria-hidden="true">
            <FaUsers />
          </span>
          <div>
            <h3>Different Voices. Shared Purpose.</h3>
            <p>Through each segment, we build bridges, inspire action, and create lasting impact.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
