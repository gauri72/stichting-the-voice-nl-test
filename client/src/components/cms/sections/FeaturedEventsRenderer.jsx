import FeaturedEventsCarousel from "../../events/FeaturedEventsCarousel.jsx";

export default function FeaturedEventsRenderer({ section }) {
  const pageContext = section.content?.pageContext || "home";
  const variant = section.content?.variant || "fullHero";
  return <FeaturedEventsCarousel pageContext={pageContext} variant={variant} />;
}
