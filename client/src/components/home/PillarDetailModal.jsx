import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import { TABLER_ICON_STROKE } from "../../constants/homeIcons.js";
import "../../styles/pillar-detail-modal.css";

export default function PillarDetailModal({ pillar, onClose, knowMoreLabel }) {
  const { t } = useTranslation(["home"]);

  useEffect(() => {
    if (!pillar) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pillar, onClose]);

  if (!pillar) return null;

  const { Icon, accent, title, lead, tags, link } = pillar;

  return createPortal(
    <div
      className="pillar-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pillar-detail-modal-title"
      onClick={onClose}
    >
      <div className={`pillar-detail-modal__panel pillar-detail-modal__panel--${accent}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pillar-detail-modal__close" onClick={onClose} aria-label={t("home:pillarDetailModal.close")}>
          <IconX size={20} stroke={2} aria-hidden />
        </button>

        <div className="pillar-detail-modal__icon" aria-hidden="true">
          <Icon className="pillar-detail-modal__icon-svg" stroke={TABLER_ICON_STROKE} />
        </div>

        <h3 id="pillar-detail-modal-title" className="pillar-detail-modal__title">{title}</h3>
        <p className="pillar-detail-modal__lead">{lead}</p>
        <p className="pillar-detail-modal__tags">{tags}</p>

        <Link to={link} className="pillar-detail-modal__cta" onClick={onClose}>
          {knowMoreLabel}
          <IconArrowRight aria-hidden stroke={TABLER_ICON_STROKE} />
        </Link>
      </div>
    </div>,
    document.body
  );
}
