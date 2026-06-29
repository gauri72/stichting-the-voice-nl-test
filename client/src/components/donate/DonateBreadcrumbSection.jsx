import breadcrumbBgLight from "../../assets/Sponsorship/breadcrumb-bg-light.png";
import breadcrumbBgDark from "../../assets/Sponsorship/breadcrumb-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/donate-breadcrumb-section.css";

export default function DonateBreadcrumbSection() {
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.donateBreadcrumbImageLight?.url && !overrides.donateBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel="Donate"
      lightSrc={overrides.donateBreadcrumbImageLight?.url || breadcrumbBgLight}
      darkSrc={overrides.donateBreadcrumbImageDark?.url || breadcrumbBgDark}
      heroClassName="donate-page-hero"
      showVMark={usesDefaultImage}
    />
  );
}
