import SponsorsSection from "../../home/SponsorsSection.jsx";

export default function SponsorLogosRenderer({ section }) {
  if (section.sectionKey === "sponsors") {
    return <SponsorsSection />;
  }
  const logos = section.content?.logos || [];
  return (
    <section className="cms-sponsor-logos">
      {section.content?.heading ? <h2>{section.content.heading}</h2> : null}
      <div className="cms-sponsor-logos__track">
        {logos.map((logo, i) => (
          <img key={logo.id || i} src={logo.url} alt={logo.alt || logo.name || ""} />
        ))}
      </div>
    </section>
  );
}
