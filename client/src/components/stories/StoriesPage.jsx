import heroBgLight from "../../assets/Stories/hero-bg-light.png";
import heroBgDark from "../../assets/Stories/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import StoriesPillarSection from "./StoriesPillarSection";
import { STORIES_PILLARS } from "../../data/storiesDisplay.js";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/stories-page.css";

function StoriesPageFallback() {
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.storiesBreadcrumbImageLight?.url && !overrides.storiesBreadcrumbImageDark?.url;

  return (
    <div id="stories-navbar-top" className="stories-page-shell">
      <BreadcrumbPageHeader
        ariaLabel="Stories"
        lightSrc={overrides.storiesBreadcrumbImageLight?.url || heroBgLight}
        darkSrc={overrides.storiesBreadcrumbImageDark?.url || heroBgDark}
        heroClassName="stories-hero"
        fetchPriority="high"
        showVMark={usesDefaultImage}
      />
      {STORIES_PILLARS.map((pillar) => (
        <StoriesPillarSection key={pillar.id} pillar={pillar} />
      ))}
    </div>
  );
}

export default function StoriesPage() {
  return <CmsAwarePage slug="stories" fallback={<StoriesPageFallback />} />;
}
