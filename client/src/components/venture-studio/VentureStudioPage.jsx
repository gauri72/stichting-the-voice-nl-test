import VentureStudioHeroSection from "./VentureStudioHeroSection";
import VentureStudioMissionSection from "./VentureStudioMissionSection";
import VentureStudioHelpSection from "./VentureStudioHelpSection";
import VentureStudioSupportSection from "./VentureStudioSupportSection";
import VentureStudioFuturesSection from "./VentureStudioFuturesSection";
import VentureStudioOfferSection from "./VentureStudioOfferSection";
import VentureStudioContactSection from "./VentureStudioContactSection";
import "../../styles/venture-studio-shared.css";

export default function VentureStudioPage() {
  return (
    <div id="venture-studio-navbar-top" className="vvs-page">
      <VentureStudioHeroSection />
      <VentureStudioMissionSection />
      <VentureStudioHelpSection />
      <VentureStudioSupportSection />
      <VentureStudioFuturesSection />
      <VentureStudioOfferSection />
      <VentureStudioContactSection />
    </div>
  );
}
