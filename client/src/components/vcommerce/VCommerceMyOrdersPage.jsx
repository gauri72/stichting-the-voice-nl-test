import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconPackage } from "@tabler/icons-react";
import { getMyPurchases } from "./shared/vcommerceApi.js";
import "../../styles/vcommerce.css";
import "../../styles/vcommerce-redesign.css";
import "../../styles/vcommerce-mkt-tokens.css";

const STATUS_TONE = {
  pending: "#d97706",
  processing: "#d97706",
  paid: "#059669",
  fulfilled: "#059669",
  failed: "#dc2626",
  cancelled: "#6b7280",
  expired: "#6b7280",
  refunded: "#6b7280",
};

function formatPrice(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: currency.toUpperCase() }).format((minor || 0) / 100);
}

function OrderRow({ order, t }) {
  const itemSummary = (order.items || []).map((i) => i.productName).filter(Boolean).join(", ");
  return (
    <div style={{ background: "var(--mkt-surface)", border: "1px solid var(--mkt-border)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--mkt-text)", margin: 0 }}>{order.businessName || "—"}</p>
          <p style={{ fontSize: "0.78rem", color: "var(--mkt-text-muted)", margin: "4px 0 0" }}>{itemSummary || t("vcommerceShop:myOrdersPage.itemsFallback")}</p>
          <p style={{ fontSize: "0.72rem", color: "var(--mkt-text-muted)", margin: "4px 0 0" }}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" }) : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--mkt-text)", margin: 0 }}>{formatPrice(order.subtotalMinor, order.currency)}</p>
          <span
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: STATUS_TONE[order.status] || "#6b7280",
              background: `${STATUS_TONE[order.status] || "#6b7280"}1a`,
            }}
          >
            {t(`vcommerceShop:myOrdersPage.status.${order.status}`, order.status)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VCommerceMyOrdersPage() {
  const { t } = useTranslation(["vcommerceShop"]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyPurchases({ page, pageSize })
      .then((data) => {
        if (cancelled) return;
        setOrders(data.items || []);
        setTotal(data.total || 0);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load orders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="vcohp-page vco-mkt" style={{ minHeight: "100vh", background: "var(--mkt-bg)", padding: "28px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: "var(--mkt-text)", fontWeight: 800, fontSize: "1.5rem", marginBottom: 4 }}>{t("vcommerceShop:myOrdersPage.title")}</h1>
          <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.83rem" }}>{t("vcommerceShop:myOrdersPage.orderCount", { count: total })}</p>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>}

        {loading ? (
          <p style={{ color: "var(--mkt-text-muted)" }}>{t("vcommerceShop:myOrdersPage.loading")}</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--mkt-text-muted)" }}>
            <IconPackage size={40} stroke={1.5} style={{ marginBottom: 12, opacity: 0.6 }} />
            <p style={{ fontWeight: 700, color: "var(--mkt-text)", marginBottom: 6 }}>{t("vcommerceShop:myOrdersPage.emptyTitle")}</p>
            <p style={{ fontSize: "0.85rem", marginBottom: 18 }}>{t("vcommerceShop:myOrdersPage.emptyBody")}</p>
            <Link to="/vcommerce" style={{ display: "inline-block", padding: "10px 20px", borderRadius: 10, background: "var(--mkt-cyan)", color: "#04222a", fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}>
              {t("vcommerceShop:myOrdersPage.browseMarketplace")}
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.map((order) => <OrderRow key={order._id} order={order} t={t} />)}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--mkt-border)", background: "transparent", color: "var(--mkt-text)", cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
                >
                  {t("vcommerceShop:myOrdersPage.previous")}
                </button>
                <span style={{ alignSelf: "center", fontSize: "0.82rem", color: "var(--mkt-text-muted)" }}>
                  {t("vcommerceShop:myOrdersPage.pageOf", { page, totalPages })}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--mkt-border)", background: "transparent", color: "var(--mkt-text)", cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  {t("vcommerceShop:myOrdersPage.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
