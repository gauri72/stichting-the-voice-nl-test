import DonateHeroSection from "./DonateHeroSection";
import DonateChooseImpactSection from "./DonateChooseImpactSection";
import DonateAllocationSection from "./DonateAllocationSection";
import DonateRealImpactSection from "./DonateRealImpactSection";
import DonateOtherWaysSection from "./DonateOtherWaysSection";

export default function DonatePage() {
  return (
    <div id="donate-navbar-top">
      <DonateHeroSection />
      <DonateChooseImpactSection />
      <DonateAllocationSection />
      <DonateRealImpactSection />
      <DonateOtherWaysSection />
    </div>
  );
}
