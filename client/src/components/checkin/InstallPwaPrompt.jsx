import { useState } from "react";
import { IconDownload, IconX } from "@tabler/icons-react";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";

export default function InstallPwaPrompt({ className = "" }) {
  const { canInstall, promptInstall } = usePwaInstall(PWA_VARIANTS.checkin);
  const [dismissed, setDismissed] = useState(false);

  if (isStandalonePwa() || !canInstall || dismissed) return null;

  return (
    <div className={`checkin-pwa-install${className ? ` ${className}` : ""}`}>
      <div>
        <strong>Install Check-in app</strong>
        <p>Add to your home screen for fast door-side scanning.</p>
      </div>
      <div className="checkin-pwa-install__actions">
        <button type="button" className="checkin-pwa-install__primary" onClick={promptInstall}>
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
  );
}
