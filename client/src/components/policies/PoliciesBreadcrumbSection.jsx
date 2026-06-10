import { Link } from "react-router-dom";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

export default function PoliciesBreadcrumbSection() {
  return (
    <nav className="policies-breadcrumb" aria-label="Breadcrumb">
      <Link to="/" className="policies-breadcrumb__home" aria-label="Home">
        <IconHome size={16} stroke={1.8} aria-hidden />
      </Link>
      <IconChevronRight className="policies-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <Link to="/" className="policies-breadcrumb__link">
        Home
      </Link>
      <IconChevronRight className="policies-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <span className="policies-breadcrumb__current" aria-current="page">
        Policies, Terms &amp; Conditions
      </span>
    </nav>
  );
}
