import { useState } from "react";
import FeaturedEventsSection from "../home/FeaturedEventsSection";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import OurImpactSection from "../home/OurImpactSection";
import EventsImpactTimelineSection from "./EventsImpactTimelineSection";
import EventsTestimonialsSection from "./EventsTestimonialsSection";
import "../../styles/events-page.css";

export default function EventsPage() {
  const [testimonials, setTestimonials] = useState([]);

  function handleAddTestimonial(entry) {
    setTestimonials((prev) => [...prev, entry]);
  }

  return (
    <div id="events-navbar-top" className="events-page">
      <EventsBreadcrumbSection />
      <EventsTestimonialsSection variant="community" testimonials={testimonials} />
      <FeaturedEventsSection />
      <EventsImpactTimelineSection />
      <EventsTestimonialsSection
        variant="submit"
        testimonials={testimonials}
        onAddTestimonial={handleAddTestimonial}
      />
      <OurImpactSection />
    </div>
  );
}
