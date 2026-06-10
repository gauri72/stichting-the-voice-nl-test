import { Link } from "react-router-dom";
import { IconChevronRight, IconHome } from "@tabler/icons-react";
import "../../styles/about-us-page.css";

export default function AboutUsBreadcrumbSection() {
  return (
    <nav className="about-us-breadcrumb" aria-label="Breadcrumb">
      <Link to="/" className="about-us-breadcrumb__home" aria-label="Home">
        <IconHome size={16} stroke={1.8} aria-hidden />
      </Link>
      <IconChevronRight className="about-us-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <Link to="/" className="about-us-breadcrumb__link">
        Home
      </Link>
      <IconChevronRight className="about-us-breadcrumb__sep" size={14} stroke={2} aria-hidden />
      <span className="about-us-breadcrumb__current" aria-current="page">
        About Us
      </span>
    </nav>
  );
}
