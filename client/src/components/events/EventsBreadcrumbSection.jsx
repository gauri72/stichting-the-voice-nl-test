import breadcrumbBgLight from "../../assets/Home/hero-bg-light-v2.png";
import breadcrumbBgDark from "../../assets/Events/breadcrumb-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/events-breadcrumb-section.css";

export default function EventsBreadcrumbSection() {
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.eventsBreadcrumbImageLight?.url && !overrides.eventsBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel="Experience"
      lightSrc={overrides.eventsBreadcrumbImageLight?.url || breadcrumbBgLight}
      darkSrc={overrides.eventsBreadcrumbImageDark?.url || breadcrumbBgDark}
      heroClassName="events-page-hero"
      fetchPriority="high"
      showVMark={usesDefaultImage}
    />
  );
}
