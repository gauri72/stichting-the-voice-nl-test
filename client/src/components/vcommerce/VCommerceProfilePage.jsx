import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getVCommerceProfile } from "./shared/vcommerceApi.js";
import { BUSINESS_CATEGORY_LABELS, CATEGORY_ICONS } from "./shared/BUSINESS_CATEGORIES.js";
import { useCart } from "./cart/useCart.js";
import CartDrawer from "./cart/CartDrawer.jsx";
import { useWholesaler } from "../../contexts/WholesalerContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

function formatPrice(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function SocialLinks({ links = {} }) {
  const entries = Object.entries(links).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div className="vco-social-links">
      {entries.map(([key, value]) => {
        const url = value.startsWith("http") ? value : `https://${value}`;
        const labels = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", tiktok: "TikTok", whatsapp: "WhatsApp" };
        return (
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="vco-social-link">
            {labels[key] || key}
          </a>
        );
      })}
    </div>
  );
}

function resolveUnitPrice(product, qty) {
  const tiers = [...(product.bulkPricingTiers ?? [])].sort((a, b) => b.minQty - a.minQty);
  for (const tier of tiers) {
    if (qty >= tier.minQty) return tier.priceMinor;
  }
  return product.priceMinor;
}

function ProductCard({ product, cashbackPercent, onSelect, isApprovedWholesaler }) {
  const hasWholesale = product.bulkPricingTiers?.length > 0;
  return (
    <div className="vco-product-card" onClick={() => onSelect(product)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(product)}>
      <div className="vco-product-card__image">
        {product.imageUrls?.[0]
          ? <img src={product.imageUrls[0]} alt={product.name} />
          : <span>📦</span>
        }
      </div>
      <div className="vco-product-card__body">
        <p className="vco-product-card__type">{product.type}</p>
        <p className="vco-product-card__name">{product.name}</p>
        <p className="vco-product-card__price">{formatPrice(product.priceMinor, product.currency)}</p>
        {hasWholesale && (
          <span className="vco-cashback-pill" style={{ marginTop: 4 }}>
            🏷️ {isApprovedWholesaler ? "Bulk pricing available" : "Wholesale pricing — register to unlock"}
          </span>
        )}
        {cashbackPercent > 0 && (
          <span className="vco-cashback-pill">
            🎁 +{formatPrice(Math.round(product.priceMinor * cashbackPercent / 100), product.currency)} cashback
          </span>
        )}
      </div>
    </div>
  );
}

