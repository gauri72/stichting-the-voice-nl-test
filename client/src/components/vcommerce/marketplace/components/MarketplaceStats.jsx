import {
  IconWallet, IconShieldCheck, IconBuildingStore, IconWorld,
} from "@tabler/icons-react";
import { SkeletonBlock } from "./ui.jsx";

const STAT_DEFS = [
  {
    key: "walletCashback",
    label: "V.Wallet Cashback",
    iconClass: "vcohp-mob__stat-icon--teal",
    valueClass: "vcohp-mob__stat-value--teal",
    Icon: IconWallet,
    format: () => "Active",
  },
  {
    key: "verifiedBusinesses",
    label: "Verified Businesses",
    iconClass: "vcohp-mob__stat-icon--green",
    valueClass: "vcohp-mob__stat-value--green",
    Icon: IconShieldCheck,
    format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K+` : `${v}+`,
  },
  {
    key: "activeShops",
    label: "Active Shops",
    iconClass: "vcohp-mob__stat-icon--purple",
    valueClass: "vcohp-mob__stat-value--purple",
    Icon: IconBuildingStore,
    format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K+` : `${v}+`,
  },
  {
    key: "countries",
    label: "Global Community",
    iconClass: "vcohp-mob__stat-icon--blue",
    valueClass: "vcohp-mob__stat-value--blue",
    Icon: IconWorld,
    format: (v) => v ? `${v}+ Countries` : "Global",
  },
];

/** Mobile 2×2 stats strip. */
export default function MarketplaceStats({ stats, loading }) {
  if (loading) {
    return (
      <section className="vcohp-mob__stats" aria-label="Marketplace statistics">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="vcohp-mob__stat">
            <SkeletonBlock style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock style={{ width: "60%", height: 14, marginBottom: 4 }} />
              <SkeletonBlock style={{ width: "80%", height: 10 }} />
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="vcohp-mob__stats" aria-label="Marketplace statistics">
      {STAT_DEFS.map(({ key, label, iconClass, valueClass, Icon, format }) => {
        const raw = stats?.[key];
        const displayValue = raw != null ? format(raw) : (key === "walletCashback" ? "Active" : "—");
        return (
          <div key={key} className="vcohp-mob__stat">
            <div className={`vcohp-mob__stat-icon ${iconClass}`} aria-hidden="true">
              <Icon size={18} />
            </div>
            <div>
              <p className={`vcohp-mob__stat-value ${valueClass}`}>{displayValue}</p>
              <p className="vcohp-mob__stat-label">{label}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Desktop hero stat column — separate visual treatment. */
export function DesktopHeroStats({ stats, loading }) {
  const DESKTOP_DEFS = [
    {
      key: "activeShops",
      label: "Active Shops",
      iconClass: "vcohp-desk__stat-icon--teal",
      Icon: IconBuildingStore,
      format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K+` : `${v}+`,
      fallback: "1,500+",
    },
    {
      key: "customers",
      label: "Happy Customers",
      iconClass: "vcohp-desk__stat-icon--pink",
      Icon: IconWallet,
      format: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K+` : `${v}`,
      fallback: "10K+",
    },
    {
      key: "categories",
      label: "Categories",
      iconClass: "vcohp-desk__stat-icon--purple",
      Icon: IconBuildingStore,
      format: (v) => `${v}+`,
      fallback: "25+",
    },
    {
      key: "countries",
      label: "Community",
      iconClass: "vcohp-desk__stat-icon--blue",
      Icon: IconWorld,
      format: () => "Global",
      fallback: "Global",
    },
  ];

  return (
    <div className="vcohp-desk__hero-stats">
      {DESKTOP_DEFS.map(({ key, label, iconClass, Icon, format, fallback }) => {
        const raw = stats?.[key];
        const value = loading ? "…" : (raw != null ? format(raw) : fallback);
        return (
          <div key={key} className="vcohp-desk__hero-stat">
            <div className={`vcohp-desk__stat-icon ${iconClass}`} aria-hidden="true">
              <Icon size={20} />
            </div>
            <div>
              <p className="vcohp-desk__stat-value">{value}</p>
              <p className="vcohp-desk__stat-label">{label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
