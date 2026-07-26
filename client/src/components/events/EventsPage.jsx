import FeaturedEventsCarousel from "./FeaturedEventsCarousel";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import OurImpactSection from "../home/OurImpactSection";
import PastEventHighlightsSlider from "./PastEventHighlightsSlider";
import CommunityReviewsSlider from "./CommunityReviewsSlider.jsx";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import { useSeo } from "../../hooks/useSeo.js";
import "../../styles/events-page.css";

function EventsPageFallback() {
  // markReady: false — FeaturedEventsCarousel below owns the actual
  // readiness signal for this page, since it's the real async content.
  useSeo(
    {
      title: "Events — Stichting The V.O.I.C.E. NL",
      description: "Discover upcoming cultural events, concerts, and community gatherings hosted by Stichting The V.O.I.C.E. NL.",
    },
    { markReady: false }
  );

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
  return <CmsAwarePage slug="events" fallback={<EventsPageFallback />} deferReadyToFallback />;
}
