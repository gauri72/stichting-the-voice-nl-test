import { Link } from "react-router-dom";
import { IconDeviceMobile, IconDownload, IconQrcode } from "@tabler/icons-react";
import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";

function MobilePwaItem({ icon: Icon, label, subtitle, onClick, to }) {
  const content = (
    <>
      <span className="footer-mobile-quick-link__icon">
        <Icon aria-hidden stroke={1.75} />
      </span>
      <span className="footer-mobile-quick-link__label">
        <span className="footer-pwa-downloads__name">{label}</span>
        {subtitle ? <span className="footer-pwa-downloads__sub">{subtitle}</span> : null}
      </span>
      {to ? (
        <span className="footer-mobile-quick-link__chevron" aria-hidden="true">
          &gt;
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="footer-mobile-quick-link footer-pwa-downloads__btn" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className="footer-mobile-quick-link">
      {content}
    </Link>
  );
}

function DesktopPwaItem({ icon: Icon, label, subtitle, onClick, to }) {
  const content = (
    <>
      <span className="footer-desktop-quick-link__icon">
        <Icon aria-hidden stroke={1.75} />
      </span>
      <span className="footer-desktop-quick-link__label">
        <span className="footer-pwa-downloads__name">{label}</span>
        {subtitle ? <span className="footer-pwa-downloads__sub">{subtitle}</span> : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="footer-desktop-quick-link footer-pwa-downloads__btn" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className="footer-desktop-quick-link">
      {content}
    </Link>
  );
}

export default function FooterPwaDownloads({ variant = "mobile" }) {
  const { canInstall, promptInstall } = usePwaInstall(PWA_VARIANTS.site);
  const standalone = isStandalonePwa();
  const Item = variant === "desktop" ? DesktopPwaItem : MobilePwaItem;
  const gridClass =
    variant === "desktop" ? "footer-desktop-quick-grid" : "footer-mobile-quick-grid";

  return (
    <div className="footer-pwa-downloads">
      <p className={`footer-pwa-downloads__title footer-pwa-downloads__title--${variant}`}>
        Download apps
      </p>
      <div className={gridClass}>
        {!standalone ? (
          canInstall ? (
            <Item
              icon={IconDownload}
              label="V.O.I.C.E. app"
              subtitle="Install website"
              onClick={promptInstall}
            />
          ) : (
            <Item
              icon={IconDeviceMobile}
              label="V.O.I.C.E. app"
              subtitle="Add to home screen"
              to="/"
            />
          )
        ) : null}
        <Item
          icon={IconQrcode}
          label="Check-in app"
          subtitle="QR ticket scanning"
          to="/check-in"
        />
      </div>
    </div>
  );
}
