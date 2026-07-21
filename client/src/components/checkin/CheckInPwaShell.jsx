import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconDownload, IconLogout, IconWifi, IconWifiOff } from "@tabler/icons-react";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { isStandalonePwa, PWA_VARIANTS } from "../../pwa/manifestConfig.js";
import PwaInstallDialog from "../pwa/PwaInstallDialog.jsx";
import "../../styles/checkin-pwa.css";

export default function CheckInPwaShell({ children }) {
  const { t } = useTranslation(["checkin"]);
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [installOpen, setInstallOpen] = useState(false);
  const standalone = isStandalonePwa();
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true, state: { from: "/check-in" } });
  }

  return (
    <div className="checkin-pwa-shell">
      <header className="checkin-pwa-shell__header">
        <div className="checkin-pwa-shell__brand">
          <span className="checkin-pwa-shell__mark" aria-hidden>V.</span>
          <div>
            <p className="checkin-pwa-shell__title">{t("checkin:pwaShell.title")}</p>
            <p className="checkin-pwa-shell__subtitle">{t("checkin:pwaShell.subtitle")}</p>
          </div>
        </div>

        <div className="checkin-pwa-shell__actions">
          <span
            className={`checkin-pwa-shell__status${online ? " checkin-pwa-shell__status--online" : ""}`}
            title={online ? t("checkin:pwaShell.onlineStatus") : t("checkin:pwaShell.offlineStatus")}
          >
            {online ? <IconWifi size={18} /> : <IconWifiOff size={18} />}
          </span>

          {!standalone ? (
            <button type="button" className="checkin-pwa-shell__install" onClick={() => setInstallOpen(true)}>
              <IconDownload size={16} aria-hidden />
              {t("checkin:pwaShell.install")}
            </button>
          ) : null}

          <button type="button" className="checkin-pwa-shell__logout" onClick={handleLogout} aria-label={t("checkin:pwaShell.logoutAria")}>
            <IconLogout size={18} />
          </button>
        </div>
      </header>

      {admin ? (
        <p className="checkin-pwa-shell__staff">
          {t("checkin:pwaShell.signedInAs", { name: admin.email || admin.name || t("checkin:pwaShell.adminFallback") })}
        </p>
      ) : null}

      {!standalone ? (
        <p className="checkin-pwa-shell__tip">
          {t("checkin:pwaShell.installTip")}
          {" "}
          <Link to="/admin/check-in">{t("checkin:pwaShell.openInAdminPanel")}</Link>
        </p>
      ) : null}

      <main className="checkin-pwa-shell__main">{children}</main>

      <PwaInstallDialog
        open={installOpen}
        variant={PWA_VARIANTS.checkin}
        onClose={() => setInstallOpen(false)}
      />
    </div>
  );
}
