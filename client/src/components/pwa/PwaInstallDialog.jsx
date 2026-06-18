import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { IconDownload, IconX } from "@tabler/icons-react";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { getPwaInstallSteps } from "../../pwa/pwaPlatform.js";
import { isStandalonePwa } from "../../pwa/manifestConfig.js";
import "../../styles/pwa-install-dialog.css";

export default function PwaInstallDialog({ open, onClose, variant = "site" }) {
  const { canInstall, promptInstall } = usePwaInstall(variant);
  const [installing, setInstalling] = useState(false);
  const guide = getPwaInstallSteps(variant);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || isStandalonePwa()) return null;

  async function handleInstallClick() {
    if (canInstall) {
      setInstalling(true);
      try {
        const accepted = await promptInstall();
        if (accepted) onClose();
      } finally {
        setInstalling(false);
      }
      return;
    }
  }

  return (
    <div className="pwa-install-dialog" role="presentation">
      <button type="button" className="pwa-install-dialog__backdrop" onClick={onClose} aria-label="Close" />
      <div
        className="pwa-install-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-dialog-title"
      >
        <header className="pwa-install-dialog__header">
          <h2 id="pwa-install-dialog-title">{guide.title}</h2>
          <button type="button" className="pwa-install-dialog__close" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </header>

        {canInstall ? (
          <div className="pwa-install-dialog__native">
            <p>Your browser supports one-tap install.</p>
            <button
              type="button"
              className="pwa-install-dialog__install-btn"
              onClick={handleInstallClick}
              disabled={installing}
            >
              <IconDownload size={18} aria-hidden />
              {installing ? "Installing…" : "Install now"}
            </button>
          </div>
        ) : (
          <ol className="pwa-install-dialog__steps">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}

        {guide.note ? <p className="pwa-install-dialog__note">{guide.note}</p> : null}

        {variant === "checkin" ? (
          <Link to="/check-in" className="pwa-install-dialog__link" onClick={onClose}>
            Open check-in page
          </Link>
        ) : null}
      </div>
    </div>
  );
}
