import { useState } from "react";
import { IconDownload, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import PwaInstallDialog from "./PwaInstallDialog.jsx";
import "../../styles/site-pwa.css";

export default function SiteInstallPwaPrompt({ embedded = false }) {
  const { t } = useTranslation(["common"]);
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isStandalonePwa() || dismissed) return null;

  return (
    <>
      <div className={`site-pwa-install${embedded ? " site-pwa-install--embedded" : ""}`}>
        <button
          type="button"
          className="site-pwa-install__fab"
          onClick={() => setDialogOpen(true)}
          aria-label={t("common:siteInstallPwaPrompt.installAriaLabel")}
        >
          <IconDownload size={20} aria-hidden stroke={1.75} />
          <span className="site-pwa-install__label">V.App</span>
        </button>
        <button
          type="button"
          className="site-pwa-install__dismiss"
          onClick={() => setDismissed(true)}
          aria-label={t("common:siteInstallPwaPrompt.dismissAriaLabel")}
        >
          <IconX size={11} />
        </button>
      </div>

      <PwaInstallDialog
        open={dialogOpen}
        variant={PWA_VARIANTS.site}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
