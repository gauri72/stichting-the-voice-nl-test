import InnovationBreadcrumbSection from "./InnovationBreadcrumbSection";
import InnovationHeroSection from "./InnovationHeroSection";
import InnovationDigitalSection from "./InnovationDigitalSection";
import InnovationInitiativesSection from "./InnovationInitiativesSection";
import InnovationDeliverSection from "./InnovationDeliverSection";
import InnovationCtaSection from "./InnovationCtaSection";
import VentureStudioContactSection from "../venture-studio/VentureStudioContactSection";
import "../../styles/innovation-page.css";

export default function InnovationPage() {
  return (
    <div id="innovation-navbar-top" className="innovation-page-shell">
      <InnovationBreadcrumbSection />
      <InnovationHeroSection />
      <InnovationDigitalSection />
      <InnovationInitiativesSection />
      <InnovationDeliverSection />
      <InnovationCtaSection />
      <VentureStudioContactSection />
    </div>
  );
}
