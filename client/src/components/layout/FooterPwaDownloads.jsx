import { useState } from "react";
import { IconDownload } from "@tabler/icons-react";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";

function MobilePwaItem({ icon: Icon, label, subtitle, onClick }) {
  return (
    <button type="button" className="footer-mobile-quick-link footer-pwa-downloads__btn" onClick={onClick}>
      <span className="footer-mobile-quick-link__icon">
        <Icon aria-hidden stroke={1.75} />
      </span>
      <span className="footer-mobile-quick-link__label">
        <span className="footer-pwa-downloads__name">{label}</span>
        {subtitle ? <span className="footer-pwa-downloads__sub">{subtitle}</span> : null}
      </span>
    </button>
  );
}

function DesktopPwaItem({ icon: Icon, label, subtitle, onClick }) {
  return (
    <button type="button" className="footer-desktop-quick-link footer-pwa-downloads__btn" onClick={onClick}>
      <span className="footer-desktop-quick-link__icon">
        <Icon aria-hidden stroke={1.75} />
      </span>
      <span className="footer-desktop-quick-link__label">
        <span className="footer-pwa-downloads__name">{label}</span>
        {subtitle ? <span className="footer-pwa-downloads__sub">{subtitle}</span> : null}
      </span>
    </button>
  );
}

export default function FooterPwaDownloads({ variant = "mobile" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const Item = variant === "desktop" ? DesktopPwaItem : MobilePwaItem;

  if (isStandalonePwa()) return null;

  return (
    <div className="footer-pwa-downloads">
      <p className={`footer-pwa-downloads__title footer-pwa-downloads__title--${variant}`}>
        Download app
      </p>
      <div className={variant === "desktop" ? "footer-desktop-quick-grid" : "footer-mobile-quick-grid"}>
        <Item
          icon={IconDownload}
          label="V.O.I.C.E. app"
          subtitle="Install website"
          onClick={() => setDialogOpen(true)}
        />
      </div>

      <PwaInstallDialog
        open={dialogOpen}
        variant={PWA_VARIANTS.site}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
