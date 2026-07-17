import { Link, useSearchParams } from "react-router-dom";
import "../../styles/vcommerce.css";
import "../../styles/vcommerce-redesign.css";
import "../../styles/vcommerce-mkt-tokens.css";

const CATEGORIES = [
  { slug: "food",       label: "Food & Drink",      emoji: "🍽️" },
  { slug: "fashion",    label: "Fashion",            emoji: "👗" },
  { slug: "beauty",     label: "Beauty",             emoji: "✨" },
  { slug: "health",     label: "Health & Wellness",  emoji: "💊" },
  { slug: "yoga",       label: "Yoga",               emoji: "🧘" },
  { slug: "home",       label: "Home & Living",      emoji: "🏠" },
  { slug: "arts",       label: "Arts & Crafts",      emoji: "🎨" },
  { slug: "travel",     label: "Travel & Stay",      emoji: "✈️" },
  { slug: "grocery",    label: "Grocery",            emoji: "🛒" },
  { slug: "cosmetics",  label: "Cosmetics",          emoji: "💄" },
  { slug: "electronics",label: "Electronics",        emoji: "🔌" },
  { slug: "beverages",  label: "Beverages",          emoji: "🥤" },
  { slug: "household",  label: "Household",          emoji: "🧹" },
];

export default function VCommerceCategoriesPage() {
  const [searchParams] = useSearchParams();
  const activeCat = searchParams.get("cat") || "";

  return (
    <div className="vcohp-page vco-mkt" style={{ minHeight: "100vh", background: "var(--mkt-bg)", padding: "28px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: "var(--mkt-text)", fontWeight: 800, fontSize: "1.6rem", marginBottom: 8 }}>Browse Categories</h1>
        <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.85rem", marginBottom: 28 }}>Find businesses by category</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {CATEGORIES.map(({ slug, label, emoji }) => (
            <Link
              className="vcohp-category-card"
              key={slug}
              to={`/vcommerce/businesses?cat=${slug}`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "22px 14px", background: activeCat === slug ? "rgba(0,212,255,0.12)" : "var(--mkt-surface)", border: `1px solid ${activeCat === slug ? "var(--mkt-cyan)" : "var(--mkt-border)"}`, borderRadius: 14, textDecoration: "none", color: "var(--mkt-text)", textAlign: "center" }}
              aria-label={label}
            >
              <span style={{ fontSize: "2rem" }} aria-hidden="true">{emoji}</span>
              <span style={{ fontWeight: 600, fontSize: "0.83rem", lineHeight: 1.3 }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