function ProductModal({ product, business, onClose, onAddToCart, isApprovedWholesaler, isAuthenticated }) {
  const [qty, setQty] = useState(product?.minOrderQty || 1);
  const [selectedVariant, setSelectedVariant] = useState("");

  if (!product) return null;

  const hasTiers = product.bulkPricingTiers?.length > 0;
  const effectiveUnitPrice = resolveUnitPrice(product, qty);
  const minQty = product.minOrderQty || 1;

  function handleAdd() {
    onAddToCart(business, product, qty, selectedVariant);
    onClose();
  }

  const sortedTiers = [...(product.bulkPricingTiers ?? [])].sort((a, b) => a.minQty - b.minQty);

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:20,maxWidth:540,width:"100%",overflow:"hidden",maxHeight:"90vh",overflowY:"auto" }}>
        {product.imageUrls?.[0] && (
          <img src={product.imageUrls[0]} alt={product.name} style={{ width:"100%",height:240,objectFit:"cover" }} />
        )}
        <div style={{ padding:28 }}>
          <p style={{ fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.06em",color:"var(--color-text-muted,#aaa)",margin:"0 0 6px" }}>{product.type}</p>
          <h2 style={{ fontSize:"1.4rem",fontWeight:700,margin:"0 0 8px" }}>{product.name}</h2>
          <p style={{ color:"var(--color-text-secondary,#666)",fontSize:"0.9rem",lineHeight:1.6,margin:"0 0 16px" }}>
            {product.description || "No description provided."}
          </p>
          {product.deliveryInfo && (
            <p style={{ fontSize:"0.8rem",color:"var(--color-text-muted,#aaa)",marginBottom:12 }}>📦 {product.deliveryInfo}</p>
          )}

          {product.variants?.length > 0 && product.variants.map((v) => (
            <div key={v.name} style={{ marginBottom:12 }}>
              <p style={{ fontSize:"0.8rem",fontWeight:600,margin:"0 0 6px" }}>{v.name}</p>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {v.options.map((opt) => (
                  <button key={opt} type="button"
                    onClick={() => setSelectedVariant(opt)}
                    style={{ padding:"4px 12px",borderRadius:6,border:`1px solid ${selectedVariant===opt?"var(--color-accent,#8B5CF6)":"var(--color-border,rgba(128,128,128,0.3))"}`,background:selectedVariant===opt?"rgba(139,92,246,0.1)":"none",cursor:"pointer",fontSize:"0.85rem" }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bulk pricing tier table — visible to approved wholesalers */}
          {hasTiers && isApprovedWholesaler && (
            <div style={{ marginBottom:16,borderRadius:10,border:"1px solid rgba(139,92,246,0.2)",overflow:"hidden" }}>
              <div style={{ background:"rgba(139,92,246,0.06)",padding:"8px 14px",fontSize:"0.78rem",fontWeight:700,color:"var(--color-accent,#8B5CF6)",textTransform:"uppercase",letterSpacing:"0.04em" }}>
                🏷️ Wholesale Pricing
              </div>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.85rem" }}>
                <thead>
                  <tr>
                    <th style={{ padding:"8px 14px",textAlign:"left",fontWeight:600,color:"var(--color-text-muted,#888)",fontSize:"0.75rem",borderBottom:"1px solid rgba(128,128,128,0.1)" }}>Min. Qty</th>
                    <th style={{ padding:"8px 14px",textAlign:"right",fontWeight:600,color:"var(--color-text-muted,#888)",fontSize:"0.75rem",borderBottom:"1px solid rgba(128,128,128,0.1)" }}>Unit Price</th>
                    <th style={{ padding:"8px 14px",textAlign:"right",fontWeight:600,color:"var(--color-text-muted,#888)",fontSize:"0.75rem",borderBottom:"1px solid rgba(128,128,128,0.1)" }}>vs. Retail</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ minQty: 1, priceMinor: product.priceMinor, _isRetail: true }, ...sortedTiers].map((tier, i) => {
                    const isActive = qty >= tier.minQty && (i === sortedTiers.length || qty < (sortedTiers[i]?.minQty ?? Infinity));
                    const saving = tier._isRetail ? null : Math.round((1 - tier.priceMinor / product.priceMinor) * 100);
                    return (
                      <tr key={i} style={{ background: isActive ? "rgba(139,92,246,0.06)" : "transparent" }}>
                        <td style={{ padding:"8px 14px",fontWeight:isActive?700:400 }}>
                          {tier._isRetail ? "1+" : `${tier.minQty}+`}
                          {isActive && <span style={{ marginLeft:6,fontSize:"0.7rem",color:"var(--color-accent,#8B5CF6)" }}>← current</span>}
                        </td>
                        <td style={{ padding:"8px 14px",textAlign:"right",fontWeight:isActive?700:400 }}>
                          {formatPrice(tier.priceMinor, product.currency)}
                        </td>
                        <td style={{ padding:"8px 14px",textAlign:"right",color:saving>0?"#059669":"var(--color-text-muted,#aaa)",fontWeight:saving>0?600:400 }}>
                          {saving > 0 ? `−${saving}%` : tier._isRetail ? "Retail" : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Wholesale CTA for non-wholesaler logged-in users */}
          {hasTiers && !isApprovedWholesaler && (
            <div style={{ marginBottom:16,padding:"12px 16px",borderRadius:10,background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.15)" }}>
              <p style={{ margin:"0 0 8px",fontSize:"0.85rem",fontWeight:600 }}>🏷️ Wholesale pricing available</p>
              <p style={{ margin:"0 0 10px",fontSize:"0.82rem",color:"var(--color-text-secondary,#666)" }}>
                Register as a wholesaler to unlock tiered bulk pricing on this product.
              </p>
              <Link to="/vcommerce/wholesaler/register" className="vco-btn vco-btn--primary" style={{ fontSize:"0.82rem",padding:"6px 14px" }}>
                Register as Wholesaler
              </Link>
            </div>
          )}

          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
            <div>
              <span style={{ fontSize:"1.4rem",fontWeight:700,color:"var(--color-accent,#8B5CF6)" }}>
                {formatPrice(effectiveUnitPrice * qty, product.currency)}
              </span>
              {hasTiers && isApprovedWholesaler && effectiveUnitPrice !== product.priceMinor && (
                <span style={{ marginLeft:8,fontSize:"0.82rem",color:"var(--color-text-muted,#aaa)",textDecoration:"line-through" }}>
                  {formatPrice(product.priceMinor * qty, product.currency)}
                </span>
              )}
            </div>
            {business.cashbackPercent > 0 && (
              <span className="vco-cashback-pill" style={{ fontSize:"0.82rem" }}>
                🎁 {business.cashbackPercent}% cashback
              </span>
            )}
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <button type="button" onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                style={{ width:32,height:32,borderRadius:8,border:"1px solid var(--color-border,rgba(128,128,128,0.3))",background:"none",cursor:"pointer",fontSize:"1rem" }}>−</button>
              <span style={{ fontWeight:600,minWidth:24,textAlign:"center" }}>{qty}</span>
              <button type="button" onClick={() => setQty((q) => product.maxOrderQty ? Math.min(product.maxOrderQty, q + 1) : q + 1)}
                style={{ width:32,height:32,borderRadius:8,border:"1px solid var(--color-border,rgba(128,128,128,0.3))",background:"none",cursor:"pointer",fontSize:"1rem" }}>+</button>
            </div>
            {minQty > 1 && (
              <span style={{ fontSize:"0.78rem",color:"var(--color-text-muted,#aaa)" }}>Min. {minQty}</span>
            )}
            <button type="button" className="vco-btn vco-btn--primary" style={{ flex:1 }} onClick={handleAdd}>
              Add to Cart
            </button>
          </div>
          <button type="button" className="vco-btn vco-btn--ghost" style={{ width:"100%" }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VCommerceProfilePage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isApprovedWholesaler } = useWholesaler();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    cart, drawerOpen, openDrawer, closeDrawer,
    addToCart, removeFromCart, updateQty,
    subtotalMinor, cashbackMinor, itemCount,
  } = useCart();

  // Capture referral code from ?ref= and store in sessionStorage
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) sessionStorage.setItem("vco_ref", ref);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    getVCommerceProfile(slug)
      .then((d) => {
        setData(d);
        if (d?.profile?.businessName) {
          document.title = `${d.profile.businessName} — V.Commerce`;
        }
      })
      .catch((err) => setError(err?.message || "Business not found"))
      .finally(() => setLoading(false));
    return () => { document.title = "V.O.I.C.E. NL"; };
  }, [slug]);

  if (loading) {
    return (
      <div className="vco-profile-page">
        <div style={{ display:"flex",justifyContent:"center",padding:"80px 24px" }}>
          <div className="vco-loading-dots"><span/><span/><span/></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="vco-error-page">
        <div className="vco-gate-icon">🔍</div>
        <h1 style={{ fontSize:"1.5rem",fontWeight:700 }}>Business Not Found</h1>
        <p style={{ color:"var(--color-text-secondary,#666)" }}>
          {error || "This business listing isn't available."}
        </p>
        <Link to="/vcommerce" className="vco-btn vco-btn--primary">Back to V.Commerce</Link>
      </div>
    );
  }

  const { profile, products = [] } = data;
  const icon = CATEGORY_ICONS[profile.category] || "✨";

  return (
    <div className="vco-profile-page">
      {/* Floating cart button */}
      {itemCount > 0 && (
        <button type="button" onClick={openDrawer}
          style={{ position:"fixed",bottom:24,right:24,zIndex:800,background:"var(--color-accent,#8B5CF6)",color:"#fff",border:"none",borderRadius:100,padding:"12px 20px",fontSize:"0.95rem",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(139,92,246,0.4)",display:"flex",alignItems:"center",gap:8 }}>
          🛒 {itemCount} item{itemCount !== 1 ? "s" : ""} · {formatPrice(subtotalMinor)}
        </button>
      )}

      <div className="vco-profile-hero">
        {profile.bannerUrl
          ? <img src={profile.bannerUrl} alt={`${profile.businessName} banner`} className="vco-profile-hero__banner" />
          : null
        }
        <div className="vco-profile-hero__overlay" />
      </div>

      <div className="vco-profile-header">
        <div className="vco-profile-header__logo">
          {profile.logoUrl
            ? <img src={profile.logoUrl} alt={`${profile.businessName} logo`} />
            : <span>{icon}</span>
          }
        </div>
      </div>

      <div className="vco-profile-meta">
        <h1 className="vco-profile-meta__name">{profile.businessName}</h1>
        {profile.tagline && <p className="vco-profile-meta__tagline">{profile.tagline}</p>}
        <div className="vco-profile-meta__row">
          <span className="vco-badge vco-badge--category">
            {BUSINESS_CATEGORY_LABELS[profile.category] || profile.category}
          </span>
          {profile.location?.city && (
            <span style={{ fontSize:"0.85rem",color:"var(--color-text-muted,#aaa)" }}>
              📍 {profile.location.city}{profile.location.country ? `, ${profile.location.country}` : ""}
            </span>
          )}
          {profile.cashbackPercent > 0 && (
            <span className="vco-cashback-pill">
              🎁 {profile.cashbackPercent}% V.Wallet cashback on every purchase
            </span>
          )}
        </div>
      </div>

      <div className="vco-profile-body">
        <div>
          <Link to="/vcommerce" style={{ fontSize:"0.85rem",color:"var(--color-text-secondary,#666)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,marginBottom:20 }}>
            ← All businesses
          </Link>

          {profile.description && (
            <div className="vco-profile-about">
              <h2 style={{ fontSize:"1.1rem",fontWeight:700,marginBottom:12 }}>About this business</h2>
              <p style={{ margin:0,whiteSpace:"pre-line" }}>{profile.description}</p>
            </div>
          )}

          {products.length > 0 && (
            <div className="vco-profile-products">
              <h2 className="vco-profile-products__title">
                Products &amp; Services ({products.length})
              </h2>
              <div className="vco-product-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    cashbackPercent={profile.cashbackPercent}
                    onSelect={setSelectedProduct}
                    isApprovedWholesaler={isApprovedWholesaler}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="vco-profile-sidebar">
          {profile.contactEmail && (
            <>
              <p className="vco-profile-sidebar__label">Contact</p>
              <p className="vco-profile-sidebar__value">
                <a href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>
              </p>
            </>
          )}
          {profile.contactPhone && (
            <p className="vco-profile-sidebar__value">
              <a href={`tel:${profile.contactPhone}`}>{profile.contactPhone}</a>
            </p>
          )}
          {profile.website && (
            <>
              <p className="vco-profile-sidebar__label">Website</p>
              <p className="vco-profile-sidebar__value">
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            </>
          )}
          {Object.values(profile.socialLinks || {}).some(Boolean) && (
            <>
              <p className="vco-profile-sidebar__label">Social</p>
              <SocialLinks links={profile.socialLinks} />
            </>
          )}
          <div style={{ marginTop:8 }}>
            <Link to="/vcommerce" className="vco-btn vco-btn--ghost" style={{ width:"100%",boxSizing:"border-box" }}>
              ← All businesses
            </Link>
          </div>
        </aside>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          business={profile}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          isApprovedWholesaler={isApprovedWholesaler}
          isAuthenticated={isAuthenticated}
        />
      )}

      <CartDrawer
        cart={cart}
        drawerOpen={drawerOpen}
        closeDrawer={closeDrawer}
        removeFromCart={removeFromCart}
        updateQty={updateQty}
        subtotalMinor={subtotalMinor}
        cashbackMinor={cashbackMinor}
      />
    </div>
  );
}
