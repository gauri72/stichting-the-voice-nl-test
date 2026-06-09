import { Link } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { IconChevronRight, IconLock } from "@tabler/icons-react";
import { PROFILE_ROUTES } from "../profileUtils.js";

export default function ProfileChangePasswordCard() {
  return (
    <article className="profile-card">
      <button type="button" className="profile-card__head profile-card__head--interactive">
        <span className="profile-card__icon" aria-hidden>
          <IconLock size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">Change Password</strong>
          <span className="profile-card__subtitle">Update your password to keep your account secure.</span>
        </span>
        <IconChevronRight className="profile-card__chevron" size={18} stroke={2} aria-hidden />
      </button>

      <div className="profile-card__body profile-password__row">
        <FaLock className="profile-password__icon" aria-hidden />
        <span className="profile-password__label">Password</span>
        <span className="profile-password__divider" aria-hidden />
        <span className="profile-password__dots" aria-label="Password hidden">
          ••••••••
        </span>
        <Link to={PROFILE_ROUTES.resetPassword} className="profile-btn profile-btn--outline">
          Update
        </Link>
      </div>
    </article>
  );
}
