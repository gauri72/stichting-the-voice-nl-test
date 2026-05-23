import UpcomingEventsSection from "../home/UpcomingEventsSection";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import EventsSignatureEventsSection from "./EventsSignatureEventsSection";

export default function EventsPage() {
  return (
    <div id="events-navbar-top">
      <EventsBreadcrumbSection />
      <UpcomingEventsSection />
      <EventsSignatureEventsSection />
    </div>
  );
}
