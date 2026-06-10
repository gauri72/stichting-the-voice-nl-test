import { Link } from "react-router-dom";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

export default function ImpactBreadcrumbSection() {
  return (
    <nav className="impact-breadcrumb" aria-label="Breadcrumb">
      <Link to="/" className="impact-breadcrumb__home" aria-label="Home">
        <IconHome size={16} stroke={1.8} aria-hidden />
      </Link>
      <IconChevronRight className="impact-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <Link to="/" className="impact-breadcrumb__link">
        Home
      </Link>
      <IconChevronRight className="impact-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <span className="impact-breadcrumb__current" aria-current="page">
        V.O.I.C.E. Impact
      </span>
    </nav>
  );
}
