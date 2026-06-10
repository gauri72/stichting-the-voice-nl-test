import StoriesBreadcrumbSection from "./StoriesBreadcrumbSection";
import StoriesHeroSection from "./StoriesHeroSection";
import StoriesPillarSection from "./StoriesPillarSection";
import { STORIES_PILLARS } from "../../data/storiesDisplay.js";
import "../../styles/stories-page.css";

export default function StoriesPage() {
  return (
    <div id="stories-navbar-top" className="stories-page-shell">
      <StoriesBreadcrumbSection />
      <StoriesHeroSection />
      {STORIES_PILLARS.map((pillar) => (
        <StoriesPillarSection key={pillar.id} pillar={pillar} />
      ))}
    </div>
  );
}