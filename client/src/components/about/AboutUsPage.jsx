import AboutUsBreadcrumbSection from "./AboutUsBreadcrumbSection";
import AboutUsHeroSection from "./AboutUsHeroSection";
import AboutUsMissionSection from "./AboutUsMissionSection";
import AboutUsWhatWeDoSection from "./AboutUsWhatWeDoSection";
import AboutUsValuesSection from "./AboutUsValuesSection";
import OurTeamSection from "../home/OurTeamSection";
import OurPillarsSection from "../home/OurPillarsSection";
import "../../styles/about-us-page.css";

export default function AboutUsPage() {
  return (
    <div id="about-us-navbar-top" className="about-us-page-shell">
      <AboutUsBreadcrumbSection />
      <AboutUsHeroSection />
      <AboutUsMissionSection />
      <OurPillarsSection title="Our Core Pillars" sectionClassName="about-us-pillars" />
      <AboutUsWhatWeDoSection />
      <AboutUsValuesSection />
      <OurTeamSection sectionClassName="about-us-team-section" marquee />
    </div>
  );
}
