import { useTranslation } from "react-i18next";
import breadcrumbBgLight from "../../assets/Home/hero-bg-light-v2.png";
import breadcrumbBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/events-breadcrumb-section.css";

export default function EventsBreadcrumbSection() {
  const { t } = useTranslation(["events"]);
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.eventsBreadcrumbImageLight?.url && !overrides.eventsBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel={t("events:eventsBreadcrumb.ariaLabel")}
      lightSrc={overrides.eventsBreadcrumbImageLight?.url || breadcrumbBgLight}
      darkSrc={overrides.eventsBreadcrumbImageDark?.url || breadcrumbBgDark}
      heroClassName="events-page-hero"
      fetchPriority="high"
      showVMark={usesDefaultImage}
    />
  );
}
