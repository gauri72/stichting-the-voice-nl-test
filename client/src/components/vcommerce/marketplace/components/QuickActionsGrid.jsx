import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconBuildingStore, IconCategory, IconHeartFilled, IconWallet,
  IconTruckDelivery, IconBrandSafari, IconShieldCheck, IconStar,
} from "@tabler/icons-react";

const ACTIONS = [
  { key: "shops",      Icon: IconBuildingStore, to: "/vcommerce/businesses",  iconClass: "vcohp-mob__qa-icon--teal" },
  { key: "categories", Icon: IconCategory,      to: "/vcommerce/categories",  iconClass: "vcohp-mob__qa-icon--purple" },
  { key: "favourites", Icon: IconHeartFilled,   to: "/vcommerce/favourites",  iconClass: "vcohp-mob__qa-icon--pink" },
  { key: "wallet",     Icon: IconWallet,        to: "/dashboard/wallet",      iconClass: "vcohp-mob__qa-icon--gold" },
  { key: "deals",      Icon: IconBrandSafari,   to: "/vcommerce/deals",       iconClass: "vcohp-mob__qa-icon--green" },
  { key: "deliver",    Icon: IconTruckDelivery, to: "/vcommerce/businesses?delivery=1", iconClass: "vcohp-mob__qa-icon--blue" },
  { key: "cashback",   Icon: IconShieldCheck,   to: "/vcommerce/businesses?cashback=1", iconClass: "vcohp-mob__qa-icon--cyan" },
  { key: "top",        Icon: IconStar,          to: "/vcommerce/businesses?sort=rating", iconClass: "vcohp-mob__qa-icon--orange" },
];

export default function QuickActionsGrid() {
  const { t } = useTranslation(["vcommerceShop"]);
  return (
    <nav
      aria-label={t("vcommerceShop:quickActionsGrid.navAriaLabel")}
      className="vcohp-mob__qa-grid"
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 8px" }}
    >
      {ACTIONS.map(({ key, Icon, to, iconClass }) => {
        const label = t(`vcommerceShop:quickActionsGrid.actions.${key}`);
        return (
          <Link
            key={key}
            to={to}
            className="vcohp-mob__qa-item"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--mkt-text)" }}
            aria-label={label}
          >
            <div
              className={`vcohp-mob__qa-icon ${iconClass}`}
              aria-hidden="true"
              style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--mkt-border)" }}
            >
              <Icon size={22} />
            </div>
            <span className="vcohp-mob__qa-label" style={{ fontSize: "0.67rem", textAlign: "center", lineHeight: 1.2, color: "var(--mkt-text-2)" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
