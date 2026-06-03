import Hero from "./Hero";
import ImpactStatsBar from "./ImpactStatsBar";
import FeaturedEventsSection from "./FeaturedEventsSection";
import GetInvolvedSection from "./GetInvolvedSection";
import OurPillarsSection from "./OurPillarsSection";
import SponsorsSection from "./SponsorsSection";
import "../../styles/home-page.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <Hero />
      <FeaturedEventsSection />
      <GetInvolvedSection />
      <OurPillarsSection />
      <ImpactStatsBar />
      <SponsorsSection />
    </div>
  );
}
