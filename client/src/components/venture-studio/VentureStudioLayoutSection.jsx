import layoutImage from "../../assets/Venture Studio/layout.png";
import "../../styles/venture-studio-layout-section.css";

export default function VentureStudioLayoutSection() {
  return (
    <section id="vvs-layout" className="vvs-layout" aria-label="Venture Studio overview">
      <img
        className="vvs-layout__image"
        src={layoutImage}
        alt="V.O.I.C.E. Venture Studio services and program overview"
      />
    </section>
  );
}
