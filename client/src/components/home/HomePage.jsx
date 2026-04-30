import AboutSection from "./AboutSection";
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
      <SponsorsSection />
      <OurImpactSection />
      <AboutSection />
      <FocusAreasSection />
      <SignatureEventsSection />
      <OurSegmentsSection />
      <OurTeamSection />
    </>
  );
}
