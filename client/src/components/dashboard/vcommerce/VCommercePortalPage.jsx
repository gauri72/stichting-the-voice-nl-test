import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconHome } from "@tabler/icons-react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import HeroActionCluster from "../../layout/HeroActionCluster.jsx";
import "../../../styles/dashboard-subpage-navigation.css";
import {
  getMyBusiness,
  getMyProducts,
  postMyProduct,
  patchMyProduct,
  patchMyProductPricing,
  deleteMyProduct,
  getMyOrders,
  markOrderFulfilled,
  getMyPayouts,
  patchMyBusiness,
  uploadBusinessImage,
  postImportProducts,
  getProductsTemplate,
  getMyImportHistory,
  getMyReferralLink,
  getMyConnectOverview,
  startMyConnectOnboarding,
  openMyConnectDashboard,
  startMyPackageCheckout,
  submitMyBusinessForReview,
  updateMyPayoutRegistration,
} from "../../vcommerce/shared/vcommerceApi.js";
import { PROMOTION_OPTIONS, SELLING_MODES, VCOMMERCE_PLANS } from "../../vcommerce/shared/VCOMMERCE_PLANS.js";
import PayoutRegistrationForm from "../../vcommerce/shared/PayoutRegistrationForm.jsx";
import "../../../styles/vcommerce-marketplace.css";

const TAB_KEYS = ["overview", "products", "orders", "payouts", "promote", "settings", "import"];

