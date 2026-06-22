import Hero from "./Hero";
import ImpactStatsBar from "./ImpactStatsBar";
import FeaturedEventsCarousel from "../events/FeaturedEventsCarousel";
import GetInvolvedSection from "./GetInvolvedSection";
import OurPillarsSection from "./OurPillarsSection";
import SponsorsSection from "./SponsorsSection";
import "../../styles/home-page.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <Hero />
      <FeaturedEventsCarousel pageContext="home" variant="fullHero" />
      <OurPillarsSection />
      <GetInvolvedSection />
      <ImpactStatsBar />
      <SponsorsSection />
    </div>
  );
}
