import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconSearch, IconX } from "@tabler/icons-react";

const CATEGORY_SHORTCUTS = [
  { slug: "food",       label: "Food",       emoji: "🍽️" },
  { slug: "fashion",    label: "Fashion",    emoji: "👗" },
  { slug: "beauty",     label: "Beauty",     emoji: "💄" },
  { slug: "health",     label: "Health",     emoji: "💊" },
  { slug: "home",       label: "Home",       emoji: "🏠" },
  { slug: "arts",       label: "Arts",       emoji: "🎨" },
  { slug: "travel",     label: "Travel",     emoji: "✈️" },
  { slug: "grocery",    label: "Grocery",    emoji: "🛒" },
];

export default function MarketplaceSearch({ variant = "desktop" }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const isDesktop = variant === "desktop";

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const q = query.trim();
      if (q) navigate(`/vcommerce/businesses?q=${encodeURIComponent(q)}`);
    },
    [query, navigate]
  );

  const handleClear = () => setQuery("");

  return (
    <div className={isDesktop ? "vcohp-desk__search-wrap" : "vcohp-mob__search-wrap"}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search V.Commerce marketplace"
        className={isDesktop ? "vcohp-desk__search-form" : "vcohp-mob__search-form"}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: isDesktop ? 12 : 10, padding: isDesktop ? "10px 14px" : "8px 12px" }}
      >
        <IconSearch size={isDesktop ? 18 : 16} aria-hidden="true" style={{ color: "var(--mkt-text-muted)", flexShrink: 0 }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search businesses, products…"
          aria-label="Search query"
          className={isDesktop ? "vcohp-desk__search-input" : "vcohp-mob__search-input"}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--mkt-text)", fontSize: isDesktop ? "0.9rem" : "0.85rem" }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--mkt-text-muted)", display: "flex", padding: 0 }}
          >
            <IconX size={14} aria-hidden="true" />
          </button>
        )}
      </form>

      <div
        className={isDesktop ? "vcohp-desk__search-cats" : "vcohp-mob__search-cats"}
        role="list"
        aria-label="Browse by category"
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}
      >
        {CATEGORY_SHORTCUTS.map(({ slug, label, emoji }) => (
          <Link
            key={slug}
            to={`/vcommerce/categories?cat=${slug}`}
            role="listitem"
            className={isDesktop ? "vcohp-desk__search-cat" : "vcohp-mob__search-cat"}
            style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, padding: isDesktop ? "6px 12px" : "5px 10px", background: "var(--mkt-border)", borderRadius: 20, fontSize: isDesktop ? "0.78rem" : "0.73rem", color: "var(--mkt-text)", textDecoration: "none", whiteSpace: "nowrap", border: "1px solid var(--mkt-border-md)" }}
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </Link>
        ))}

        <Link
          to="/vcommerce/categories"
          className={isDesktop ? "vcohp-desk__search-cat vcohp-desk__search-cat--all" : "vcohp-mob__search-cat vcohp-mob__search-cat--all"}
          style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, padding: isDesktop ? "6px 12px" : "5px 10px", borderRadius: 20, fontSize: isDesktop ? "0.78rem" : "0.73rem", color: "var(--mkt-cyan)", background: "transparent", border: "1px solid var(--mkt-cyan)", textDecoration: "none", whiteSpace: "nowrap" }}
          aria-label="View all categories"
        >
          All categories →
        </Link>
      </div>
    </div>
  );
}
