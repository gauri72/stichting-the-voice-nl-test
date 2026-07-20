import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconHome2, IconLayoutGrid, IconPackage, IconWallet, IconUser,
} from "@tabler/icons-react";

const TABS = [
  { key: "home",       Icon: IconHome2,       to: "/vcommerce" },
  { key: "categories", Icon: IconLayoutGrid,  to: "/vcommerce/categories" },
  { key: "orders",     Icon: IconPackage,     to: "/dashboard/vcommerce" },
  { key: "wallet",     Icon: IconWallet,      to: "/dashboard/wallet" },
  { key: "profile",    Icon: IconUser,        to: "/dashboard/profile" },
];

export default function MobileBottomNav() {
  const { t } = useTranslation(["vcommerceShop"]);
  const { pathname } = useLocation();

  const activeKey =
    pathname === "/vcommerce"          ? "home"
    : pathname.startsWith("/vcommerce/categories") ? "categories"
    : pathname.startsWith("/dashboard/vcommerce")  ? "orders"
    : pathname.startsWith("/dashboard/wallet")     ? "wallet"
    : pathname.startsWith("/dashboard/profile")    ? "profile"
    : "home";

  return (
    <nav
      className="vcohp-mob__nav"
      aria-label={t("vcommerceShop:mobileBottomNav.navAriaLabel")}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "var(--mkt-surface)",
        borderTop: "1px solid var(--mkt-border)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        zIndex: 200,
      }}
    >
      {TABS.map(({ key, Icon, to }) => {
        const isActive = key === activeKey;
        const label = t(`vcommerceShop:mobileBottomNav.tabs.${key}`);
        return (
          <Link
            key={key}
            to={to}
            className={`vcohp-mob__nav-tab${isActive ? " vcohp-mob__nav-tab--active" : ""}`}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            style={{ color: isActive ? "var(--mkt-cyan)" : "var(--mkt-text-muted)" }}
          >
            <Icon size={22} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
