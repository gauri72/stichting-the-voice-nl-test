import { Link } from "react-router-dom";
import { IconBell, IconShoppingCart } from "@tabler/icons-react";
import { useCart } from "../../cart/useCart.js";

/**
 * Slim marketplace sub-toolbar shown on mobile directly below the global Header.
 * Only the cart badge is real data (from useCart); the bell has no backend yet
 * so it links to /dashboard with no fabricated unread count.
 */
export default function MarketplaceMobileToolbar() {
  const { itemCount } = useCart();

  return (
    <div
      className="vcohp-mob__hdr"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 14,
        padding: "10px 16px",
        background: "var(--mkt-surface)",
        borderBottom: "1px solid var(--mkt-border)",
        backdropFilter: "blur(12px)",
      }}
      role="toolbar"
      aria-label="Marketplace utilities"
    >
      <Link
        to="/dashboard"
        aria-label="Notifications"
        style={{ position: "relative", color: "var(--mkt-text)", display: "flex" }}
      >
        <IconBell size={22} aria-hidden="true" />
      </Link>

      <Link
        to="/vcommerce/checkout"
        aria-label={`Shopping cart${itemCount ? `, ${itemCount} item${itemCount > 1 ? "s" : ""}` : ""}`}
        style={{ position: "relative", color: "var(--mkt-text)", display: "flex" }}
      >
        <IconShoppingCart size={22} aria-hidden="true" />
        {itemCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -3,
              right: -5,
              background: "var(--mkt-purple)",
              color: "#fff",
              fontSize: "0.55rem",
              fontWeight: 800,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
            }}
          >
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </Link>
    </div>
  );
}
