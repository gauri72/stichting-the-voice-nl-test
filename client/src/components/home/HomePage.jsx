import AboutSection from "./AboutSection";
import EventTicketsSection from "./EventTicketsSection";
import FocusAreasSection from "./FocusAreasSection";
import Hero from "./Hero";
import OurImpactSection from "./OurImpactSection";
import OurSegmentsSection from "./OurSegmentsSection";
import OurTeamSection from "./OurTeamSection";
import SignatureEventsSection from "./SignatureEventsSection";
import SponsorsSection from "./SponsorsSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <EventTicketsSection />
      <OurImpactSection />
      <SponsorsSection />
      <SignatureEventsSection />
      <OurSegmentsSection />
      <FocusAreasSection />
      <AboutSection />
      <OurTeamSection />
    </>
  );
}
