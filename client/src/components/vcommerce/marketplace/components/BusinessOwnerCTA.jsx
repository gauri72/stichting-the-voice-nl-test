import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight, IconBuildingStore } from "@tabler/icons-react";

export default function BusinessOwnerCTA({ variant = "desktop" }) {
  const { t } = useTranslation(["vcommerceShop"]);
  const isDesktop = variant === "desktop";

  if (isDesktop) {
    return (
      <section
        aria-label={t("vcommerceShop:businessOwnerCta.ariaLabel")}
        className="vcohp-desk__biz-cta"
        style={{ background: "linear-gradient(90deg, rgba(0,212,255,0.12) 0%, rgba(124,58,237,0.12) 100%)", border: "1px solid var(--mkt-border)", borderRadius: 14, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <IconBuildingStore size={32} aria-hidden="true" style={{ color: "var(--mkt-cyan)", flexShrink: 0 }} />
          <div>
            <p style={{ color: "var(--mkt-text)", fontWeight: 700, fontSize: "0.95rem", marginBottom: 3 }}>{t("vcommerceShop:businessOwnerCta.desktop.heading")}</p>
            <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.8rem" }}>{t("vcommerceShop:businessOwnerCta.desktop.body")}</p>
          </div>
        </div>
        <Link
          to="/vcommerce/apply"
          className="vcohp-desk__biz-cta-btn cta-pulse"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "var(--mkt-cyan)", color: "#071426", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {t("vcommerceShop:businessOwnerCta.desktop.cta")} <IconArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label={t("vcommerceShop:businessOwnerCta.ariaLabel")}
      className="vcohp-mob__biz-cta"
      style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(124,58,237,0.1) 100%)", border: "1px solid var(--mkt-border)", borderRadius: 12, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconBuildingStore size={24} aria-hidden="true" style={{ color: "var(--mkt-cyan)", flexShrink: 0 }} />
        <p style={{ color: "var(--mkt-text)", fontWeight: 700, fontSize: "0.85rem" }}>{t("vcommerceShop:businessOwnerCta.mobile.heading")}</p>
      </div>
      <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.78rem", lineHeight: 1.5 }}>
        {t("vcommerceShop:businessOwnerCta.mobile.body")}
      </p>
      <Link
        to="/vcommerce/apply"
        className="vcohp-mob__biz-cta-btn cta-pulse"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 8, background: "var(--mkt-cyan)", color: "#071426", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}
      >
        {t("vcommerceShop:businessOwnerCta.mobile.cta")} <IconArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
