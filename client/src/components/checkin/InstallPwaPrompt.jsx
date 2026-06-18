import { useState } from "react";
import { IconDownload, IconX } from "@tabler/icons-react";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";

export default function InstallPwaPrompt({ className = "" }) {
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isStandalonePwa() || dismissed) return null;

  return (
    <>
      <div className={`checkin-pwa-install${className ? ` ${className}` : ""}`}>
        <div>
          <strong>Install Check-in app</strong>
          <p>Add to your home screen for fast door-side scanning.</p>
        </div>
        <div className="checkin-pwa-install__actions">
          <button type="button" className="checkin-pwa-install__primary" onClick={() => setDialogOpen(true)}>
            <IconDownload size={16} aria-hidden />
            Install
          </button>
          <button
            type="button"
            className="checkin-pwa-install__dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install prompt"
          >
            <IconX size={16} />
          </button>
        </div>
      </div>

      <PwaInstallDialog
        open={dialogOpen}
        variant={PWA_VARIANTS.checkin}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
