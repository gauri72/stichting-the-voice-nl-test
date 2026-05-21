import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import EventsSignatureEventsSection from "./EventsSignatureEventsSection";
import EventsImpactTimelineSection from "./EventsImpactTimelineSection";
import EventsTestimonialsSection from "./EventsTestimonialsSection";
import EventsCallToActionSection from "./EventsCallToActionSection";

export default function EventsPage() {
  return (
    <div id="events-navbar-top">
      <EventsBreadcrumbSection />
      <EventsSignatureEventsSection />
      <EventsImpactTimelineSection />
      <EventsTestimonialsSection />
      <EventsCallToActionSection />
    </div>
  );
}
