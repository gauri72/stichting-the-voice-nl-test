import Hero from "./Hero";
import ImpactStatsBar from "./ImpactStatsBar";
import FeaturedEventsSection from "./FeaturedEventsSection";
import GetInvolvedSection from "./GetInvolvedSection";
import OurPillarsSection from "./OurPillarsSection";
import SponsorsSection from "./SponsorsSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactStatsBar />
      <FeaturedEventsSection />
      <GetInvolvedSection />
      <OurPillarsSection />
      <SponsorsSection />
    </>
  );
}
