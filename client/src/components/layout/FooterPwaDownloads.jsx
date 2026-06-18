import { useState } from "react";
import { IconDeviceMobile, IconDownload, IconQrcode } from "@tabler/icons-react";
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
  const [activeDialog, setActiveDialog] = useState(null);
  const standalone = isStandalonePwa();
  const Item = variant === "desktop" ? DesktopPwaItem : MobilePwaItem;
  const gridClass =
    variant === "desktop" ? "footer-desktop-quick-grid" : "footer-mobile-quick-grid";

  if (standalone) {
    return (
      <div className="footer-pwa-downloads">
        <p className={`footer-pwa-downloads__title footer-pwa-downloads__title--${variant}`}>
          Download apps
        </p>
        <div className={gridClass}>
          <Item
            icon={IconQrcode}
            label="Check-in app"
            subtitle="QR ticket scanning"
            onClick={() => setActiveDialog(PWA_VARIANTS.checkin)}
          />
        </div>
        <PwaInstallDialog
          open={activeDialog === PWA_VARIANTS.checkin}
          variant={PWA_VARIANTS.checkin}
          onClose={() => setActiveDialog(null)}
        />
      </div>
    );
  }

  return (
    <div className="footer-pwa-downloads">
      <p className={`footer-pwa-downloads__title footer-pwa-downloads__title--${variant}`}>
        Download apps
      </p>
      <div className={gridClass}>
        <Item
          icon={IconDownload}
          label="V.O.I.C.E. app"
          subtitle="Install website"
          onClick={() => setActiveDialog(PWA_VARIANTS.site)}
        />
        <Item
          icon={IconQrcode}
          label="Check-in app"
          subtitle="QR ticket scanning"
          onClick={() => setActiveDialog(PWA_VARIANTS.checkin)}
        />
      </div>

      <PwaInstallDialog
        open={activeDialog === PWA_VARIANTS.site}
        variant={PWA_VARIANTS.site}
        onClose={() => setActiveDialog(null)}
      />
      <PwaInstallDialog
        open={activeDialog === PWA_VARIANTS.checkin}
        variant={PWA_VARIANTS.checkin}
        onClose={() => setActiveDialog(null)}
      />
    </div>
  );
}
