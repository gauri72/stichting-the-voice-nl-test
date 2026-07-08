import { EventExperienceProvider } from "./EventExperienceContext.jsx";
import FeaturedHeroCarousel from "./hero/FeaturedHeroCarousel.jsx";
import EventShortsSection from "./shorts/EventShortsSection.jsx";
import FutureEventsSection from "./grid/FutureEventsSection.jsx";
import EventsCalendarSection from "./calendar/EventsCalendarSection.jsx";
import SectionRevealOnScroll from "./shared/SectionRevealOnScroll.jsx";
import CursorGlow from "./shared/CursorGlow.jsx";

export default function EventExperiencePage() {
  return (
    <EventExperienceProvider>
      <div className="event-experience-page bg-evx-bg text-evx-text">
        <CursorGlow />
        <FeaturedHeroCarousel />

        <SectionRevealOnScroll>
          <EventShortsSection />
        </SectionRevealOnScroll>

        <SectionRevealOnScroll>
          <FutureEventsSection />
        </SectionRevealOnScroll>

        <SectionRevealOnScroll>
          <EventsCalendarSection />
        </SectionRevealOnScroll>
      </div>
    </EventExperienceProvider>
  );
}
