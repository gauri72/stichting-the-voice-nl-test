import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IconBrandLinkedin,
  IconChevronLeft,
  IconChevronRight,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { getInitials, resolveTeamMemberImage } from "../../data/teamMembers.js";
import "../../styles/team-member-modal.css";

function ModalPhoto({ member }) {
  const src = resolveTeamMemberImage(member);
  const name = member?.fullName || member?.name || "";
  const initials = member?.initials || getInitials(name);

  if (src) {
    return <img className="tms-modal__photo" src={src} alt={name} />;
  }

  return (
    <div className="tms-modal__photo tms-modal__photo--initials" aria-hidden>
      {initials}
    </div>
  );
}

export default function TeamMemberModal({ members = [], activeIndex = -1, onClose, onNext, onPrev }) {
  const member = activeIndex >= 0 ? members[activeIndex] : null;
  const touchStart = useRef(null);
  const touchMove = useRef(null);

  useEffect(() => {
    if (!member) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight") onNext?.();
      if (event.key === "ArrowLeft") onPrev?.();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [member, onClose, onNext, onPrev]);

  if (!member) return null;

  const name = member.fullName || member.name || "";
  const role = member.role || "";
  const category = member.teamCategory || "";
  const bio = member.biography || "";

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchMove.current = null;
  }

  function handleTouchMove(event) {
    const touch = event.touches?.[0];
    if (!touch || !touchStart.current) return;
    touchMove.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd() {
    if (!touchStart.current || !touchMove.current) return;
    const dx = touchMove.current.x - touchStart.current.x;
    const dy = touchMove.current.y - touchStart.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNext?.();
      else onPrev?.();
    } else if (dy > 90) {
      onClose?.();
    }
    touchStart.current = null;
    touchMove.current = null;
  }

  return createPortal(
    <div className="tms-modal" role="dialog" aria-modal="true" aria-labelledby="tms-modal-title" onClick={onClose}>
      <div
        className="tms-modal__panel"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button type="button" className="tms-modal__close" onClick={onClose} aria-label="Close">
          <IconX size={22} stroke={2} aria-hidden />
        </button>

        <button type="button" className="tms-modal__nav tms-modal__nav--prev" onClick={onPrev} aria-label="Previous team member">
          <IconChevronLeft size={18} />
        </button>
        <button type="button" className="tms-modal__nav tms-modal__nav--next" onClick={onNext} aria-label="Next team member">
          <IconChevronRight size={18} />
        </button>

        <div className="tms-modal__body">
          <div className="tms-modal__hero">
            <ModalPhoto member={member} />
          </div>
          <div className="tms-modal__content">
            {member.isBoardMember ? <span className="tms-modal__chip tms-modal__chip--board">Board Member</span> : null}
            {member.designation ? <span className="tms-modal__chip">{member.designation}</span> : null}
            <h2 id="tms-modal-title" className="tms-modal__title">{name}</h2>
            <p className="tms-modal__role">{role}</p>
            {category ? <p className="tms-modal__category">{category}</p> : null}
            {member.yearsWithVoice ? (
              <p className="tms-modal__years">{member.yearsWithVoice} with V.O.I.C.E. NL</p>
            ) : null}
            {bio ? <p className="tms-modal__bio">{bio}</p> : (
              <p className="tms-modal__bio tms-modal__bio--placeholder">
                A dedicated member of the V.O.I.C.E. NL community helping shape events, culture and impact.
              </p>
            )}
            <div className="tms-modal__links">
              {member.linkedinUrl ? (
                <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="tms-modal__link">
                  <IconBrandLinkedin size={18} stroke={1.75} aria-hidden />
                  LinkedIn
                </a>
              ) : null}
              {member.email ? (
                <a href={`mailto:${member.email}`} className="tms-modal__link">
                  <IconMail size={18} stroke={1.75} aria-hidden />
                  {member.email}
                </a>
              ) : null}
            </div>
            <div className="tms-modal__footer">
              <button type="button" className="tms-modal__footer-btn" onClick={onPrev}>Previous</button>
              <button type="button" className="tms-modal__footer-btn" onClick={onNext}>Next</button>
              <button type="button" className="tms-modal__footer-btn tms-modal__footer-btn--close" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
