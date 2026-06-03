import UpcomingEventsSection from "../home/UpcomingEventsSection";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import EventsCallToActionSection from "./EventsCallToActionSection";
import EventsImpactTimelineSection from "./EventsImpactTimelineSection";
import EventsSignatureEventsSection from "./EventsSignatureEventsSection";
import EventsTestimonialsSection from "./EventsTestimonialsSection";

export default function EventsPage() {
  return (
    <div id="events-navbar-top">
      <EventsBreadcrumbSection />
      <UpcomingEventsSection />
      <EventsSignatureEventsSection />
      <EventsImpactTimelineSection />
      <EventsTestimonialsSection />
      <EventsCallToActionSection />
    </div>
  );
}
