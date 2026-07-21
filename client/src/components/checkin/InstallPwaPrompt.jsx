import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconDownload, IconX } from "@tabler/icons-react";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";

export default function InstallPwaPrompt({ className = "" }) {
  const { t } = useTranslation(["checkin"]);
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isStandalonePwa() || dismissed) return null;

  return (
    <>
      <div className={`checkin-pwa-install${className ? ` ${className}` : ""}`}>
        <div>
          <strong>{t("checkin:installPrompt.title")}</strong>
          <p>{t("checkin:installPrompt.body")}</p>
        </div>
        <div className="checkin-pwa-install__actions">
          <button type="button" className="checkin-pwa-install__primary" onClick={() => setDialogOpen(true)}>
            <IconDownload size={16} aria-hidden />
            {t("checkin:installPrompt.install")}
          </button>
          <button
            type="button"
            className="checkin-pwa-install__dismiss"
            onClick={() => setDismissed(true)}
            aria-label={t("checkin:installPrompt.dismissAria")}
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
