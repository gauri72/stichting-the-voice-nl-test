import { Link } from "react-router-dom";
import { IconHome } from "@tabler/icons-react";
import { PROFILE_ROUTES } from "../profileUtils.js";

export default function ProfileBreadcrumbs() {
  return (
    <nav className="profile-breadcrumbs" aria-label="Breadcrumb">
      <Link to={PROFILE_ROUTES.dashboard} className="profile-breadcrumbs__home" aria-label="Dashboard">
        <IconHome size={14} stroke={1.75} />
      </Link>
      <span className="profile-breadcrumbs__sep" aria-hidden>
        ›
      </span>
      <Link to={PROFILE_ROUTES.dashboard} className="profile-breadcrumbs__link">
        Dashboard
      </Link>
      <span className="profile-breadcrumbs__sep" aria-hidden>
        ›
      </span>
      <Link to={PROFILE_ROUTES.dashboard} className="profile-breadcrumbs__link">
        My Dashboard
      </Link>
      <span className="profile-breadcrumbs__sep" aria-hidden>
        ›
      </span>
      <span className="profile-breadcrumbs__current" aria-current="page">
        Overview
      </span>
    </nav>
  );
}
