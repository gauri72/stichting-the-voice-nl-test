import breadcrumbBgLight from "../../assets/Home/hero-bg-light-v2.png";
import breadcrumbBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import ImpactHerBeatsSection from "./ImpactHerBeatsSection";
import ImpactHighlightSection from "./ImpactHighlightSection";
import ImpactAreasSection from "./ImpactAreasSection";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/impact-page.css";

function ImpactPageFallback() {
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.impactPageBreadcrumbImageLight?.url && !overrides.impactPageBreadcrumbImageDark?.url;

  return (
    <div id="impact-navbar-top" className="impact-page-shell">
      <BreadcrumbPageHeader
        ariaLabel="Impact"
        lightSrc={overrides.impactPageBreadcrumbImageLight?.url || breadcrumbBgLight}
        darkSrc={overrides.impactPageBreadcrumbImageDark?.url || breadcrumbBgDark}
        heroClassName="impact-hero"
        fetchPriority="high"
        showVMark={usesDefaultImage}
      />
      <ImpactHerBeatsSection />
      <ImpactHighlightSection />
      <ImpactAreasSection />
    </div>
  );
}

export default function ImpactPage() {
  return <CmsAwarePage slug="impact" fallback={<ImpactPageFallback />} />;
}
