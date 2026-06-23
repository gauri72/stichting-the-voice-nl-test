import AboutUsBreadcrumbSection from "./AboutUsBreadcrumbSection";
import AboutUsHeroSection from "./AboutUsHeroSection";
import AboutUsMissionSection from "./AboutUsMissionSection";
import AboutUsWhatWeDoSection from "./AboutUsWhatWeDoSection";
import AboutUsValuesSection from "./AboutUsValuesSection";
import TeamMembersSlider from "./TeamMembersSlider";
import OurPillarsSection from "../home/OurPillarsSection";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import "../../styles/about-us-page.css";

function AboutUsPageFallback() {
  return (
    <div id="about-us-navbar-top" className="about-us-page-shell">
      <AboutUsBreadcrumbSection />
      <AboutUsHeroSection />
      <AboutUsMissionSection />
      <OurPillarsSection title="Our Core Pillars" sectionClassName="about-us-pillars" />
      <AboutUsWhatWeDoSection />
      <AboutUsValuesSection />
      <TeamMembersSlider sectionClassName="about-us-team-section" />
    </div>
  );
}

export default function AboutUsPage() {
  return <CmsAwarePage slug="about-us" fallback={<AboutUsPageFallback />} />;
}
