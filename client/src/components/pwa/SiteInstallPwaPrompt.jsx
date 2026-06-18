import { useState } from "react";
import { IconDownload, IconX } from "@tabler/icons-react";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import "../../styles/site-pwa.css";

export default function SiteInstallPwaPrompt() {
  const { canInstall, promptInstall } = usePwaInstall(PWA_VARIANTS.site);
  const [dismissed, setDismissed] = useState(false);

  if (isStandalonePwa() || !canInstall || dismissed) return null;

  return (
    <aside className="site-pwa-install" aria-label="Install website app">
      <div className="site-pwa-install__copy">
        <strong>Install V.O.I.C.E. app</strong>
        <p>Get quick access to events, membership, and more from your home screen.</p>
      </div>
      <div className="site-pwa-install__actions">
        <button type="button" className="site-pwa-install__primary" onClick={promptInstall}>
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
  );
}
