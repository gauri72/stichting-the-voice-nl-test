import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PoliciesBreadcrumbSection from "./PoliciesBreadcrumbSection";
import PoliciesHeroSection from "./PoliciesHeroSection";
import PoliciesCommitmentSection from "./PoliciesCommitmentSection";
import PoliciesGridSection from "./PoliciesGridSection";
import PoliciesTermsBannerSection from "./PoliciesTermsBannerSection";
import PoliciesHelpSection from "./PoliciesHelpSection";
import PoliciesDisclaimerSection from "./PoliciesDisclaimerSection";
import PoliciesDetailSection from "./PoliciesDetailSection";
import CmsAwarePage from "../cms/CmsAwarePage.jsx";
import "../../styles/policies-page.css";

function PoliciesPageFallback() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/terms-and-conditions") return;

    const timer = window.setTimeout(() => {
      document.getElementById("terms-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div id="policies-navbar-top" className="policies-page-shell">
      <PoliciesBreadcrumbSection />
      <PoliciesHeroSection />
      <PoliciesCommitmentSection />
      <PoliciesGridSection />
      <PoliciesTermsBannerSection />
      <PoliciesHelpSection />
      <PoliciesDisclaimerSection />
      <PoliciesDetailSection />
    </div>
  );
}

export default function PoliciesPage() {
  const { pathname } = useLocation();
  const slug = pathname.includes("terms-and-conditions")
    ? "terms-and-conditions"
    : "privacy-policy";

  return <CmsAwarePage slug={slug} fallback={<PoliciesPageFallback />} />;
}
