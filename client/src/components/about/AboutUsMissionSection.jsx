import { IconTarget } from "@tabler/icons-react";
import { ABOUT_MISSION } from "../../data/aboutUsDisplay.js";

export default function AboutUsMissionSection() {
  const { label, textBefore, highlights, textMiddle, textAfter } = ABOUT_MISSION;

  return (
    <section className="about-us-mission" aria-labelledby="about-us-mission-title">
      <div className="about-us-mission__inner">
        <div className="about-us-mission__label-wrap">
          <span className="about-us-mission__icon-wrap" aria-hidden="true">
            <IconTarget className="about-us-mission__icon" stroke={1.5} />
          </span>
          <h2 id="about-us-mission-title" className="about-us-mission__label">
            {label}
          </h2>
        </div>

        <p className="about-us-mission__text">
          {textBefore}
          <span className="about-us-accent">{highlights[0]}</span>,{" "}
          <span className="about-us-accent">{highlights[1]}</span>, and{" "}
          <span className="about-us-accent">{highlights[2]}</span>
          {textMiddle}
          <span className="about-us-accent">culture, creativity and collaboration</span>
          {textAfter}
        </p>
      </div>
    </section>
  );
}
