import { useState } from "react";
import { IconDownload, IconX } from "@tabler/icons-react";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import PwaInstallDialog from "./PwaInstallDialog.jsx";
import "../../styles/site-pwa.css";

export default function SiteInstallPwaPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isStandalonePwa() || dismissed) return null;

  return (
    <>
      <aside className="site-pwa-install" aria-label="Install website app">
        <div className="site-pwa-install__copy">
          <strong>Install V.O.I.C.E. app</strong>
          <p>Get quick access to events, membership, and more from your home screen.</p>
        </div>
        <div className="site-pwa-install__actions">
          <button type="button" className="site-pwa-install__primary" onClick={() => setDialogOpen(true)}>
            <IconDownload size={16} aria-hidden />
            Install
          </button>
          <button
            type="button"
            className="site-pwa-install__dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install prompt"
          >
            <IconX size={16} />
          </button>
        </div>
      </aside>

      <PwaInstallDialog
        open={dialogOpen}
        variant={PWA_VARIANTS.site}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
