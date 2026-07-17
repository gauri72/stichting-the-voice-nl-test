import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IconSearch, IconStar, IconMapPin, IconShieldCheck, IconX } from "@tabler/icons-react";
import { getVCommerceList } from "./shared/vcommerceApi.js";
import { mapBusiness } from "./marketplace/lib/mappers.js";
import { ImageWithFallback, SkeletonBlock, StarRating } from "./marketplace/components/ui.jsx";
import "../../styles/vcommerce.css";
import "../../styles/vcommerce-redesign.css";
import "../../styles/vcommerce-mkt-tokens.css";

const CATEGORIES = [
  { slug: "",          label: "All" },
  { slug: "food",      label: "Food" },
  { slug: "fashion",   label: "Fashion" },
  { slug: "beauty",    label: "Beauty" },
  { slug: "health",    label: "Health" },
  { slug: "yoga",      label: "Yoga" },
  { slug: "home",      label: "Home" },
  { slug: "arts",      label: "Arts" },
  { slug: "travel",    label: "Travel & Stay" },
  { slug: "grocery",   label: "Grocery" },
  { slug: "cosmetics", label: "Cosmetics" },
];

function BusinessCard({ business }) {
  return (
    <Link
      to={`/vcommerce/${business.slug}`}
      className="vcohp-biz-card"
      style={{ background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "var(--mkt-text)", display: "flex", flexDirection: "column" }}
    >
      <div style={{ height: 160, overflow: "hidden" }}>
        <ImageWithFallback
          src={business.imageUrl}
          alt={business.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--mkt-text)" }}>{business.name}</p>
        <p style={{ fontSize: "0.78rem", color: "var(--mkt-text-muted)" }}>{business.categoryLabel}</p>
        {business.location && (
          <p style={{ fontSize: "0.75rem", color: "var(--mkt-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <IconMapPin size={12} aria-hidden="true" /> {business.location}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating rating={business.rating} />
          {business.rating > 0 && <span style={{ fontSize: "0.75rem", color: "var(--mkt-text-muted)" }}>({business.reviewCount})</span>}
        </div>
        {business.cashbackPercent > 0 && (
          <p style={{ fontSize: "0.72rem", color: "var(--mkt-green)", display: "flex", alignItems: "center", gap: 4 }}>
            <IconShieldCheck size={12} aria-hidden="true" /> {business.cashbackPercent}% V.Cashback
          </p>
        )}
      </div>
    </Link>
  );
}

export default function BusinessesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const q = searchParams.get("q") || "";
  const cat = searchParams.get("cat") || "";
  const sort = searchParams.get("sort") || "";

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (q) params.q = q;
    if (cat) params.category = cat;
    if (sort) params.sort = sort;

    getVCommerceList(params)
      .then((data) => {
        // API returns { items, total } — not { businesses }
        const raw = Array.isArray(data?.items) ? data.items : [];
        setBusinesses(raw.map(mapBusiness).filter(Boolean));
        setTotal(data?.total ?? raw.length);
      })
      .catch((err) => setError(err.message || "Could not load businesses."))
      .finally(() => setLoading(false));
  }, [q, cat, sort]);

  useEffect(() => { fetch(); }, [fetch]);

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="vcohp-page vco-mkt" style={{ minHeight: "100vh", background: "var(--mkt-bg)", padding: "24px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ color: "var(--mkt-text)", fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>All Businesses</h1>
          {!loading && <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.83rem" }}>{total} result{total !== 1 ? "s" : ""}</p>}
        </header>

        {/* Search + filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, alignItems: "center" }}>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 10, padding: "8px 12px", flex: "0 0 280px" }}
          >
            <IconSearch size={16} aria-hidden="true" style={{ color: "var(--mkt-text-muted)", flexShrink: 0 }} />
            <input
              type="search"
              value={q}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Search businesses…"
              aria-label="Search businesses"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--mkt-text)", fontSize: "0.85rem" }}
            />
            {q && (
              <button type="button" onClick={() => setFilter("q", "")} aria-label="Clear search" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mkt-text-muted)", display: "flex", padding: 0 }}>
                <IconX size={14} />
              </button>
            )}
          </form>

          <div role="group" aria-label="Filter by category" style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1 }}>
            {CATEGORIES.map(({ slug, label }) => (
              <button
                key={slug}
                type="button"
                onClick={() => setFilter("cat", slug)}
                aria-pressed={cat === slug}
                style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${cat === slug ? "var(--mkt-cyan)" : "var(--mkt-border)"}`, background: cat === slug ? "var(--mkt-cyan)" : "transparent", color: cat === slug ? "#071426" : "var(--mkt-text)", fontWeight: cat === slug ? 700 : 400, fontSize: "0.78rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {[0,1,2,3,4,5].map((i) => <SkeletonBlock key={i} style={{ height: 280, borderRadius: 14 }} />)}
          </div>
        )}

        {!loading && error && (
          <p style={{ color: "var(--mkt-text-muted)", textAlign: "center", padding: "40px 0" }}>{error}</p>
        )}

        {!loading && !error && businesses.length === 0 && (
          <p style={{ color: "var(--mkt-text-muted)", textAlign: "center", padding: "40px 0" }}>
            No businesses found{q ? ` for "${q}"` : ""}{cat ? ` in ${cat}` : ""}.
          </p>
        )}

        {!loading && !error && businesses.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {businesses.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
