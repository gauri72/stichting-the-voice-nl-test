import { useTranslation } from "react-i18next";
import { InstallButton, ChatButton, ThemeToggleButton } from "./HeaderActionButtons.jsx";
import "../../styles/hero-action-cluster.css";

/**
 * Mobile-only glass button row (install / chat / theme toggle) anchored to
 * the top-right corner of the hero banner. The desktop equivalent
 * (install / language / WhatsApp) now lives in the header itself, under the
 * sign-in button — see HeaderActionRow.jsx — since desktop has room to keep
 * it in the persistent nav rather than tied to hero-only pages.
 */
export default function HeroActionCluster() {
  const { t } = useTranslation(["common"]);

  return (
    <div className="hero-action-cluster">
      <InstallButton t={t} btnClass="hero-action-cluster__btn" />
      <ChatButton t={t} btnClass="hero-action-cluster__btn" />
      <ThemeToggleButton t={t} btnClass="hero-action-cluster__btn" />
    </div>
  );
}
