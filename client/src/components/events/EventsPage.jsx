import FeaturedEventsSection from "../home/FeaturedEventsSection";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import OurImpactSection from "../home/OurImpactSection";
import EventsImpactTimelineSection from "./EventsImpactTimelineSection";
import EventsTestimonialsSection from "./EventsTestimonialsSection";
import "../../styles/events-page.css";

export default function EventsPage() {
  return (
    <div id="events-navbar-top" className="events-page">
      <EventsBreadcrumbSection />
      <FeaturedEventsSection />
      <EventsTestimonialsSection />
      <EventsImpactTimelineSection />
      <OurImpactSection />
    </div>
  );
}
