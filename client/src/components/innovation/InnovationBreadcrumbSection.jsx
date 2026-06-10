import { Link } from "react-router-dom";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

export default function InnovationBreadcrumbSection() {
  return (
    <nav className="innovation-breadcrumb" aria-label="Breadcrumb">
      <Link to="/" className="innovation-breadcrumb__home" aria-label="Home">
        <IconHome size={16} stroke={1.8} aria-hidden />
      </Link>
      <IconChevronRight className="innovation-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <Link to="/" className="innovation-breadcrumb__link">
        Home
      </Link>
      <IconChevronRight className="innovation-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <span className="innovation-breadcrumb__current" aria-current="page">
        V.O.I.C.E. Innovation
      </span>
    </nav>
  );
}
