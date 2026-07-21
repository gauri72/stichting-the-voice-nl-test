import { useTranslation } from "react-i18next";
import breadcrumbBgLight from "../../assets/Home/hero-bg-light-v2.png";
import breadcrumbBgDark from "../../assets/Membership/breadcrumb-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import "../../styles/membership-breadcrumb-section.css";

export default function MembershipBreadcrumbSection() {
  const { t } = useTranslation(["membership"]);
  const overrides = useContentOverrides();
  const usesDefaultImage =
    !overrides.membershipBreadcrumbImageLight?.url && !overrides.membershipBreadcrumbImageDark?.url;

  return (
    <BreadcrumbPageHeader
      ariaLabel={t("membership:membershipBreadcrumb.ariaLabel")}
      lightSrc={overrides.membershipBreadcrumbImageLight?.url || breadcrumbBgLight}
      darkSrc={overrides.membershipBreadcrumbImageDark?.url || breadcrumbBgDark}
      heroClassName="membership-page-hero"
      showVMark={usesDefaultImage}
    />
  );
}
