import AboutSection from "./AboutSection";
import FocusAreasSection from "./FocusAreasSection";
import Hero from "./Hero";
import OurImpactSection from "./OurImpactSection";
import OurSegmentsSection from "./OurSegmentsSection";
import SignatureEventsSection from "./SignatureEventsSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <OurImpactSection />
      <AboutSection />
      <FocusAreasSection />
      <SignatureEventsSection />
      <OurSegmentsSection />
    </>
  );
}
