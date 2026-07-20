import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight } from "@tabler/icons-react";

function ImpactIllustration({ size = 80 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ig-outer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.08" />
        </radialGradient>
        <radialGradient id="ig-inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ffb2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#ig-outer)" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="url(#ig-inner)" />
      {/* Heart */}
      <path
        d={`M${cx} ${cy + r * 0.18} C${cx - r * 0.32} ${cy - r * 0.1} ${cx - r * 0.52} ${cy - r * 0.38} ${cx} ${cy - r * 0.14} C${cx + r * 0.52} ${cy - r * 0.38} ${cx + r * 0.32} ${cy - r * 0.1} ${cx} ${cy + r * 0.18}Z`}
        fill="#00ffb2"
        opacity="0.9"
      />
      {/* Silhouettes */}
      <ellipse cx={cx - r * 0.3} cy={cy + r * 0.42} rx={r * 0.11} ry={r * 0.22} fill="var(--mkt-cyan)" opacity="0.7" />
      <ellipse cx={cx} cy={cy + r * 0.42} rx={r * 0.11} ry={r * 0.22} fill="var(--mkt-green)" opacity="0.7" />
      <ellipse cx={cx + r * 0.3} cy={cy + r * 0.42} rx={r * 0.11} ry={r * 0.22} fill="var(--mkt-purple)" opacity="0.7" />
    </svg>
  );
}

export function DesktopImpactCard() {
  const { t } = useTranslation(["vcommerceShop"]);
  return (
    <aside
      aria-label={t("vcommerceShop:impactCard.ariaLabel")}
      className="vcohp-desk__impact"
      style={{ background: "linear-gradient(135deg, var(--mkt-surface) 0%, rgba(0,212,255,0.06) 100%)", border: "1px solid var(--mkt-border)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}
    >
      <ImpactIllustration size={88} />
      <div>
        <p style={{ color: "var(--mkt-green)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{t("vcommerceShop:impactCard.eyebrow")}</p>
        <h3 style={{ color: "var(--mkt-text)", fontWeight: 700, fontSize: "1rem", lineHeight: 1.3, marginBottom: 8 }}>
          {t("vcommerceShop:impactCard.desktopTitle")}
        </h3>
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.78rem", lineHeight: 1.6 }}>
          {t("vcommerceShop:impactCard.desktopBody")}
        </p>
      </div>
      <Link
        to="/about"
        className="vcohp-desk__impact-cta"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "var(--mkt-green)", color: "#fff", fontWeight: 600, fontSize: "0.8rem", textDecoration: "none" }}
      >
        {t("vcommerceShop:impactCard.learnMore")} <IconArrowRight size={14} aria-hidden="true" />
      </Link>
    </aside>
  );
}

export function MobileImpactCard() {
  const { t } = useTranslation(["vcommerceShop"]);
  return (
    <section
      aria-label={t("vcommerceShop:impactCard.ariaLabel")}
      className="vcohp-mob__impact"
      style={{ background: "linear-gradient(135deg, var(--mkt-surface) 0%, rgba(0,212,255,0.06) 100%)", border: "1px solid var(--mkt-border)", borderRadius: 14, padding: 18, display: "flex", gap: 14, alignItems: "center" }}
    >
      <ImpactIllustration size={62} />
      <div style={{ flex: 1 }}>
        <p style={{ color: "var(--mkt-green)", fontWeight: 700, fontSize: "0.67rem", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>{t("vcommerceShop:impactCard.eyebrow")}</p>
        <p style={{ color: "var(--mkt-text)", fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.3, marginBottom: 8 }}>
          {t("vcommerceShop:impactCard.mobileBody")}
        </p>
        <Link
          to="/about"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--mkt-cyan)", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}
          aria-label={t("vcommerceShop:impactCard.mobileLearnMoreAriaLabel")}
        >
          {t("vcommerceShop:impactCard.learnMore")} <IconArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
