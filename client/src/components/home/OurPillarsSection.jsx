import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { MdOutlineVolunteerActivism } from "react-icons/md";
import { TbBulb, TbMicrophone, TbPresentation } from "react-icons/tb";
import "../../styles/our-pillars-section.css";

const pillars = [
  {
    title: "Experience",
    description: "Creating unforgettable cultural experiences that bring people together.",
    to: "/events",
    accent: "teal",
    Icon: TbPresentation,
  },
  {
    title: "Stories",
    description: "Amplifying voices and sharing real stories from all cultures and communities.",
    to: "/segments/vision-of-sounds",
    accent: "magenta",
    Icon: TbMicrophone,
  },
  {
    title: "Impact",
    description: "Building inclusivity and belonging through meaningful experiences and values.",
    to: "/segments/vownl",
    accent: "gold",
    Icon: MdOutlineVolunteerActivism,
  },
  {
    title: "Innovation",
    description: "Driving growth and success stories with innovation and global collaboration.",
    to: "/voice-venture-studio",
    accent: "blue",
    Icon: TbBulb,
  },
];

export default function OurPillarsSection() {
  return (
    <section className="our-pillars-section" aria-labelledby="our-pillars-title">
      <div className="our-pillars-section__inner">
        <div className="our-pillars-section__heading">
          <span className="our-pillars-section__heading-line" aria-hidden="true" />
          <h2 id="our-pillars-title" className="our-pillars-section__title">
            Our Pillars. Our Promise.
          </h2>
          <span className="our-pillars-section__heading-line" aria-hidden="true" />
        </div>

        <div className="our-pillars-grid" role="list">
          {pillars.map(({ title, description, to, accent, Icon }, index) => (
            <article
              key={title}
              className={`our-pillars-item our-pillars-item--${accent}${
                index < pillars.length - 1 ? " our-pillars-item--divided" : ""
              }`}
              role="listitem"
            >
              <div className="our-pillars-item__icon" aria-hidden="true">
                <Icon className="our-pillars-item__icon-svg" />
              </div>
              <h3 className="our-pillars-item__title">{title}</h3>
              <p className="our-pillars-item__description">{description}</p>
              <Link className="our-pillars-item__link" to={to}>
                Learn more
                <IoArrowForward aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
