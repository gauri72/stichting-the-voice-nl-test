import { Link } from "react-router-dom";
import { IconHeartOff } from "@tabler/icons-react";
import { useFavourites } from "./marketplace/lib/useFavourites.js";
import { ImageWithFallback } from "./marketplace/components/ui.jsx";
import "../../styles/vcommerce.css";
import "../../styles/vcommerce-redesign.css";
import "../../styles/vcommerce-mkt-tokens.css";

function FavouriteItem({ item, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 12, padding: 14 }}>
      <Link to={item.shopUrl || "#"} style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 10, overflow: "hidden", display: "block" }}>
        <ImageWithFallback src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Link>
      <div style={{ flex: 1 }}>
        <Link to={item.shopUrl || "#"} style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--mkt-text)", textDecoration: "none" }}>
          {item.name}
        </Link>
        {item.shopUrl && (
          <p style={{ fontSize: "0.75rem", color: "var(--mkt-cyan)", marginTop: 4 }}>{item.shopUrl.replace("/vcommerce/", "")}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.name} from favourites`}
        style={{ background: "transparent", border: "1px solid var(--mkt-border)", color: "var(--mkt-text-muted)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: "0.75rem" }}
      >
        Remove
      </button>
    </div>
  );
}

export default function VCommerceFavouritesPage() {
  const { favourites, toggleFavourite, clearFavourites } = useFavourites();
  const list = favourites;

  return (
    <div className="vcohp-page vco-mkt" style={{ minHeight: "100vh", background: "var(--mkt-bg)", padding: "28px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ color: "var(--mkt-text)", fontWeight: 800, fontSize: "1.5rem", marginBottom: 4 }}>Favourites</h1>
            <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.83rem" }}>{list.length} saved item{list.length !== 1 ? "s" : ""}</p>
          </div>
          {list.length > 0 && (
            <button
              type="button"
              onClick={clearFavourites}
              style={{ background: "transparent", border: "1px solid var(--mkt-border)", color: "var(--mkt-text-muted)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: "0.78rem" }}
            >
              Clear All
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <IconHeartOff size={48} aria-hidden="true" style={{ color: "var(--mkt-border-strong)", marginBottom: 16 }} />
            <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.9rem", marginBottom: 16 }}>No favourites saved yet.</p>
            <Link
              to="/vcommerce/businesses"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 9, background: "var(--mkt-cyan)", color: "#071426", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}
            >
              Browse Businesses
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((item) => (
              <FavouriteItem key={item.id} item={item} onRemove={toggleFavourite} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
