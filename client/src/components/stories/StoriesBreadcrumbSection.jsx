import { Link } from "react-router-dom";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

export default function StoriesBreadcrumbSection() {
  return (
    <nav className="stories-breadcrumb" aria-label="Breadcrumb">
      <Link to="/" className="stories-breadcrumb__home" aria-label="Home">
        <IconHome size={16} stroke={1.8} aria-hidden />
      </Link>
      <IconChevronRight className="stories-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <Link to="/" className="stories-breadcrumb__link">
        Home
      </Link>
      <IconChevronRight className="stories-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <span className="stories-breadcrumb__current" aria-current="page">
        Stories
      </span>
    </nav>
  );
}
