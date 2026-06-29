import PageBreadcrumbHero from "./PageBreadcrumbHero.jsx";
import VoiceBrandReveal from "./VoiceBrandReveal.jsx";
import "../../styles/breadcrumb-page-header.css";

/**
 * Standard page top: breadcrumb banner image, then cinematic brand strip, then page body.
 */
export default function BreadcrumbPageHeader({
  ariaLabel,
  lightSrc,
  darkSrc,
  heroClassName = "",
  fetchPriority = "auto",
  showVMark = false,
}) {
  return (
    <div className="breadcrumb-page-header">
      <PageBreadcrumbHero
        className={heroClassName}
        ariaLabel={ariaLabel}
        lightSrc={lightSrc}
        darkSrc={darkSrc}
        fetchPriority={fetchPriority}
        showVMark={showVMark}
      />
      <VoiceBrandReveal />
    </div>
  );
}
