import Hero from "./Hero";
import ImpactStatsBar from "./ImpactStatsBar";
import FeaturedEventsCarousel from "../events/FeaturedEventsCarousel";
import GetInvolvedSection from "./GetInvolvedSection";
import OurPillarsSection from "./OurPillarsSection";
import SponsorsSection from "./SponsorsSection";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import "../../styles/home-page.css";

function HomePageFallback() {
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

export default function HomePage() {
  return <CmsAwarePage slug="home" fallback={<HomePageFallback />} />;
}
