import breadcrumbBgLight from "../../assets/Home/hero-bg-light-v2.png";
import breadcrumbBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/sponsorship-breadcrumb-section.css";

export default function SponsorshipBreadcrumbSection() {
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.sponsorshipBreadcrumbImageLight?.url && !overrides.sponsorshipBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel="Sponsorship"
      lightSrc={overrides.sponsorshipBreadcrumbImageLight?.url || breadcrumbBgLight}
      darkSrc={overrides.sponsorshipBreadcrumbImageDark?.url || breadcrumbBgDark}
      heroClassName="sponsorship-page-hero"
      showVMark={usesDefaultImage}
    />
  );
}
