import { useTranslation } from "react-i18next";
import heroBgLight from "../../assets/Home/hero-bg-light-v2.png";
import heroBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";

export default function Hero() {
  const { t } = useTranslation(["home"]);

  return (
    <BreadcrumbPageHeader
      ariaLabel={t("home:hero.ariaLabel")}
      lightSrc={heroBgLight}
      darkSrc={heroBgDark}
      heroClassName="hero-section"
      fetchPriority="high"
      showVMark
    />
  );
}
