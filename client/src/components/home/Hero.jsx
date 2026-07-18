import heroBgLight from "../../assets/Home/hero-bg-light-v2.png";
import heroBgDark from "../../assets/Home/hero-bg-dark.png";
import BreadcrumbPageHeader from "../layout/BreadcrumbPageHeader.jsx";

export default function Hero() {
  return (
    <BreadcrumbPageHeader
      ariaLabel="Stichting The V.O.I.C.E. NL"
      lightSrc={heroBgLight}
      darkSrc={heroBgDark}
      heroClassName="hero-section"
      fetchPriority="high"
      showVMark
    />
  );
}
