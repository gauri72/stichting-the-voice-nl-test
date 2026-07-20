import { useTranslation } from "react-i18next";
import { IconWallet, IconShieldCheck, IconTruckDelivery, IconHeartHandshake, IconLeaf } from "@tabler/icons-react";

const BENEFITS = [
  { key: "cashback", Icon: IconWallet, iconClass: "vcohp-desk__benefit-icon--teal" },
  { key: "verified", Icon: IconShieldCheck, iconClass: "vcohp-desk__benefit-icon--green" },
  { key: "delivery", Icon: IconTruckDelivery, iconClass: "vcohp-desk__benefit-icon--purple" },
  { key: "community", Icon: IconHeartHandshake, iconClass: "vcohp-desk__benefit-icon--pink" },
  { key: "sustainable", Icon: IconLeaf, iconClass: "vcohp-desk__benefit-icon--gold" },
];

export function DesktopBenefits() {
  const { t } = useTranslation(["vcommerceShop"]);
  return (
    <section aria-labelledby="vcohp-desk-benefits-title" className="vcohp-desk__benefits">
      <h2 className="vcohp-desk__benefits-title" id="vcohp-desk-benefits-title" style={{ color: "var(--mkt-text)" }}>
        {t("vcommerceShop:marketplaceBenefits.desktopTitle")}
      </h2>
      <div className="vcohp-desk__benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {BENEFITS.map(({ key, Icon, iconClass }) => (
          <div key={key} className="vcohp-desk__benefit" style={{ background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className={`vcohp-desk__benefit-icon ${iconClass}`} aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} />
            </div>
            <p className="vcohp-desk__benefit-title" style={{ color: "var(--mkt-text)", fontWeight: 600, fontSize: "0.85rem" }}>{t(`vcommerceShop:marketplaceBenefits.items.${key}.title`)}</p>
            <p className="vcohp-desk__benefit-body" style={{ color: "var(--mkt-text-muted)", fontSize: "0.78rem", lineHeight: 1.5 }}>{t(`vcommerceShop:marketplaceBenefits.items.${key}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MobileBenefits() {
  const { t } = useTranslation(["vcommerceShop"]);
  return (
    <section aria-labelledby="vcohp-mob-benefits-title">
      <div className="vcohp-mob__sec-hdr" style={{ marginBottom: 12 }}>
        <h2 className="vcohp-mob__sec-title" id="vcohp-mob-benefits-title" style={{ color: "var(--mkt-text)" }}>
          {t("vcommerceShop:marketplaceBenefits.mobileTitle")}
        </h2>
      </div>
      <div className="vcohp-mob__benefits-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BENEFITS.map(({ key, Icon, iconClass }) => (
          <div key={key} className="vcohp-mob__benefit" style={{ background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div className={`vcohp-mob__benefit-icon ${iconClass}`} aria-hidden="true" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} />
            </div>
            <div>
              <p style={{ color: "var(--mkt-text)", fontWeight: 600, fontSize: "0.82rem", marginBottom: 3 }}>{t(`vcommerceShop:marketplaceBenefits.items.${key}.title`)}</p>
              <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.75rem", lineHeight: 1.5 }}>{t(`vcommerceShop:marketplaceBenefits.items.${key}.body`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
