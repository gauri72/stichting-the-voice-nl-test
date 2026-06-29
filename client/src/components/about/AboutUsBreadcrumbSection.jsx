import heroBgLight from "../../assets/Home/hero-bg-light.png";
import heroBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/about-us-breadcrumb-section.css";

export default function AboutUsBreadcrumbSection() {
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.aboutUsBreadcrumbImageLight?.url && !overrides.aboutUsBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel="About Us"
      lightSrc={overrides.aboutUsBreadcrumbImageLight?.url || heroBgLight}
      darkSrc={overrides.aboutUsBreadcrumbImageDark?.url || heroBgDark}
      heroClassName="about-us-page-hero"
      fetchPriority="high"
      showVMark={usesDefaultImage}
    />
  );
}
