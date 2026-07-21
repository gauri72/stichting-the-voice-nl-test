import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconDownload, IconMessageCircle, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import { buildWhatsAppHref } from "../../constants/siteLinks.js";
import "../../styles/hero-action-cluster.css";

function InstallButton({ t }) {
  const [open, setOpen] = useState(false);
  if (isStandalonePwa()) return null;
  return (
    <>
      <button
        type="button"
        className="hero-action-cluster__btn hero-action-cluster__btn--install"
        onClick={() => setOpen(true)}
        aria-label={t("common:heroActionCluster.installAriaLabel")}
      >
        <IconDownload size={15} stroke={1.75} />
      </button>
      <PwaInstallDialog open={open} variant={PWA_VARIANTS.site} onClose={() => setOpen(false)} />
    </>
  );
}

function ChatButton({ t }) {
  return (
    <a
      className="hero-action-cluster__btn hero-action-cluster__btn--chat"
      href={buildWhatsAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("common:heroActionCluster.whatsappAriaLabel")}
    >
      <IconMessageCircle size={15} stroke={1.75} />
    </a>
  );
}

function ThemeToggleButton({ t }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="hero-action-cluster__btn hero-action-cluster__btn--theme"
      onClick={toggleTheme}
      aria-label={t("common:themeToggle.chooseTheme")}
    >
      {isDark ? <IconSun size={15} stroke={1.75} /> : <IconMoon size={15} stroke={1.75} />}
    </button>
  );
}

/**
 * Mobile-only glass button row (install / chat / theme toggle) anchored to
 * the top-right corner of the hero banner. The desktop equivalent
 * (install / language / WhatsApp / theme) lives in the header itself, under
 * the sign-in button — see HeaderActionRow.jsx.
 */
export default function HeroActionCluster() {
  const { t } = useTranslation(["common"]);

  return (
    <div className="hero-action-cluster">
      <InstallButton t={t} />
      <ChatButton t={t} />
      <ThemeToggleButton t={t} />
    </div>
  );
}
