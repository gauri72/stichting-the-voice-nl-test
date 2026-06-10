import ImpactBreadcrumbSection from "./ImpactBreadcrumbSection";
import ImpactHeroSection from "./ImpactHeroSection";
import ImpactHerBeatsSection from "./ImpactHerBeatsSection";
import ImpactHighlightSection from "./ImpactHighlightSection";
import ImpactAreasSection from "./ImpactAreasSection";
import "../../styles/impact-page.css";

export default function ImpactPage() {
  return (
    <div id="impact-navbar-top" className="impact-page-shell">
      <ImpactBreadcrumbSection />
      <ImpactHeroSection />
      <ImpactHerBeatsSection />
      <ImpactHighlightSection />
      <ImpactAreasSection />
    </div>
  );
}