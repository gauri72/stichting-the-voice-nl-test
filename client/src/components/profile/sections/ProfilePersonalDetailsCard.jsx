import { FaEnvelope, FaIdCard, FaPhone } from "react-icons/fa";
import { IconChevronRight, IconUser } from "@tabler/icons-react";

export default function ProfilePersonalDetailsCard({ fullName, email, phone }) {
  return (
    <article className="profile-card">
      <button type="button" className="profile-card__head profile-card__head--interactive">
        <span className="profile-card__icon" aria-hidden>
          <IconUser size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">Personal Details</strong>
          <span className="profile-card__subtitle">View and update your personal information.</span>
        </span>
        <IconChevronRight className="profile-card__chevron" size={18} stroke={2} aria-hidden />
      </button>

      <div className="profile-card__body profile-personal__grid">
        <div className="profile-personal__item">
          <FaIdCard aria-hidden />
          <span>{fullName || "—"}</span>
        </div>
        <span className="profile-personal__divider" aria-hidden />
        <div className="profile-personal__item">
          <FaEnvelope aria-hidden />
          <span>{email || "—"}</span>
        </div>
        <span className="profile-personal__divider" aria-hidden />
        <div className="profile-personal__item">
          <FaPhone aria-hidden />
          <span>{phone || "—"}</span>
        </div>
      </div>
    </article>
  );
}
