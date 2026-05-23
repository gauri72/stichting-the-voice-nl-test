import "../../styles/venture-studio-mission-section.css";

export default function VentureStudioMissionSection() {
  return (
    <section className="vvs-mission" aria-labelledby="vvs-mission-heading">
      <div className="vvs-mission__inner">
        <div className="vvs-mission__heading-col">
          <h2 id="vvs-mission-heading" className="vvs-mission__label">
            Our Mission
          </h2>
        </div>
        <div className="vvs-mission__divider" aria-hidden />
        <div className="vvs-mission__content-col">
          <p className="vvs-mission__text">
            To create a sustainable ecosystem that transforms digital success into real-world
            opportunities for young people. We generate value through our services and reinvest it
            into building{" "}
            <span className="vvs-mission__highlight">
              internships, real project experiences, and future-ready skills.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
