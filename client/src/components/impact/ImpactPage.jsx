import breadcrumbBgLight from "../../assets/Impact/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../assets/Impact/breadcrumb-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import ImpactHerBeatsSection from "./ImpactHerBeatsSection";
import ImpactHighlightSection from "./ImpactHighlightSection";
import ImpactAreasSection from "./ImpactAreasSection";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import "../../styles/impact-page.css";

function ImpactPageFallback() {
  return (
    <div id="impact-navbar-top" className="impact-page-shell">
      <BreadcrumbPageHeader
        ariaLabel="Impact"
        lightSrc={breadcrumbBgLight}
        darkSrc={breadcrumbBgDark}
        heroClassName="impact-hero"
        fetchPriority="high"
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
