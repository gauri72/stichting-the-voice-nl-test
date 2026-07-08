import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getVCommerceProfile } from "./shared/vcommerceApi.js";
import { BUSINESS_CATEGORY_LABELS, CATEGORY_ICONS } from "./shared/BUSINESS_CATEGORIES.js";
import { useCart } from "./cart/useCart.js";
import CartDrawer from "./cart/CartDrawer.jsx";

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

function ProductCard({ product, cashbackPercent, onSelect }) {
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
        {cashbackPercent > 0 && (
          <span className="vco-cashback-pill">
            🎁 +{formatPrice(Math.round(product.priceMinor * cashbackPercent / 100), product.currency)} cashback
          </span>
        )}
      </div>
    </div>
  );
}

function ProductModal({ product, business, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("");

  if (!product) return null;

  function handleAdd() {
    onAddToCart(business, product, qty, selectedVariant);
    onClose();
  }

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

          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
            <span style={{ fontSize:"1.4rem",fontWeight:700,color:"var(--color-accent,#8B5CF6)" }}>
              {formatPrice(product.priceMinor * qty, product.currency)}
            </span>
            {business.cashbackPercent > 0 && (
              <span className="vco-cashback-pill" style={{ fontSize:"0.82rem" }}>
                🎁 {business.cashbackPercent}% cashback
              </span>
            )}
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{ width:32,height:32,borderRadius:8,border:"1px solid var(--color-border,rgba(128,128,128,0.3))",background:"none",cursor:"pointer",fontSize:"1rem" }}>−</button>
              <span style={{ fontWeight:600,minWidth:24,textAlign:"center" }}>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)}
                style={{ width:32,height:32,borderRadius:8,border:"1px solid var(--color-border,rgba(128,128,128,0.3))",background:"none",cursor:"pointer",fontSize:"1rem" }}>+</button>
            </div>
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    cart, drawerOpen, openDrawer, closeDrawer,
    addToCart, removeFromCart, updateQty,
    subtotalMinor, cashbackMinor, itemCount,
  } = useCart();

  useEffect(() => {
    setLoading(true);
    getVCommerceProfile(slug)
      .then((d) => {
        setData(d);
        if (d?.profile?.businessName) {
          document.title = `${d.profile.businessName} — VCommerce`;
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
        <Link to="/vcommerce" className="vco-btn vco-btn--primary">Back to VCommerce</Link>
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
