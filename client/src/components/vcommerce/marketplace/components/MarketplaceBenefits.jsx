import { IconWallet, IconShieldCheck, IconTruckDelivery, IconHeartHandshake, IconLeaf } from "@tabler/icons-react";

const BENEFITS = [
  {
    key: "cashback",
    Icon: IconWallet,
    title: "V.Wallet Cashback",
    body: "Earn real cashback on every purchase, automatically credited to your V.Wallet.",
    iconClass: "vcohp-desk__benefit-icon--teal",
  },
  {
    key: "verified",
    Icon: IconShieldCheck,
    title: "Verified Businesses",
    body: "Every seller is reviewed and verified before they can list products on V.Commerce.",
    iconClass: "vcohp-desk__benefit-icon--green",
  },
  {
    key: "delivery",
    Icon: IconTruckDelivery,
    title: "Reliable Delivery",
    body: "Track your orders from checkout to doorstep — local and international shipping supported.",
    iconClass: "vcohp-desk__benefit-icon--purple",
  },
  {
    key: "community",
    Icon: IconHeartHandshake,
    title: "Community Impact",
    body: "Shopping on V.Commerce supports women-led and community-run businesses across the globe.",
    iconClass: "vcohp-desk__benefit-icon--pink",
  },
  {
    key: "sustainable",
    Icon: IconLeaf,
    title: "Sustainable Choices",
    body: "Discover eco-conscious businesses committed to ethical and sustainable practices.",
    iconClass: "vcohp-desk__benefit-icon--gold",
  },
];

export function DesktopBenefits() {
  return (
    <section aria-labelledby="vcohp-desk-benefits-title" className="vcohp-desk__benefits">
      <h2 className="vcohp-desk__benefits-title" id="vcohp-desk-benefits-title" style={{ color: "var(--mkt-text)" }}>
        Why Shop on V.Commerce?
      </h2>
      <div className="vcohp-desk__benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {BENEFITS.map(({ key, Icon, title, body, iconClass }) => (
          <div key={key} className="vcohp-desk__benefit" style={{ background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className={`vcohp-desk__benefit-icon ${iconClass}`} aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={22} />
            </div>
            <p className="vcohp-desk__benefit-title" style={{ color: "var(--mkt-text)", fontWeight: 600, fontSize: "0.85rem" }}>{title}</p>
            <p className="vcohp-desk__benefit-body" style={{ color: "var(--mkt-text-muted)", fontSize: "0.78rem", lineHeight: 1.5 }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MobileBenefits() {
  return (
    <section aria-labelledby="vcohp-mob-benefits-title">
      <div className="vcohp-mob__sec-hdr" style={{ marginBottom: 12 }}>
        <h2 className="vcohp-mob__sec-title" id="vcohp-mob-benefits-title" style={{ color: "var(--mkt-text)" }}>
          Why V.Commerce?
        </h2>
      </div>
      <div className="vcohp-mob__benefits-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BENEFITS.map(({ key, Icon, title, body, iconClass }) => (
          <div key={key} className="vcohp-mob__benefit" style={{ background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div className={`vcohp-mob__benefit-icon ${iconClass}`} aria-hidden="true" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={18} />
            </div>
            <div>
              <p style={{ color: "var(--mkt-text)", fontWeight: 600, fontSize: "0.82rem", marginBottom: 3 }}>{title}</p>
              <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.75rem", lineHeight: 1.5 }}>{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
