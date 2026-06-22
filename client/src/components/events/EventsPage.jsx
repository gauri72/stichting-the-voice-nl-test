import { useEffect, useState } from "react";
import FeaturedEventsCarousel from "./FeaturedEventsCarousel";
import EventsBreadcrumbSection from "./EventsBreadcrumbSection";
import OurImpactSection from "../home/OurImpactSection";
import PastEventHighlightsSlider from "./PastEventHighlightsSlider";
import EventsTestimonialsSection from "./EventsTestimonialsSection";
import { loadEventTestimonials, saveEventTestimonial } from "../../utils/eventsTestimonials.js";
import "../../styles/events-page.css";

export default function EventsPage() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    let active = true;

    loadEventTestimonials().then((items) => {
      if (active) setTestimonials(items);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleAddTestimonial(entry) {
    const saved = await saveEventTestimonial(entry);
    setTestimonials((prev) => {
      if (prev.some((item) => item.id === saved.id)) {
        return prev;
      }
      return [saved, ...prev];
    });
    return saved;
  }

  return (
    <div id="events-navbar-top" className="events-page">
      <EventsBreadcrumbSection />
      <FeaturedEventsCarousel pageContext="events" variant="compactHero" />
      <PastEventHighlightsSlider />
      <EventsTestimonialsSection variant="community" testimonials={testimonials} />
      <EventsTestimonialsSection
        variant="submit"
        testimonials={testimonials}
        onAddTestimonial={handleAddTestimonial}
      />
      <OurImpactSection />
    </div>
  );
}
