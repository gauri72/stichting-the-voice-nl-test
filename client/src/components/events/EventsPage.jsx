import FeaturedEventsCarousel from "./FeaturedEventsCarousel";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import OurImpactSection from "../home/OurImpactSection";
import PastEventHighlightsSlider from "./PastEventHighlightsSlider";
import CommunityReviewsSlider from "./CommunityReviewsSlider.jsx";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import "../../styles/events-page.css";

function EventsPageFallback() {
  return (
    <div id="events-navbar-top" className="events-page">
      <EventsBreadcrumbSection />
      <FeaturedEventsCarousel pageContext="events" variant="compactHero" />
      <PastEventHighlightsSlider />
      <CommunityReviewsSlider />
      <OurImpactSection />
    </div>
  );
}

export default function EventsPage() {
  return <CmsAwarePage slug="events" fallback={<EventsPageFallback />} />;
}
