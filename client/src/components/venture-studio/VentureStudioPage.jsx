import VentureStudioHeroSection from "./VentureStudioHeroSection";
import VentureStudioLayoutSection from "./VentureStudioLayoutSection";
import VentureStudioContactSection from "./VentureStudioContactSection";
import "../../styles/venture-studio-shared.css";

export default function VentureStudioPage() {
  return (
    <div id="venture-studio-navbar-top" className="vvs-page">
      <VentureStudioHeroSection />
      <VentureStudioLayoutSection />
      <VentureStudioContactSection />
    </div>
  );
}
