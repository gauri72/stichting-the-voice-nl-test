import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconDownload, IconBrandWhatsapp } from "@tabler/icons-react";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import { buildWhatsAppHref } from "../../constants/siteLinks.js";
import "../../styles/hero-action-cluster.css";

/**
 * V.App install / language / WhatsApp, as a glass button row anchored below
 * the "V." mark on the hero banner — replaces the equivalent global floating
 * buttons on pages that render this (hidden via CSS, see hero-action-cluster.css).
 */
export default function HeroActionCluster() {
  const { t } = useTranslation(["common"]);
  const [installOpen, setInstallOpen] = useState(false);
  const showInstall = !isStandalonePwa();

  return (
    <div className="hero-action-cluster">
      {showInstall && (
        <button
          type="button"
          className="hero-action-cluster__btn hero-action-cluster__btn--install"
          onClick={() => setInstallOpen(true)}
          aria-label={t("common:heroActionCluster.installAriaLabel")}
        >
          <IconDownload size={17} stroke={1.75} />
        </button>
      )}

      <LanguageSwitcher header />

      <a
        className="hero-action-cluster__btn hero-action-cluster__btn--whatsapp"
        href={buildWhatsAppHref()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("common:heroActionCluster.whatsappAriaLabel")}
      >
        <IconBrandWhatsapp size={17} stroke={1.75} />
      </a>

      {showInstall && (
        <PwaInstallDialog open={installOpen} variant={PWA_VARIANTS.site} onClose={() => setInstallOpen(false)} />
      )}
    </div>
  );
}
