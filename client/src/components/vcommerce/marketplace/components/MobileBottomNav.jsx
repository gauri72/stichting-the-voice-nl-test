import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IconHome2, IconLayoutGrid, IconPackage, IconWallet, IconUser,
} from "@tabler/icons-react";

const TABS = [
  { key: "home",       label: "Home",       Icon: IconHome2,       to: "/vcommerce" },
  { key: "categories", label: "Categories", Icon: IconLayoutGrid,  to: "/vcommerce/categories" },
  { key: "orders",     label: "Orders",     Icon: IconPackage,     to: "/dashboard/vcommerce" },
  { key: "wallet",     label: "V.Wallet",   Icon: IconWallet,      to: "/dashboard/wallet" },
  { key: "profile",    label: "Profile",    Icon: IconUser,        to: "/dashboard/profile" },
];

export default function MobileBottomNav() {
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
      aria-label="Marketplace navigation"
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
      {TABS.map(({ key, label, Icon, to }) => {
        const isActive = key === activeKey;
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
