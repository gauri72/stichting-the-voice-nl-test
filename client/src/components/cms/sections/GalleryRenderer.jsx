export default function GalleryRenderer({ section }) {
  const images = section.images?.gallery || section.content?.gallery || [];

  return (
    <section className="cms-gallery">
      {section.content?.heading ? <h2>{section.content.heading}</h2> : null}
      <div className="cms-gallery__grid">
        {images.map((img, i) => (
          <figure key={img.id || i}>
            <img src={img.url} alt={img.alt || ""} style={{ objectPosition: img.focusPosition || "center" }} />
          </figure>
        ))}
      </div>
    </section>
  );
}
