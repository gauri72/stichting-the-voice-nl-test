import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import DashboardMembershipCardSection from "./DashboardMembershipCardSection.jsx";
import "../../../styles/dashboard-membership-modal.css";

export default function DashboardMembershipModal({ open, onClose, ...cardProps }) {
  const { t } = useTranslation(["common"]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="dash-membership-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="dash-membership-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="dash-membership-modal__close"
          onClick={onClose}
          aria-label={t("common:buttons.close")}
        >
          <IconX size={20} stroke={2} aria-hidden />
        </button>
        <DashboardMembershipCardSection {...cardProps} sectionId={null} compact />
      </div>
    </div>,
    document.body
  );
}
