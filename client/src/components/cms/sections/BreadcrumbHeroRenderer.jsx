import BreadcrumbPageHeader from "../../layout/BreadcrumbPageHeader.jsx";

export default function BreadcrumbHeroRenderer({ section }) {
  const { content = {}, images = {} } = section;
  const bg = images.background || images.hero || {};

  return (
    <BreadcrumbPageHeader
      ariaLabel={content.ariaLabel || content.heading || section.title}
      lightSrc={bg.url || undefined}
      darkSrc={bg.url || undefined}
      heroClassName="breadcrumb-hero-section"
    />
  );
}
