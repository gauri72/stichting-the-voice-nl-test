import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getVCommerceFeatured, getVCommerceList } from "./shared/vcommerceApi.js";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS, CATEGORY_ICONS } from "./shared/BUSINESS_CATEGORIES.js";

function formatPrice(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function BusinessCard({ business }) {
  const icon = CATEGORY_ICONS[business.category] || "✨";
  return (
    <Link to={`/vcommerce/${business.slug}`} className="vco-business-card">
      <div className="vco-business-card__banner">
        {business.bannerUrl
          ? <img src={business.bannerUrl} alt={`${business.businessName} banner`} />
          : <span>{icon}</span>
        }
        <div className="vco-business-card__logo">
          {business.logoUrl
            ? <img src={business.logoUrl} alt={`${business.businessName} logo`} />
            : <span style={{ fontSize: "1.5rem" }}>{icon}</span>
          }
        </div>
      </div>
      <div className="vco-business-card__body">
        <p className="vco-business-card__name">{business.businessName}</p>
        <p className="vco-business-card__tagline">
          {business.tagline || business.description?.slice(0, 80) + "…" || ""}
        </p>
      </div>
      <div className="vco-business-card__footer">
        <span className="vco-badge vco-badge--category">
          {BUSINESS_CATEGORY_LABELS[business.category] || business.category}
        </span>
        <span className="vco-business-card__cta">View shop →</span>
      </div>
    </Link>
  );
}

function SpotlightHero({ featured }) {
  if (!featured) return null;
  const icon = CATEGORY_ICONS[featured.category] || "✨";
  return (
    <section className="vco-spotlight">
      <div className="vco-spotlight__header">
        <span className="vco-spotlight__label">⭐ Business of the Week</span>
      </div>
      <div className="vco-spotlight__card">
        <div className="vco-spotlight__banner">
          {featured.bannerUrl
            ? <img src={featured.bannerUrl} alt={`${featured.businessName} banner`} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            : <span>{icon}</span>
          }
        </div>
        <div className="vco-spotlight__content">
          {featured.logoUrl && (
            <img src={featured.logoUrl} alt="logo" style={{ width:56,height:56,borderRadius:12,objectFit:"cover",marginBottom:12 }} />
          )}
          <span className="vco-badge vco-badge--category">
            {BUSINESS_CATEGORY_LABELS[featured.category] || featured.category}
          </span>
          <h2 className="vco-spotlight__business-name">{featured.businessName}</h2>
          <p className="vco-spotlight__tagline">
            {featured.tagline || featured.description?.slice(0, 120) + "…" || ""}
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <Link to={`/vcommerce/${featured.slug}`} className="vco-btn vco-btn--primary">
              Visit their shop →
            </Link>
            {featured.cashbackPercent > 0 && (
              <span className="vco-cashback-pill">
                🎁 {featured.cashbackPercent}% V.Wallet cashback
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function VCommercePage() {
  const [featured, setFeatured] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page] = useState(1);

  useEffect(() => {
    document.title = "VCommerce — V.O.I.C.E. NL Business Spotlight";
    return () => { document.title = "V.O.I.C.E. NL"; };
  }, []);

  useEffect(() => {
    getVCommerceFeatured().then(setFeatured).catch(() => {});
  }, []);

  const loadBusinesses = useCallback(() => {
    setLoading(true);
    getVCommerceList({ category, search, page })
      .then((data) => setBusinesses(data.businesses || []))
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, [category, search, page]);

  useEffect(() => {
    const t = setTimeout(loadBusinesses, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadBusinesses, search]);

  return (
    <div className="vco-page">
      <section className="vco-hero">
        <div className="vco-hero__inner">
          <p className="vco-hero__eyebrow">V.O.I.C.E. NL Community Marketplace</p>
          <h1 className="vco-hero__title">VCommerce</h1>
          <p className="vco-hero__subtitle">
            Discover and support women-led businesses from the V.O.I.C.E. NL community.
            Shop with confidence — earn V.Wallet cashback on every purchase.
          </p>
          <div className="vco-hero__cta-group">
            <Link to="/vcommerce/apply" className="vco-btn vco-btn--primary">
              List Your Business
            </Link>
            <a href="#businesses" className="vco-btn vco-btn--ghost">
              Explore Shops
            </a>
          </div>
        </div>
      </section>

      <SpotlightHero featured={featured} />

      <section className="vco-listing" id="businesses">
        <div className="vco-listing__header">
          <h2 className="vco-listing__title">All Businesses</h2>
        </div>

        <div className="vco-filter-bar">
          <input
            type="search"
            className="vco-filter-bar__search"
            placeholder="Search businesses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search businesses"
          />
          <button
            type="button"
            className={`vco-filter-bar__pill${!category ? " vco-filter-bar__pill--active" : ""}`}
            onClick={() => setCategory("")}
          >
            All
          </button>
          {BUSINESS_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`vco-filter-bar__pill${category === c ? " vco-filter-bar__pill--active" : ""}`}
              onClick={() => setCategory((prev) => prev === c ? "" : c)}
            >
              {CATEGORY_ICONS[c]} {BUSINESS_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="vco-grid">
          {loading && (
            <div className="vco-loading-dots">
              <span /><span /><span />
            </div>
          )}
          {!loading && businesses.length === 0 && (
            <div className="vco-empty-state">
              <div className="vco-empty-state__icon">🛍️</div>
              <p className="vco-empty-state__title">No businesses found</p>
              <p>
                {search || category
                  ? "Try a different search or category."
                  : "Be the first to list your business!"}
              </p>
              <Link to="/vcommerce/apply" className="vco-btn vco-btn--primary" style={{ marginTop:16 }}>
                Apply Now
              </Link>
            </div>
          )}
          {!loading && businesses.map((b) => (
            <BusinessCard key={b._id} business={b} />
          ))}
        </div>
      </section>

      <section style={{ background:"var(--color-surface,rgba(128,128,128,0.05))", padding:"60px 24px", textAlign:"center" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <h2 style={{ fontSize:"1.5rem", fontWeight:700, marginBottom:12 }}>
            Ready to showcase your business?
          </h2>
          <p style={{ color:"var(--color-text-secondary,#666)", marginBottom:24, lineHeight:1.6 }}>
            Family Membership holders can apply to list their business on VCommerce. Reach the V.O.I.C.E. NL community, sell your products and services, and earn exposure with weekly spotlight features.
          </p>
          <Link to="/vcommerce/apply" className="vco-btn vco-btn--primary">
            Apply for Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
