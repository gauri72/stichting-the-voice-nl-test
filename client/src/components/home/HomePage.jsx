import AboutSection from "./AboutSection";
import FocusAreasSection from "./FocusAreasSection";
import Hero from "./Hero";
import OurImpactSection from "./OurImpactSection";
import OurSegmentsSection from "./OurSegmentsSection";
import OurTeamSection from "./OurTeamSection";
import SignatureEventsSection from "./SignatureEventsSection";
import SponsorsSection from "./SponsorsSection";
import UpcomingEventsSection from "./UpcomingEventsSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <UpcomingEventsSection />
      <SignatureEventsSection />
      <OurImpactSection />
      <SponsorsSection />
      <OurSegmentsSection />
      <FocusAreasSection />
      <AboutSection />
      <OurTeamSection />
    </>
  );
}
