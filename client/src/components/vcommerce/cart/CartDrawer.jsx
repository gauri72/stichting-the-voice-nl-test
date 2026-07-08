import { Link } from "react-router-dom";

function formatPrice(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

export default function CartDrawer({ cart, drawerOpen, closeDrawer, removeFromCart, updateQty, subtotalMinor, cashbackMinor }) {
  if (!drawerOpen) return null;

  const items = cart?.items || [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Shopping cart"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 901,
          width: "100%",
          maxWidth: 400,
          background: "var(--color-card-bg,var(--color-surface,#fff))",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--color-border,rgba(128,128,128,0.15))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Your Cart</h2>
            {cart && <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--color-text-muted,#aaa)" }}>{cart.businessName}</p>}
          </div>
          <button type="button" onClick={closeDrawer}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", color: "var(--color-text-muted,#aaa)", lineHeight: 1, padding: 4 }}
            aria-label="Close cart"
          >✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted,#aaa)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🛒</div>
              <p style={{ margin: 0 }}>Your cart is empty</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {items.map((item) => (
                <div key={`${item.productId}-${item.variant}`}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: "var(--color-bg-muted,rgba(128,128,128,0.08))", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📦"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                    {item.variant && <p style={{ margin: "0 0 6px", fontSize: "0.75rem", color: "var(--color-text-muted,#aaa)" }}>{item.variant}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button type="button"
                          onClick={() => updateQty(item.productId, item.variant, item.quantity - 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border,rgba(128,128,128,0.3))", background: "none", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                        <button type="button"
                          onClick={() => updateQty(item.productId, item.variant, item.quantity + 1)}
                          style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--color-border,rgba(128,128,128,0.3))", background: "none", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      </div>
                      <button type="button"
                        onClick={() => removeFromCart(item.productId, item.variant)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted,#aaa)", fontSize: "0.78rem", padding: 0 }}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{formatPrice(item.priceMinor * item.quantity, item.currency)}</p>
                    {item.quantity > 1 && <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--color-text-muted,#aaa)" }}>{formatPrice(item.priceMinor, item.currency)} each</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "16px 20px 24px", borderTop: "1px solid var(--color-border,rgba(128,128,128,0.15))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.9rem" }}>
              <span style={{ color: "var(--color-text-secondary,#666)" }}>Subtotal</span>
              <strong>{formatPrice(subtotalMinor, items[0]?.currency || "eur")}</strong>
            </div>
            {cashbackMinor > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: "0.85rem" }}>
                <span style={{ color: "var(--vco-accent-teal,#14B8A6)" }}>🎁 V.Wallet cashback</span>
                <span style={{ color: "var(--vco-accent-teal,#14B8A6)", fontWeight: 600 }}>+{formatPrice(cashbackMinor, items[0]?.currency || "eur")}</span>
              </div>
            )}
            <Link
              to={`/vcommerce/checkout?business=${cart?.businessId}`}
              onClick={closeDrawer}
              style={{ display: "flex", justifyContent: "center", padding: "14px 20px", background: "var(--color-accent,#8B5CF6)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", transition: "opacity 0.15s" }}
            >
              Checkout — {formatPrice(subtotalMinor, items[0]?.currency || "eur")}
            </Link>
            <button type="button" onClick={closeDrawer}
              style={{ width: "100%", marginTop: 10, padding: "10px", background: "none", border: "1px solid var(--color-border,rgba(128,128,128,0.3))", borderRadius: 10, cursor: "pointer", color: "var(--color-text-secondary,#666)", fontSize: "0.875rem" }}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
