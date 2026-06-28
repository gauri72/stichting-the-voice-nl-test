import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IconX } from "@tabler/icons-react";
import LoginFormSection from "../login/LoginFormSection.jsx";
import "../../styles/login-modal.css";

export default function LoginModal({ open, onClose, onAuthenticated, returnTo, prefillEmail, initialMode = "login" }) {
  const { t } = useTranslation(["auth"]);
  const [mode, setMode] = useState(initialMode);

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

  useEffect(() => {
    if (open) setMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="login-modal" role="dialog" aria-modal="true" aria-label={t("auth:modal.ariaLabel")} onClick={onClose}>
      <div className="login-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="login-modal__close" onClick={onClose} aria-label={t("auth:modal.close")}>
          <IconX size={20} stroke={2} aria-hidden />
        </button>
        <LoginFormSection
          mode={mode}
          onModeChange={setMode}
          returnTo={returnTo}
          prefillEmail={prefillEmail}
          onAuthenticated={onAuthenticated}
        />
      </div>
    </div>,
    document.body
  );
}
