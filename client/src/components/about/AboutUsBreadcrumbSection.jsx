import { useTranslation } from "react-i18next";
import heroBgLight from "../../assets/Home/hero-bg-light-v2.png";
import heroBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/about-us-breadcrumb-section.css";

export default function AboutUsBreadcrumbSection() {
  const { t } = useTranslation(["about"]);
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.aboutUsBreadcrumbImageLight?.url && !overrides.aboutUsBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel={t("about:aboutBreadcrumb.ariaLabel")}
      lightSrc={overrides.aboutUsBreadcrumbImageLight?.url || heroBgLight}
      darkSrc={overrides.aboutUsBreadcrumbImageDark?.url || heroBgDark}
      heroClassName="about-us-page-hero"
      fetchPriority="high"
      showVMark={usesDefaultImage}
    />
  );
}
