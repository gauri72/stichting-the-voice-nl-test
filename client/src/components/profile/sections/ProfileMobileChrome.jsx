import { Link } from "react-router-dom";
import { IconBell, IconChevronDown } from "@tabler/icons-react";
import headerLogo from "../../../assets/header-logo.png";
import { PROFILE_ROUTES } from "../profileUtils.js";

export default function ProfileMobileChrome({ initials }) {
  return (
    <div className="profile-chrome" aria-label="Profile navigation">
      <Link to={PROFILE_ROUTES.dashboard} className="profile-chrome__logo" aria-label="Dashboard">
        <img src={headerLogo} alt="" decoding="async" />
      </Link>

      <div className="profile-chrome__actions">
        <button type="button" className="profile-chrome__icon-btn" aria-label="Notifications">
          <IconBell size={20} stroke={1.75} />
        </button>
        <button type="button" className="profile-chrome__user" aria-label="Account menu">
          <span className="profile-chrome__avatar">{initials}</span>
          <IconChevronDown size={16} stroke={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
