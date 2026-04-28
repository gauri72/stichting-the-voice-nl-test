import vownlImage from "../../assets/Home/VOWNL.png";
import visionOfSoundsImage from "../../assets/Home/Vision Of Sounds.jpeg";
import voiceOfVisionariesImage from "../../assets/Home/Voice Of Visionaries.jpeg";
import "../../styles/our-segments.css";

const segments = [
  {
    title: "Vision of Sounds",
    description:
      "A creative platform where music and insight come together to amplify stories, rhythm, and shared expression.",
    image: visionOfSoundsImage,
    alt: "Vision of Sounds logo showing a treble clef merged with an eye symbol"
  },
  {
    title: "Voice of Women in the Netherlands",
    description:
      "A women-led segment focused on welfare, belonging, and empowerment through collective action.",
    image: vownlImage,
    alt: "VOWNL identity artwork featuring a woman's profile with colorful petals"
  },
  {
    title: "Voice of Visionaries",
    description:
      "A leadership and ideas segment that spotlights forward thinkers shaping culture, community, and social impact.",
    image: voiceOfVisionariesImage,
    alt: "Voice of Visionaries logo with a profile icon and bold typography"
  }
];

export default function OurSegmentsSection() {
  return (
    <section className="our-segments-section" aria-labelledby="our-segments-title">
      <div className="our-segments-inner">
        <h2 id="our-segments-title" className="our-segments-title">
          Our Segments
        </h2>

        <div className="our-segments-grid" role="list" aria-label="Our organization segments">
          {segments.map(({ title, description, image, alt }) => (
            <article key={title} className="our-segments-card" role="listitem">
              <div className="our-segments-image-wrap">
                <img className="our-segments-image" src={image} alt={alt} loading="lazy" />
              </div>
              <div className="our-segments-content">
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