function formatPrice(minor, currency = "eur") {
  if (minor == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

const S = {
  card: { background: "var(--color-card-bg,var(--color-surface,#fff))", borderRadius: 12, border: "1px solid var(--color-border,rgba(128,128,128,0.15))", padding: 20, marginBottom: 16 },
  statCard: { background: "var(--color-card-bg,var(--color-surface,#fff))", borderRadius: 12, border: "1px solid var(--color-border,rgba(128,128,128,0.15))", padding: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--color-border,rgba(128,128,128,0.18))", fontWeight: 600, color: "var(--color-text-muted,#888)", fontSize: "0.78rem", textTransform: "uppercase" },
  td: { padding: "12px", borderBottom: "1px solid var(--color-border,rgba(128,128,128,0.1))", verticalAlign: "middle" },
  badge: (c) => ({ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: "0.74rem", fontWeight: 600, textTransform: "uppercase", background: c === "green" ? "rgba(16,185,129,0.12)" : c === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", color: c === "green" ? "#059669" : c === "red" ? "#DC2626" : "#D97706" }),
  btn: (v = "primary") => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: v === "sm" ? "5px 12px" : "9px 18px", background: v === "ghost" || v === "sm" ? "transparent" : "var(--color-accent,#8B5CF6)", color: v === "ghost" || v === "sm" ? "inherit" : "#fff", border: v === "ghost" || v === "sm" ? "1px solid var(--color-border,rgba(128,128,128,0.3))" : "none", borderRadius: 8, fontSize: v === "sm" ? "0.8rem" : "0.875rem", fontWeight: 600, cursor: "pointer" }),
  input: { padding: "9px 12px", border: "1px solid var(--color-border,rgba(128,128,128,0.3))", borderRadius: 8, background: "var(--color-bg,#fff)", color: "inherit", fontSize: "0.9rem", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted,#888)", display: "block", marginBottom: 4 },
};

// ── Overview tab ──
function OverviewTab({ business, onRefresh, onNavigateTab }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const [refLink, setRefLink] = useState(null);
  const [refCopied, setRefCopied] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    getMyReferralLink().then((d) => setRefLink(d)).catch(() => {});
    getMyProducts().then((d) => setProductCount(d.products?.filter((product) => product.isAvailable).length || 0)).catch(() => {});
  }, []);

  function copyRef() {
    if (!refLink?.url) return;
    navigator.clipboard.writeText(refLink.url).then(() => {
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    });
  }

  async function activatePackage() {
    try {
      const { url } = await startMyPackageCheckout();
      window.location.assign(url);
    } catch (err) {
      window.alert(err?.message || t("vcommercePortal:portal.overview.packageAction.checkoutError"));
    }
  }

  async function submitForReview() {
    setSubmittingReview(true);
    setReviewMessage("");
    try {
      await submitMyBusinessForReview();
      setReviewMessage(t("vcommercePortal:portal.overview.onboarding.submitSuccess"));
      onRefresh?.();
    } catch (err) {
      setReviewMessage(err?.message || t("vcommercePortal:portal.overview.onboarding.submitError"));
    } finally {
      setSubmittingReview(false);
    }
  }

  const planName = VCOMMERCE_PLANS.find((plan) => plan.id === business.packageId)?.name || t("vcommercePortal:portal.overview.defaultPlanName");

  return (
    <div className="vco-portal-motion">
      <div className="vco-seller-hero">
        <div>
          <span className="vco-kicker">{t("vcommercePortal:portal.overview.kicker")}</span>
          <h2>{SELLING_MODES.find((mode) => mode.id === business.sellingMode)?.name || t("vcommercePortal:portal.overview.defaultSellingModeName")}</h2>
          <p>{business.website ? t("vcommercePortal:portal.overview.heroTextWithWebsite") : t("vcommercePortal:portal.overview.heroTextNoWebsite")}</p>
        </div>
        <div className="vco-seller-hero__chips">
          <span>{planName} {t("vcommercePortal:portal.overview.packageSuffix")}</span>
          <span>{t("vcommercePortal:portal.overview.feePerSale")}</span>
          <span>{t("vcommercePortal:portal.overview.payoutTarget")}</span>
        </div>
      </div>
      {business.packageStatus !== "active" && (
        <div className="vco-package-action">
          <div><strong>{t("vcommercePortal:portal.overview.packageAction.activateTitle", { plan: planName })}</strong><span>{t("vcommercePortal:portal.overview.packageAction.activateText")}</span></div>
          <button type="button" onClick={activatePackage}>{t("vcommercePortal:portal.overview.packageAction.activateButton")}</button>
        </div>
      )}
      {business.applicationStatus === "pending" || business.status === "review" ? (
        <div className="vco-review-state vco-review-state--pending">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{t("vcommercePortal:portal.overview.reviewPending.title")}</strong>
            <p>{t("vcommercePortal:portal.overview.reviewPending.text")}</p>
          </div>
        </div>
      ) : business.status !== "active" ? (
        <section className="vco-onboarding-panel">
          <div className="vco-onboarding-panel__heading">
            <div>
              <span className="vco-kicker">{t("vcommercePortal:portal.overview.onboarding.kicker")}</span>
              <h2>{t("vcommercePortal:portal.overview.onboarding.title")}</h2>
              <p>{t("vcommercePortal:portal.overview.onboarding.text")}</p>
            </div>
            <span className="vco-onboarding-panel__progress">
              {t("vcommercePortal:portal.overview.onboarding.progress", { count: [business.packageStatus === "active", Boolean(business.logoUrl), Boolean(business.description), !["hosted", "hybrid"].includes(business.sellingMode) || productCount > 0].filter(Boolean).length })}
            </span>
          </div>
          {business.applicationReviewNote && (
            <div className="vco-review-note"><strong>{t("vcommercePortal:portal.overview.onboarding.reviewFeedback")}</strong> {business.applicationReviewNote}</div>
          )}
          <div className="vco-onboarding-checklist">
            {[
              [t("vcommercePortal:portal.overview.onboarding.checklist.packagePaymentLabel"), business.packageStatus === "active", t("vcommercePortal:portal.overview.onboarding.checklist.packagePaymentDetail"), null],
              [t("vcommercePortal:portal.overview.onboarding.checklist.logoLabel"), Boolean(business.logoUrl && business.description), t("vcommercePortal:portal.overview.onboarding.checklist.logoDetail"), 5],
              [t("vcommercePortal:portal.overview.onboarding.checklist.contactLabel"), Boolean(business.contactEmail && business.sellingMode), t("vcommercePortal:portal.overview.onboarding.checklist.contactDetail"), 5],
              [t("vcommercePortal:portal.overview.onboarding.checklist.productsLabel"), !["hosted", "hybrid"].includes(business.sellingMode) || productCount > 0, t("vcommercePortal:portal.overview.onboarding.availableListings", { count: productCount }), 1],
            ].map(([label, complete, detail, tabIndex]) => {
              const clickable = tabIndex != null && typeof onNavigateTab === "function";
              return (
                <div
                  className={`vco-onboarding-check${complete ? " is-complete" : ""}${clickable ? " is-clickable" : ""}`}
                  key={label}
                  {...(clickable ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: () => onNavigateTab(tabIndex),
                    onKeyDown: (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNavigateTab(tabIndex);
                      }
                    },
                  } : {})}
                >
                  <span aria-hidden="true">{complete ? "✓" : "○"}</span>
                  <div><strong>{label}</strong><small>{detail}</small></div>
                  {clickable && <span aria-hidden="true" className="vco-onboarding-check__arrow">→</span>}
                </div>
              );
            })}
          </div>
          {reviewMessage && <p className="vco-onboarding-panel__message" role="status">{reviewMessage}</p>}
          <button type="button" className="vco-onboarding-panel__submit" onClick={submitForReview} disabled={submittingReview}>
            {submittingReview ? t("vcommercePortal:portal.overview.onboarding.submitting") : t("vcommercePortal:portal.overview.onboarding.submitButton")} <span>→</span>
          </button>
        </section>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: t("vcommercePortal:portal.overview.stats.totalRevenue"), value: formatPrice(business.totalRevenueMinor) },
          { label: t("vcommercePortal:portal.overview.stats.pendingPayout"), value: formatPrice(business.pendingPayoutMinor) },
          { label: t("vcommercePortal:portal.overview.stats.totalPaidOut"), value: formatPrice(business.totalPayoutsMinor) },
          { label: t("vcommercePortal:portal.overview.stats.totalOrders"), value: business.totalOrders ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} style={S.statCard}>
            <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted,#888)" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.overview.businessCard.title")}</h3>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          {business.logoUrl && (
            <img src={business.logoUrl} alt="logo" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
          )}
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.05rem" }}>{business.businessName}</p>
            <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--color-text-secondary,#666)" }}>{business.tagline}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ ...(S.badge(business.status === "active" ? "green" : "red")) }}>{business.status}</span>
              {business.isFeaturedThisWeek && <span style={S.badge("green")}>{t("vcommercePortal:portal.overview.businessCard.featuredThisWeek")}</span>}
              {business.avgRating && <span style={S.badge("yellow")}>{t("vcommercePortal:portal.overview.businessCard.reviewsBadge", { rating: business.avgRating, count: business.reviewCount })}</span>}
              {business.status === "active" && (
                <a href={`/vcommerce/${business.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.8rem", color: "var(--color-accent,#8B5CF6)" }}>
                  {t("vcommercePortal:portal.overview.businessCard.viewPublicPage")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 16 }}>
        <div style={S.card}>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase" }}>{t("vcommercePortal:portal.overview.cards.feeTitle")}</p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{business.platformFeePercent}%</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)" }}>{t("vcommercePortal:portal.overview.cards.feeSub")}</p>
        </div>
        <div style={S.card}>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase" }}>{t("vcommercePortal:portal.overview.cards.scheduleTitle")}</p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{t("vcommercePortal:portal.overview.cards.scheduleValue")}</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)" }}>{t("vcommercePortal:portal.overview.cards.scheduleSub")}</p>
        </div>
        <div style={S.card}>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase" }}>{t("vcommercePortal:portal.overview.cards.cashbackTitle")}</p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{business.cashbackPercent}%</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)" }}>{t("vcommercePortal:portal.overview.cards.cashbackSub")}</p>
        </div>
        {business.minOrderValueMinor > 0 && (
          <div style={S.card}>
            <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase" }}>{t("vcommercePortal:portal.overview.cards.minOrderTitle")}</p>
            <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{formatPrice(business.minOrderValueMinor)}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)" }}>{t("vcommercePortal:portal.overview.cards.minOrderSub")}</p>
          </div>
        )}
      </div>

      {refLink?.url && (
        <div style={{ ...S.card, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.overview.referral.title")}</h3>
          <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "var(--color-text-secondary,#666)" }}>
            {t("vcommercePortal:portal.overview.referral.text")}
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ fontSize: "0.82rem", background: "var(--color-bg-muted,rgba(128,128,128,0.08))", padding: "6px 10px", borderRadius: 6, wordBreak: "break-all", flex: 1 }}>{refLink.url}</code>
            <button type="button" style={S.btn("sm")} onClick={copyRef}>{refCopied ? t("vcommercePortal:portal.overview.referral.copiedButton") : t("vcommercePortal:portal.overview.referral.copyButton")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bulk pricing accordion (used inside ProductsTab modal) ──
function BulkPricingSection({ productId, initialTiers = [], initialMinQty = 1, initialMaxQty = null }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const [open, setOpen] = useState(false);
  const [tiers, setTiers] = useState(initialTiers.map((t) => ({ minQty: t.minQty, priceEUR: (t.priceMinor / 100).toFixed(2) })));
  const [minOrderQty, setMinOrderQty] = useState(initialMinQty ?? 1);
  const [maxOrderQty, setMaxOrderQty] = useState(initialMaxQty ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgIsError, setMsgIsError] = useState(false);

  function addTier() {
    setTiers((t) => [...t, { minQty: "", priceEUR: "" }]);
  }

  function removeTier(i) {
    setTiers((t) => t.filter((_, idx) => idx !== i));
  }

  function updateTier(i, key, val) {
    setTiers((t) => t.map((tier, idx) => idx === i ? { ...tier, [key]: val } : tier));
  }

  async function savePricing() {
    setSaving(true);
    setMsg("");
    try {
      const parsed = tiers
        .filter((t) => t.minQty !== "" && t.priceEUR !== "")
        .map((t) => ({ minQty: Number(t.minQty), priceMinor: Math.round(parseFloat(t.priceEUR) * 100) }));
      await patchMyProductPricing(productId, {
        tiers: parsed,
        minOrderQty: Number(minOrderQty) || 1,
        maxOrderQty: maxOrderQty === "" ? null : Number(maxOrderQty),
      });
      setMsg(t("vcommercePortal:portal.bulkPricing.saveSuccess"));
      setMsgIsError(false);
    } catch (err) {
      setMsg(err?.message || t("vcommercePortal:portal.bulkPricing.saveError"));
      setMsgIsError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!productId) return null;

  return (
    <div style={{ borderTop: "1px solid var(--color-border,rgba(128,128,128,0.15))", marginTop: 4, paddingTop: 4 }}>
      <button type="button"
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", width: "100%", padding: "10px 0", fontSize: "0.88rem", fontWeight: 700, color: "var(--color-accent,#8B5CF6)" }}
        onClick={() => setOpen((o) => !o)}>
        <span style={{ fontSize: "0.7rem" }}>{open ? "▼" : "▶"}</span>
        {t("vcommercePortal:portal.bulkPricing.toggleLabel")} {tiers.length > 0 && t("vcommercePortal:portal.bulkPricing.tierCount", { count: tiers.length })}
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>{t("vcommercePortal:portal.bulkPricing.minOrderQty")}</label>
              <input style={S.input} type="number" min="1" value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>{t("vcommercePortal:portal.bulkPricing.maxOrderQty")}</label>
              <input style={S.input} type="number" min="1" value={maxOrderQty}
                onChange={(e) => setMaxOrderQty(e.target.value)} placeholder="—" />
            </div>
          </div>

          <div>
            <label style={{ ...S.label, marginBottom: 8 }}>{t("vcommercePortal:portal.bulkPricing.tiersLabel")}</label>
            {tiers.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted,#aaa)", margin: "0 0 8px" }}>
                {t("vcommercePortal:portal.bulkPricing.noTiers")}
              </p>
            )}
            {tiers.map((tier, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input style={S.input} type="number" min="1" placeholder={t("vcommercePortal:portal.bulkPricing.minQtyPlaceholder")} value={tier.minQty}
                  onChange={(e) => updateTier(i, "minQty", e.target.value)} />
                <input style={S.input} type="number" min="0.01" step="0.01" placeholder={t("vcommercePortal:portal.bulkPricing.pricePlaceholder")} value={tier.priceEUR}
                  onChange={(e) => updateTier(i, "priceEUR", e.target.value)} />
                <button type="button" onClick={() => removeTier(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: "1rem", padding: "0 4px" }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addTier}
              style={{ ...S.btn("sm"), marginTop: 4 }}>{t("vcommercePortal:portal.bulkPricing.addTier")}</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={savePricing} disabled={saving} style={S.btn("sm")}>
              {saving ? t("vcommercePortal:portal.bulkPricing.saving") : t("vcommercePortal:portal.bulkPricing.saveButton")}
            </button>
            {msg && <span style={{ fontSize: "0.8rem", color: msgIsError ? "#DC2626" : "#059669" }}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products tab ──
function ProductsTab({ businessId }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getMyProducts()
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ name: "", type: "service", description: "", priceMinor: "", stockCount: "", deliveryInfo: "", isAvailable: true });
    setEditing("new");
  }

  function openEdit(p) {
    setForm({ name: p.name, type: p.type, description: p.description || "", priceMinor: (p.priceMinor / 100).toFixed(2), stockCount: p.stockCount ?? "", deliveryInfo: p.deliveryInfo || "", isAvailable: p.isAvailable });
    setEditing(p);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      description: form.description,
      priceMinor: Math.round(parseFloat(form.priceMinor) * 100),
      stockCount: form.stockCount === "" ? null : Number(form.stockCount),
      deliveryInfo: form.deliveryInfo,
      isAvailable: form.isAvailable,
    };
    try {
      if (editing === "new") {
        await postMyProduct(payload);
        setMsg(t("vcommercePortal:portal.products.addSuccess"));
      } else {
        await patchMyProduct(editing._id, payload);
        setMsg(t("vcommercePortal:portal.products.updateSuccess"));
      }
      setEditing(null);
      load();
    } catch (err) {
      setMsg(err?.message || t("vcommercePortal:portal.products.saveError"));
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm(t("vcommercePortal:portal.products.deleteConfirm"))) return;
    try {
      await deleteMyProduct(productId);
      setMsg(t("vcommercePortal:portal.products.deleteSuccess"));
      load();
    } catch (err) {
      setMsg(err?.message || t("vcommercePortal:portal.products.deleteError"));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{t("vcommercePortal:portal.products.title")}</h3>
        <button type="button" style={S.btn()} onClick={openNew}>{t("vcommercePortal:portal.products.addButton")}</button>
      </div>

      {msg && <p style={{ padding: "10px 14px", background: "rgba(16,185,129,0.1)", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", color: "#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color: "var(--color-text-muted,#888)", padding: 40, textAlign: "center" }}>{t("vcommercePortal:portal.products.loading")}</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--color-card-bg,#fff)", borderRadius: 12, border: "1px dashed var(--color-border,rgba(128,128,128,0.2))" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>📦</div>
          <p style={{ margin: "0 0 16px", color: "var(--color-text-secondary,#666)" }}>{t("vcommercePortal:portal.products.empty.text")}</p>
          <button type="button" style={S.btn()} onClick={openNew}>{t("vcommercePortal:portal.products.empty.button")}</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.name")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.type")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.price")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.bulkTiers")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.stock")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.available")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.products.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td style={S.td}><strong>{p.name}</strong></td>
                  <td style={S.td}>{p.type}</td>
                  <td style={S.td}>{formatPrice(p.priceMinor, p.currency)}</td>
                  <td style={S.td}>
                    {p.bulkPricingTiers?.length > 0
                      ? <span style={S.badge("yellow")}>{t("vcommercePortal:portal.products.bulkTiersBadge", { count: p.bulkPricingTiers.length })}</span>
                      : <span style={{ color: "var(--color-text-muted,#aaa)", fontSize: "0.8rem" }}>—</span>}
                  </td>
                  <td style={S.td}>{p.stockCount ?? "∞"}</td>
                  <td style={S.td}><span style={S.badge(p.isAvailable ? "green" : "red")}>{p.isAvailable ? t("vcommercePortal:portal.products.yes") : t("vcommercePortal:portal.products.no")}</span></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={S.btn("sm")} onClick={() => openEdit(p)}>{t("vcommercePortal:portal.products.editButton")}</button>
                      <button type="button" style={{ ...S.btn("sm"), color: "#DC2626", borderColor: "rgba(220,38,38,0.3)" }} onClick={() => handleDelete(p._id)}>{t("vcommercePortal:portal.products.deleteButton")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product form modal */}
      {editing !== null && (
        <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,maxWidth:520,width:"100%",overflow:"auto",maxHeight:"92vh" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid var(--color-border,rgba(128,128,128,0.15))" }}>
              <h3 style={{ margin:0,fontSize:"1rem",fontWeight:700 }}>{editing === "new" ? t("vcommercePortal:portal.products.modal.addTitle") : t("vcommercePortal:portal.products.modal.editTitle")}</h3>
              <button type="button" style={{ background:"none",border:"none",cursor:"pointer",fontSize:"1.2rem",color:"var(--color-text-muted,#888)" }} onClick={() => setEditing(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding:24,display:"flex",flexDirection:"column",gap:14 }}>
              <div><label style={S.label}>{t("vcommercePortal:portal.products.modal.nameLabel")}</label><input style={S.input} type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div>
                <label style={S.label}>{t("vcommercePortal:portal.products.modal.typeLabel")}</label>
                <select style={S.input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="service">{t("vcommercePortal:portal.products.modal.typeService")}</option>
                  <option value="physical">{t("vcommercePortal:portal.products.modal.typePhysical")}</option>
                  <option value="digital">{t("vcommercePortal:portal.products.modal.typeDigital")}</option>
                </select>
              </div>
              <div><label style={S.label}>{t("vcommercePortal:portal.products.modal.descriptionLabel")}</label><textarea style={{ ...S.input, minHeight:80, resize:"vertical" }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  <label style={S.label}>{t("vcommercePortal:portal.products.modal.priceLabel")}</label>
                  <input style={S.input} type="number" min="0" step="0.01" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: e.target.value }))} required />
                </div>
                <div>
                  <label style={S.label}>{t("vcommercePortal:portal.products.modal.stockLabel")}</label>
                  <input style={S.input} type="number" min="0" value={form.stockCount} onChange={(e) => setForm((f) => ({ ...f, stockCount: e.target.value }))} />
                </div>
              </div>
              <div><label style={S.label}>{t("vcommercePortal:portal.products.modal.deliveryLabel")}</label><input style={S.input} type="text" value={form.deliveryInfo} onChange={(e) => setForm((f) => ({ ...f, deliveryInfo: e.target.value }))} placeholder={t("vcommercePortal:portal.products.modal.deliveryPlaceholder")} /></div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <input type="checkbox" id="avail" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
                <label htmlFor="avail" style={{ fontSize:"0.9rem" }}>{t("vcommercePortal:portal.products.modal.availableCheckbox")}</label>
              </div>

              {/* Bulk pricing accordion — only shown when editing existing product */}
              {editing !== "new" && (
                <BulkPricingSection
                  productId={editing._id}
                  initialTiers={editing.bulkPricingTiers || []}
                  initialMinQty={editing.minOrderQty}
                  initialMaxQty={editing.maxOrderQty}
                />
              )}

              <div style={{ display:"flex",gap:10,marginTop:8 }}>
                <button type="submit" style={S.btn()}>{t("vcommercePortal:portal.products.modal.saveButton")}</button>
                <button type="button" style={S.btn("ghost")} onClick={() => setEditing(null)}>{t("vcommercePortal:portal.products.modal.cancelButton")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders tab ──
function OrdersTab() {
  const { t } = useTranslation(["vcommercePortal"]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [fulfilling, setFulfilling] = useState(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getMyOrders(statusFilter ? { status: statusFilter } : {})
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleFulfil(e) {
    e.preventDefault();
    try {
      await markOrderFulfilled(fulfilling._id, note);
      setMsg(t("vcommercePortal:portal.orders.fulfillSuccess"));
      setFulfilling(null);
      setNote("");
      load();
    } catch (err) {
      setMsg(err?.message || t("vcommercePortal:portal.orders.genericError"));
    }
  }

  const filterLabels = {
    "": t("vcommercePortal:portal.orders.filters.all"),
    paid: t("vcommercePortal:portal.orders.filters.paid"),
    fulfilled: t("vcommercePortal:portal.orders.filters.fulfilled"),
    pending: t("vcommercePortal:portal.orders.filters.pending"),
    cancelled: t("vcommercePortal:portal.orders.filters.cancelled"),
  };

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {["","paid","fulfilled","pending","cancelled"].map((s) => (
          <button key={s} type="button"
            style={{ ...S.btn("ghost"), background: statusFilter===s ? "var(--color-accent,#8B5CF6)" : undefined, color: statusFilter===s ? "#fff" : undefined, border: statusFilter===s ? "none" : undefined }}
            onClick={() => setStatusFilter(s)}>
            {filterLabels[s]}
          </button>
        ))}
      </div>

      {msg && <p style={{ padding:"10px 14px",background:"rgba(16,185,129,0.1)",borderRadius:8,marginBottom:16,fontSize:"0.875rem",color:"#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color:"var(--color-text-muted,#888)",padding:40,textAlign:"center" }}>{t("vcommercePortal:portal.orders.loading")}</p>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.order")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.customer")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.items")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.total")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.status")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.date")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.orders.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0
                ? <tr><td colSpan={7} style={{ ...S.td,textAlign:"center",color:"var(--color-text-muted,#888)",padding:40 }}>{t("vcommercePortal:portal.orders.empty")}</td></tr>
                : orders.map((o) => (
                  <tr key={o._id}>
                    <td style={S.td}><code style={{ fontSize:"0.78rem" }}>{o._id?.slice(-8)}</code></td>
                    <td style={S.td}>{o.customerName}<br/><span style={{ fontSize:"0.78rem",color:"var(--color-text-muted,#888)" }}>{o.customerEmail}</span></td>
                    <td style={S.td}>{t("vcommercePortal:portal.orders.itemCount", { count: o.items?.length ?? 0 })}</td>
                    <td style={S.td}><strong>{formatPrice(o.subtotalMinor, o.currency)}</strong><br/><span style={{ fontSize:"0.75rem",color:"var(--color-text-muted,#aaa)" }}>{t("vcommercePortal:portal.orders.youReceive", { amount: formatPrice(o.businessAmountMinor, o.currency) })}</span></td>
                    <td style={S.td}><span style={S.badge(o.status==="paid"||o.status==="fulfilled"?"green":o.status==="cancelled"?"red":"yellow")}>{o.status}</span></td>
                    <td style={S.td}>{formatDate(o.createdAt)}</td>
                    <td style={S.td}>
                      {o.status === "paid" && (
                        <button type="button" style={S.btn("sm")} onClick={() => { setFulfilling(o); setNote(""); }}>
                          {t("vcommercePortal:portal.orders.markFulfilledButton")}
                        </button>
                      )}
                      {o.shippingAddress?.line1 && (
                        <div style={{ fontSize:"0.72rem",color:"var(--color-text-muted,#aaa)",marginTop:4 }}>
                          {o.shippingAddress.city}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {fulfilling && (
        <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={(e) => e.target === e.currentTarget && setFulfilling(null)}>
          <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,maxWidth:440,width:"100%",padding:28 }}>
            <h3 style={{ margin:"0 0 8px",fontSize:"1rem",fontWeight:700 }}>{t("vcommercePortal:portal.orders.modal.title")}</h3>
            <p style={{ margin:"0 0 16px",fontSize:"0.875rem",color:"var(--color-text-secondary,#666)" }}>
              {t("vcommercePortal:portal.orders.modal.subtitle", { id: fulfilling._id?.slice(-8), amount: formatPrice(fulfilling.subtotalMinor, fulfilling.currency) })}
            </p>
            <form onSubmit={handleFulfil}>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>{t("vcommercePortal:portal.orders.modal.noteLabel")}</label>
                <textarea style={{ ...S.input,minHeight:70,resize:"vertical" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("vcommercePortal:portal.orders.modal.notePlaceholder")} />
              </div>
              <div style={{ display:"flex",gap:10 }}>
                <button type="submit" style={S.btn()}>{t("vcommercePortal:portal.orders.modal.confirmButton")}</button>
                <button type="button" style={S.btn("ghost")} onClick={() => setFulfilling(null)}>{t("vcommercePortal:portal.orders.modal.cancelButton")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payouts tab ──
function PayoutsTab({ business, onRefresh }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connect, setConnect] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registration, setRegistration] = useState(business?.payoutRegistration || {});
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState(business?.companyRegistrationNumber || "");
  const [vatNumber, setVatNumber] = useState(business?.vatNumber || "");
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const needsRegistration = !business?.payoutRegistration?.entityType;

  useEffect(() => {
    setRegistration(business?.payoutRegistration || {});
    setCompanyRegistrationNumber(business?.companyRegistrationNumber || "");
    setVatNumber(business?.vatNumber || "");
  }, [business]);

  async function saveRegistration() {
    setSavingRegistration(true);
    setRegistrationError("");
    try {
      await updateMyPayoutRegistration({
        ...registration,
        companyRegistrationNumber,
        vatNumber,
        consentAcceptedAt: true,
      });
      setShowRegistrationForm(false);
      onRefresh?.();
    } catch (err) {
      setRegistrationError(err?.message || t("vcommercePortal:portal.payouts.errors.registrationSaveFailed"));
    } finally {
      setSavingRegistration(false);
    }
  }

  useEffect(() => {
    Promise.all([getMyConnectOverview(), getMyPayouts()])
      .then(([overview, legacy]) => {
        setConnect(overview);
        setPayouts(overview.connectedAccountId ? (overview.payouts || []) : (legacy.payouts || []));
      })
      .catch(() => {
        setConnect({ status: "not_started", payoutsEnabled: false });
        setPayouts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function beginConnect() {
    setConnecting(true);
    try {
      const { url } = await startMyConnectOnboarding();
      window.location.assign(url);
    } catch (err) {
      setConnect((current) => ({ ...current, error: err?.message || t("vcommercePortal:portal.payouts.errors.connectStartFailed") }));
      setConnecting(false);
    }
  }

  async function openStripeDashboard() {
    setConnecting(true);
    try {
      const { url } = await openMyConnectDashboard();
      window.location.assign(url);
    } catch (err) {
      setConnect((current) => ({ ...current, error: err?.message || t("vcommercePortal:portal.payouts.errors.dashboardOpenFailed") }));
      setConnecting(false);
    }
  }

  return (
    <div>
      {needsRegistration ? (
        <div className="vco-connect-card">
          <div>
            <span className="vco-kicker">{t("vcommercePortal:portal.payouts.kicker")}</span>
            <h3>{t("vcommercePortal:portal.payouts.needsRegistration.title")}</h3>
            <p>{t("vcommercePortal:portal.payouts.needsRegistration.text")}</p>
          </div>
          <button type="button" onClick={() => setShowRegistrationForm((v) => !v)}>
            {showRegistrationForm ? t("vcommercePortal:portal.payouts.needsRegistration.hideButton") : t("vcommercePortal:portal.payouts.needsRegistration.showButton")}
          </button>
        </div>
      ) : connect?.connectPlatformEnabled === false && !connect?.connectedAccountId ? (
        <div className="vco-connect-card">
          <div>
            <span className="vco-kicker">{t("vcommercePortal:portal.payouts.kicker")}</span>
            <h3>{t("vcommercePortal:portal.payouts.almostReady.title")}</h3>
            <p>{t("vcommercePortal:portal.payouts.almostReady.text")}</p>
          </div>
        </div>
      ) : (
        <div className="vco-connect-card">
          <div>
            <span className="vco-kicker">{t("vcommercePortal:portal.payouts.kicker")}</span>
            <h3>{connect?.payoutsEnabled ? t("vcommercePortal:portal.payouts.ready.titleReady") : t("vcommercePortal:portal.payouts.ready.titleNotReady")}</h3>
            <p>{connect?.payoutsEnabled ? t("vcommercePortal:portal.payouts.ready.textReady") : t("vcommercePortal:portal.payouts.ready.textNotReady")}</p>
            {connect?.error && <small>{connect.error}</small>}
          </div>
          {connect?.payoutsEnabled ? (
            <button type="button" onClick={openStripeDashboard} disabled={connecting}>
              {connecting ? t("vcommercePortal:portal.payouts.ready.opening") : t("vcommercePortal:portal.payouts.ready.manageButton")}
            </button>
          ) : (
            <button type="button" onClick={beginConnect} disabled={connecting}>
              {connecting ? t("vcommercePortal:portal.payouts.ready.opening") : connect?.status === "pending" ? t("vcommercePortal:portal.payouts.ready.continueVerificationButton") : t("vcommercePortal:portal.payouts.ready.setupButton")}
            </button>
          )}
        </div>
      )}
      {showRegistrationForm && (
        <div className="vco-apply-form__payout-fields" style={{ margin: "16px 0" }}>
          <PayoutRegistrationForm
            value={registration}
            onChange={setRegistration}
            companyRegistrationNumber={companyRegistrationNumber}
            vatNumber={vatNumber}
            onChangeCompanyFields={(fields) => {
              if (fields.companyRegistrationNumber !== undefined) setCompanyRegistrationNumber(fields.companyRegistrationNumber);
              if (fields.vatNumber !== undefined) setVatNumber(fields.vatNumber);
            }}
          />
          {registrationError && <p className="vco-apply-form__error">{registrationError}</p>}
          <button type="button" onClick={saveRegistration} disabled={savingRegistration}>
            {savingRegistration ? t("vcommercePortal:portal.payouts.saving") : t("vcommercePortal:portal.payouts.saveButton")}
          </button>
        </div>
      )}
      {connect?.connectedAccountId && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,margin:"16px 0" }}>
          <div style={S.card}><small>{t("vcommercePortal:portal.payouts.balance.available")}</small><strong style={{display:"block",fontSize:"1.25rem",marginTop:6}}>{formatPrice(connect.balance?.available?.find((x) => x.currency === "eur")?.amount || 0)}</strong></div>
          <div style={S.card}><small>{t("vcommercePortal:portal.payouts.balance.pending")}</small><strong style={{display:"block",fontSize:"1.25rem",marginTop:6}}>{formatPrice(connect.balance?.pending?.find((x) => x.currency === "eur")?.amount || 0)}</strong></div>
          <div style={S.card}><small>{t("vcommercePortal:portal.payouts.balance.schedule")}</small><strong style={{display:"block",fontSize:"1.05rem",marginTop:6,textTransform:"capitalize"}}>{connect.payoutScheduleInterval || t("vcommercePortal:portal.payouts.balance.scheduleDefault")}</strong></div>
        </div>
      )}
      {connect?.requirementsCurrentlyDue?.length > 0 && (
        <p style={{padding:"12px 16px",background:"rgba(245,158,11,.12)",borderRadius:8}}>
          {t("vcommercePortal:portal.payouts.requirementsDue", { list: connect.requirementsCurrentlyDue.join(", ") })}
        </p>
      )}
      <p style={{ fontSize:"0.875rem",color:"var(--color-text-secondary,#666)",marginBottom:20,padding:"12px 16px",background:"rgba(139,92,246,0.06)",borderRadius:8 }}>
        {t("vcommercePortal:portal.payouts.infoNote")}
      </p>
      {loading ? (
        <p style={{ color:"var(--color-text-muted,#888)",padding:40,textAlign:"center" }}>{t("vcommercePortal:portal.payouts.loading")}</p>
      ) : payouts.length === 0 ? (
        <p style={{ color:"var(--color-text-muted,#888)",textAlign:"center",padding:40 }}>{t("vcommercePortal:portal.payouts.empty")}</p>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t("vcommercePortal:portal.payouts.table.created")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.payouts.table.arrival")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.payouts.table.amount")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.payouts.table.status")}</th>
                <th style={S.th}>{t("vcommercePortal:portal.payouts.table.reference")}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p._id}>
                  <td style={S.td}>{formatDate(p.createdAt)}</td>
                  <td style={S.td}>{p.arrivalDate ? formatDate(p.arrivalDate) : "—"}</td>
                  <td style={S.td}><strong>{formatPrice(p.amountMinor ?? p.netMinor, p.currency)}</strong></td>
                  <td style={S.td}><span style={S.badge(p.status==="paid"?"green":p.status==="failed"?"red":"yellow")}>{p.status}</span></td>
                  <td style={S.td}><span style={{ fontSize:"0.78rem",color:"var(--color-text-muted,#888)" }}>{p.stripePayoutId || p.paymentReference || "—"}{p.bankLast4 ? ` · •••• ${p.bankLast4}` : ""}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PromotionsTab() {
  const { t } = useTranslation(["vcommercePortal"]);
  return (
    <section className="vco-promotions" aria-labelledby="vco-promotions-title">
      <div className="vco-promotions__intro">
        <span className="vco-kicker">{t("vcommercePortal:portal.promotions.kicker")}</span>
        <h2 id="vco-promotions-title">{t("vcommercePortal:portal.promotions.title")}</h2>
        <p>{t("vcommercePortal:portal.promotions.text")}</p>
      </div>
      <div className="vco-promotion-grid">
        {PROMOTION_OPTIONS.map(([name, duration, price], index) => (
          <article className="vco-promotion-card" key={name} style={{ "--vco-delay": `${index * 55}ms` }}>
            <span className="vco-promotion-card__eyebrow">{duration}</span>
            <h3>{name}</h3>
            <strong>{price}</strong>
            <button type="button" disabled title={t("vcommercePortal:portal.promotions.requestTooltip")}>{t("vcommercePortal:portal.promotions.requestButton")}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Import tab ──
const TEMPLATE_COLS = ["name","description","type","priceEUR","stockCount","deliveryInfo","isAvailable","minOrderQty","tier1_minQty","tier1_priceEUR","tier2_minQty","tier2_priceEUR","tags"];

function ImportTab({ businessId }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null); // [{ row, cols... }]
  const [fileName, setFileName] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  useEffect(() => {
    getMyImportHistory()
      .then((d) => setHistory(d.logs || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [businessId]);

  async function parseFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert(t("vcommercePortal:portal.import.fileTooLarge")); return; }
    setFileName(file.name);
    setFileObj(file);
    setResult(null);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const buf = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buf);
      const worksheet = workbook.worksheets[0];
      if (!worksheet || worksheet.rowCount < 2) { setPreview([]); return; }
      const cellText = (cell) => {
        const value = cell?.value;
        if (value && typeof value === "object") {
          if (Array.isArray(value.richText)) return value.richText.map((rt) => rt.text).join("");
          if (value.result !== undefined) return value.result;
          if (value.text !== undefined) return value.text;
        }
        return value === null || value === undefined ? "" : value;
      };
      const headers = [];
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cellText(cell) || "");
      });
      const data = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj = { _row: rowNumber };
        headers.forEach((h, colNumber) => {
          if (!h) return;
          obj[h] = cellText(row.getCell(colNumber));
        });
        data.push(obj);
      });
      setPreview(data);
    } catch (err) {
      alert(t("vcommercePortal:portal.import.readError", { error: err?.message || "unknown error" }));
    }
  }

  function onFileChange(e) {
    parseFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    parseFile(e.dataTransfer.files?.[0]);
  }

  async function handleImport() {
    if (!fileObj) return;
    setImporting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", fileObj);
      const data = await postImportProducts(fd);
      setResult(data);
      setPreview(null);
      setFileName("");
      setFileObj(null);
      // Refresh history
      const h = await getMyImportHistory().catch(() => ({ logs: [] }));
      setHistory(h.logs || []);
    } catch (err) {
      setResult({ error: err?.message || t("vcommercePortal:portal.import.genericFailure") });
    } finally {
      setImporting(false);
    }
  }

  async function handleTemplateDownload() {
    setDownloadingTemplate(true);
    try {
      const blob = await getProductsTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vcommerce-product-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(t("vcommercePortal:portal.import.templateDownloadError", { error: err?.message || "error" }));
    } finally {
      setDownloadingTemplate(false);
    }
  }

  const dropZoneStyle = {
    border: `2px dashed ${dragging ? "var(--color-accent,#8B5CF6)" : "var(--color-border,rgba(128,128,128,0.3))"}`,
    borderRadius: 12,
    padding: "40px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: dragging ? "rgba(139,92,246,0.05)" : "var(--color-card-bg,#fff)",
    transition: "border-color 0.15s, background 0.15s",
  };

  const previewCols = preview?.[0] ? Object.keys(preview[0]).filter((k) => k !== "_row") : TEMPLATE_COLS;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700 }}>{t("vcommercePortal:portal.import.title")}</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary,#666)" }}>
            {t("vcommercePortal:portal.import.subtitle")}
          </p>
        </div>
        <button type="button" style={S.btn("ghost")} onClick={handleTemplateDownload} disabled={downloadingTemplate}>
          {downloadingTemplate ? t("vcommercePortal:portal.import.downloading") : t("vcommercePortal:portal.import.templateButton")}
        </button>
      </div>

      {/* Drop zone */}
      {!preview && (
        <div
          ref={dropRef}
          style={dropZoneStyle}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📂</div>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{fileName || t("vcommercePortal:portal.import.dropzone.placeholder")}</p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted,#888)" }}>{t("vcommercePortal:portal.import.dropzone.hint")}</p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={onFileChange} />
        </div>
      )}

      {/* Preview table */}
      {preview !== null && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong style={{ fontSize: "0.9rem" }}>{fileName}</strong>
              <span style={{ marginLeft: 8, fontSize: "0.82rem", color: "var(--color-text-muted,#888)" }}>
                {t("vcommercePortal:portal.import.rowsDetected", { count: preview.length })}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={S.btn("ghost")} onClick={() => { setPreview(null); setFileName(""); setFileObj(null); }}>
                {t("vcommercePortal:portal.import.clearButton")}
              </button>
              <button type="button" style={S.btn()} onClick={handleImport} disabled={importing || preview.length === 0}>
                {importing ? t("vcommercePortal:portal.import.importing") : t("vcommercePortal:portal.import.importButton", { count: preview.length })}
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
            <table style={{ ...S.table, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, whiteSpace: "nowrap" }}>#</th>
                  {previewCols.map((c) => <th key={c} style={{ ...S.th, whiteSpace: "nowrap" }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row._row}>
                    <td style={{ ...S.td, color: "var(--color-text-muted,#aaa)", fontSize: "0.78rem" }}>{row._row}</td>
                    {previewCols.map((c) => (
                      <td key={c} style={{ ...S.td, whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import result */}
      {result && (
        <div style={{ ...S.card, background: result.error ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)", border: `1px solid ${result.error ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
          {result.error ? (
            <p style={{ margin: 0, color: "#DC2626", fontWeight: 600 }}>{t("vcommercePortal:portal.import.result.failed", { error: result.error })}</p>
          ) : (
            <>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#059669" }}>
                {t("vcommercePortal:portal.import.result.complete", { imported: result.imported, skipped: result.skipped ?? 0 })}
              </p>
              {result.errors?.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.82rem", color: "#B45309" }}>
                  {result.errors.map((e, i) => <li key={i}>{t("vcommercePortal:portal.import.result.rowError", { row: e.row, message: e.message })}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* Import history */}
      <div style={{ marginTop: 28 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700 }}>{t("vcommercePortal:portal.import.history.title")}</h4>
        {histLoading ? (
          <p style={{ color: "var(--color-text-muted,#888)", fontSize: "0.875rem" }}>{t("vcommercePortal:portal.import.history.loading")}</p>
        ) : history.length === 0 ? (
          <p style={{ color: "var(--color-text-muted,#888)", fontSize: "0.875rem" }}>{t("vcommercePortal:portal.import.history.empty")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>{t("vcommercePortal:portal.import.history.table.file")}</th>
                  <th style={S.th}>{t("vcommercePortal:portal.import.history.table.imported")}</th>
                  <th style={S.th}>{t("vcommercePortal:portal.import.history.table.errors")}</th>
                  <th style={S.th}>{t("vcommercePortal:portal.import.history.table.date")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log, i) => (
                  <tr key={i}>
                    <td style={S.td}><span style={{ fontSize: "0.82rem" }}>{log.filename}</span></td>
                    <td style={S.td}><span style={S.badge("green")}>{log.importedCount}</span></td>
                    <td style={S.td}>
                      {log.errorCount > 0
                        ? <span style={S.badge("red")}>{log.errorCount}</span>
                        : <span style={{ color: "var(--color-text-muted,#aaa)", fontSize: "0.8rem" }}>—</span>}
                    </td>
                    <td style={S.td}>{formatDate(log.importedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings tab ──
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploadField({ label, currentUrl, field, onUploaded }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");
  const [err, setErr] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const imageData = await readFileAsDataUrl(file);
      setPreview(imageData);
      const { url } = await uploadBusinessImage(field, imageData);
      setPreview(url);
      onUploaded(url);
    } catch (uploadErr) {
      setErr(uploadErr?.message || t("vcommercePortal:portal.settings.imageUpload.uploadError"));
      setPreview(currentUrl || "");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isLogo = field === "logo";
  const previewStyle = isLogo
    ? { width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid var(--color-border,rgba(128,128,128,0.2))" }
    : { width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border,rgba(128,128,128,0.2))" };

  return (
    <div style={{ marginBottom: 4 }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {preview
          ? <img src={preview} alt={label} style={previewStyle} />
          : <div style={{ ...previewStyle, background: "var(--color-bg-muted,rgba(128,128,128,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isLogo ? "1.5rem" : "1rem", color: "var(--color-text-muted,#aaa)", width: isLogo ? 80 : "100%" }}>
              {isLogo ? "🏪" : t("vcommercePortal:portal.settings.imageUpload.noBanner")}
            </div>
        }
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFile} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            style={{ ...S.btn("sm"), opacity: uploading ? 0.6 : 1 }}>
            {uploading ? t("vcommercePortal:portal.settings.imageUpload.uploading") : preview ? t("vcommercePortal:portal.settings.imageUpload.changeImage") : t("vcommercePortal:portal.settings.imageUpload.uploadImage")}
          </button>
          {preview && (
            <button type="button" onClick={() => { setPreview(""); onUploaded(""); }}
              style={{ ...S.btn("ghost"), fontSize: "0.75rem", padding: "4px 10px" }}>
              {t("vcommercePortal:portal.settings.imageUpload.removeButton")}
            </button>
          )}
        </div>
      </div>
      {err && <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#DC2626" }}>{err}</p>}
    </div>
  );
}

function SettingsTab({ business, onRefresh }) {
  const { t } = useTranslation(["vcommercePortal"]);
  const [form, setForm] = useState({
    tagline: business.tagline || "",
    description: business.description || "",
    contactEmail: business.contactEmail || "",
    contactPhone: business.contactPhone || "",
    website: business.website || "",
    sellingMode: business.sellingMode || "hosted",
    socialLinks: {
      instagram: business.socialLinks?.instagram || "",
      facebook: business.socialLinks?.facebook || "",
      linkedin: business.socialLinks?.linkedin || "",
      tiktok: business.socialLinks?.tiktok || "",
      whatsapp: business.socialLinks?.whatsapp || "",
    },
    payoutBankName: business.payoutBankName || "",
    payoutIBAN: business.payoutIBAN || "",
    payoutBankHolder: business.payoutBankHolder || "",
  });
  const [images, setImages] = useState({ logoUrl: business.logoUrl || "", bannerUrl: business.bannerUrl || "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "success" });

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }
  function setSocialField(key) {
    return (e) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", type: "success" });
    try {
      await patchMyBusiness({ ...form, ...images });
      setMsg({ text: t("vcommercePortal:portal.settings.saveSuccess"), type: "success" });
      onRefresh();
    } catch (err) {
      setMsg({ text: err?.message || t("vcommercePortal:portal.settings.saveError"), type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const msgColor = msg.type === "error" ? { background: "rgba(239,68,68,0.1)", color: "#DC2626" } : { background: "rgba(16,185,129,0.1)", color: "#059669" };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 560 }}>
      {msg.text && <p style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", ...msgColor }}>{msg.text}</p>}

      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.settings.brandImages.title")}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ImageUploadField
            label={t("vcommercePortal:portal.settings.brandImages.logoLabel")}
            currentUrl={images.logoUrl}
            field="logo"
            onUploaded={(url) => setImages((i) => ({ ...i, logoUrl: url }))}
          />
          <ImageUploadField
            label={t("vcommercePortal:portal.settings.brandImages.bannerLabel")}
            currentUrl={images.bannerUrl}
            field="banner"
            onUploaded={(url) => setImages((i) => ({ ...i, bannerUrl: url }))}
          />
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.settings.publicProfile.title")}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={S.label}>{t("vcommercePortal:portal.settings.publicProfile.taglineLabel")} <span style={{ fontWeight: 400, fontSize: "0.75rem" }}>({form.tagline.length}/160)</span></label><input style={S.input} type="text" maxLength={160} value={form.tagline} onChange={setField("tagline")} /></div>
          <div><label style={S.label}>{t("vcommercePortal:portal.settings.publicProfile.descriptionLabel")}</label><textarea style={{ ...S.input, minHeight: 100, resize: "vertical" }} maxLength={3000} value={form.description} onChange={setField("description")} /></div>
          <div><label style={S.label}>{t("vcommercePortal:portal.settings.publicProfile.contactEmailLabel")}</label><input style={S.input} type="email" value={form.contactEmail} onChange={setField("contactEmail")} /></div>
          <div><label style={S.label}>{t("vcommercePortal:portal.settings.publicProfile.contactPhoneLabel")}</label><input style={S.input} type="tel" value={form.contactPhone} onChange={setField("contactPhone")} /></div>
          <div><label style={S.label}>{t("vcommercePortal:portal.settings.publicProfile.websiteLabel")}</label><input style={S.input} type="url" value={form.website} onChange={setField("website")} placeholder={t("vcommercePortal:portal.settings.publicProfile.websitePlaceholder")} /></div>
          <div><label style={S.label}>{t("vcommercePortal:portal.settings.publicProfile.sellingModeLabel")}</label><select style={S.input} value={form.sellingMode} onChange={setField("sellingMode")}>{SELLING_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.settings.socialLinks.title")}</h3>
        <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "var(--color-text-muted,#888)" }}>{t("vcommercePortal:portal.settings.socialLinks.text")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "instagram", label: t("vcommercePortal:portal.settings.socialLinks.instagram"), placeholder: t("vcommercePortal:portal.settings.socialLinks.instagramPlaceholder") },
            { key: "facebook", label: t("vcommercePortal:portal.settings.socialLinks.facebook"), placeholder: t("vcommercePortal:portal.settings.socialLinks.facebookPlaceholder") },
            { key: "linkedin", label: t("vcommercePortal:portal.settings.socialLinks.linkedin"), placeholder: t("vcommercePortal:portal.settings.socialLinks.linkedinPlaceholder") },
            { key: "tiktok", label: t("vcommercePortal:portal.settings.socialLinks.tiktok"), placeholder: t("vcommercePortal:portal.settings.socialLinks.tiktokPlaceholder") },
            { key: "whatsapp", label: t("vcommercePortal:portal.settings.socialLinks.whatsapp"), placeholder: t("vcommercePortal:portal.settings.socialLinks.whatsappPlaceholder") },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              <input style={S.input} type="text" value={form.socialLinks[key]} onChange={setSocialField(key)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>

      {business.stripeConnectedAccountId || business.connectCheckoutEnabled ? (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.settings.bankDetails.title")}</h3>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-secondary,#666)" }}>
            {t("vcommercePortal:portal.settings.bankDetails.connectedTextPrefix")} <strong>{t("vcommercePortal:portal.settings.bankDetails.connectedTextStrong")}</strong> {t("vcommercePortal:portal.settings.bankDetails.connectedTextSuffix")}
          </p>
        </div>
      ) : (
        <div style={S.card}>
          <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>{t("vcommercePortal:portal.settings.bankDetails.title")}</h3>
          <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "var(--color-text-muted,#888)" }}>{t("vcommercePortal:portal.settings.bankDetails.notConnectedText")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={S.label}>{t("vcommercePortal:portal.settings.bankDetails.accountHolderLabel")}</label><input style={S.input} type="text" value={form.payoutBankHolder} onChange={setField("payoutBankHolder")} placeholder={t("vcommercePortal:portal.settings.bankDetails.accountHolderPlaceholder")} /></div>
            <div><label style={S.label}>{t("vcommercePortal:portal.settings.bankDetails.ibanLabel")}</label><input style={S.input} type="text" value={form.payoutIBAN} onChange={setField("payoutIBAN")} placeholder={t("vcommercePortal:portal.settings.bankDetails.ibanPlaceholder")} /></div>
            <div><label style={S.label}>{t("vcommercePortal:portal.settings.bankDetails.bankNameLabel")}</label><input style={S.input} type="text" value={form.payoutBankName} onChange={setField("payoutBankName")} placeholder={t("vcommercePortal:portal.settings.bankDetails.bankNamePlaceholder")} /></div>
          </div>
        </div>
      )}

      <button type="submit" disabled={saving} style={{ ...S.btn(), padding: "11px 24px" }}>
        {saving ? t("vcommercePortal:portal.settings.saving") : t("vcommercePortal:portal.settings.saveButton")}
      </button>
    </form>
  );
}

// ── Main portal page ──
export default function VCommercePortalPage() {
  const { t } = useTranslation(["vcommercePortal"]);
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const hasLoadedOnce = useRef(false);

  const loadBusiness = useCallback(() => {
    getMyBusiness()
      .then((d) => {
        setBusiness(d.business || null);
        setError(null);
        hasLoadedOnce.current = true;
      })
      .catch((err) => {
        // A refresh after saving (Settings, adding a product, etc.) can fail
        // transiently — don't wipe out the page the user is already on and
        // drop them into the "No business found" gate for that. Only treat
        // it as fatal if we've never successfully loaded anything yet.
        if (!hasLoadedOnce.current) {
          setError(err?.message || t("vcommercePortal:portal.main.loadError"));
        } else {
          console.warn("[vcommerce] Could not refresh business data:", err?.message);
        }
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { loadBusiness(); }, [loadBusiness]);

  if (loading) {
    return (
      <div style={{ padding:"60px 24px",textAlign:"center" }}>
        <div style={{ display:"inline-flex",gap:6 }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"var(--color-accent,#8B5CF6)",opacity:0.4,animation:`pulse 1.2s ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div style={{ maxWidth:560,margin:"0 auto",padding:"60px 24px",textAlign:"center" }}>
        <div style={{ fontSize:"3rem",marginBottom:16 }}>🏪</div>
        <h2 style={{ fontSize:"1.5rem",fontWeight:700,marginBottom:12 }}>{t("vcommercePortal:portal.main.noBusiness.title")}</h2>
        <p style={{ color:"var(--color-text-secondary,#666)",marginBottom:24 }}>
          {error || t("vcommercePortal:portal.main.noBusiness.fallbackText")}
        </p>
        <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
          <Link to="/vcommerce/apply" className="vco-btn vco-btn--primary">{t("vcommercePortal:portal.main.noBusiness.applyButton")}</Link>
          <Link to="/dashboard" className="vco-btn vco-btn--ghost">{t("vcommercePortal:portal.main.noBusiness.backButton")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vco-portal-shell" style={{ position:"relative",maxWidth:1040,margin:"0 auto",padding:"clamp(48px,8vw,72px) 24px 60px" }}>
      <HeroActionCluster />
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" }}>
          <div>
            <h1 style={{ margin:"0 0 4px",fontSize:"1.4rem",fontWeight:800 }}>{t("vcommercePortal:portal.main.title")}</h1>
            <p style={{ margin:0,fontSize:"0.9rem",color:"var(--color-text-secondary,#666)" }}>{business.businessName}</p>
          </div>
          <div className="dashboard-subpage-nav" style={{ margin:0,width:"auto" }}>
            <Link to="/dashboard" className="dashboard-subpage-nav__btn">
              <IconArrowLeft aria-hidden stroke={2} />
              <span>{t("vcommercePortal:portal.main.backToDashboard")}</span>
            </Link>
            <Link to="/dashboard/vcommerce" className="dashboard-subpage-nav__btn" aria-current="page">
              <IconHome aria-hidden stroke={1.8} />
              <span>{t("vcommercePortal:portal.main.businessHub")}</span>
            </Link>
          </div>
        </div>
        {business.status === "active" && (
          <a href={`/vcommerce/${business.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:"0.85rem",color:"var(--color-accent,#8B5CF6)",textDecoration:"none",display:"flex",alignItems:"center",gap:4 }}>
            {t("vcommercePortal:portal.main.viewPublicPage")}
          </a>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,borderBottom:"1px solid var(--color-border,rgba(128,128,128,0.15))",marginBottom:28,overflowX:"auto" }}>
        {TAB_KEYS.map((key, i) => (
          <button key={key} type="button" onClick={() => setActiveTab(i)}
            style={{ padding:"10px 18px",background:"none",border:"none",cursor:"pointer",fontWeight:activeTab===i?700:400,color:activeTab===i?"var(--color-accent,#8B5CF6)":"var(--color-text-secondary,#666)",borderBottom:activeTab===i?"2px solid var(--color-accent,#8B5CF6)":"2px solid transparent",fontSize:"0.9rem",whiteSpace:"nowrap",marginBottom:-1 }}>
            {t(`vcommercePortal:portal.tabs.${key}`)}
          </button>
        ))}
      </div>

      {activeTab === 0 && <OverviewTab business={business} onRefresh={loadBusiness} onNavigateTab={setActiveTab} />}
      {activeTab === 1 && <ProductsTab businessId={business._id} />}
      {activeTab === 2 && <OrdersTab />}
      {activeTab === 3 && <PayoutsTab business={business} onRefresh={loadBusiness} />}
      {activeTab === 4 && <PromotionsTab />}
      {activeTab === 5 && <SettingsTab business={business} onRefresh={loadBusiness} />}
      {activeTab === 6 && <ImportTab businessId={business._id} />}
    </div>
  );
}
