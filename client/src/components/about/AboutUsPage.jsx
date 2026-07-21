import { useTranslation } from "react-i18next";
import AboutUsBreadcrumbSection from "./AboutUsBreadcrumbSection";
import AboutUsHeroSection from "./AboutUsHeroSection";
import AboutUsMissionSection from "./AboutUsMissionSection";
import AboutUsWhatWeDoSection from "./AboutUsWhatWeDoSection";
import AboutUsValuesSection from "./AboutUsValuesSection";
import TeamMembersSlider from "./TeamMembersSlider";
import OurPillarsSection from "../home/OurPillarsSection";
import PageSectionRenderer from "../cms/PageSectionRenderer.jsx";
import { useCmsPage, useCmsSeo } from "../../hooks/useCmsPage.js";
import "../../styles/about-us-page.css";

function AboutUsPageFallback({ t }) {
  return (
    <div id="about-us-navbar-top" className="about-us-page-shell">
      <AboutUsBreadcrumbSection />
      <AboutUsHeroSection />
      <AboutUsMissionSection />
      <OurPillarsSection title={t("about:page.pillarsTitle")} sectionClassName="about-us-pillars" />
      <AboutUsWhatWeDoSection />
      <AboutUsValuesSection />
      <TeamMembersSlider sectionClassName="about-us-team-section" />
    </div>
  );
}

export default function AboutUsPage() {
  const { t } = useTranslation(["about"]);
  const { data, loading, hasCms } = useCmsPage("about-us");
  useCmsSeo(data);

  const hasTeamInCms =
    hasCms &&
    (data?.sections || []).some((section) => section.sectionType === "team_members" && section.isVisible !== false);

  if (loading) {
    return (
      <div className="about-us-page-shell">
        <p className="cms-page-loading">{t("about:page.loading")}</p>
      </div>
    );
  }

  if (hasCms && data?.sections?.length) {
    return (
      <div id="about-us-navbar-top" className="about-us-page-shell">
        <PageSectionRenderer sections={data.sections} />
        {!hasTeamInCms ? <TeamMembersSlider sectionClassName="about-us-team-section" /> : null}
      </div>
    );
  }

  return <AboutUsPageFallback t={t} />;
}
