import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowRight, IconPackage } from "@tabler/icons-react";
import { getMyOrders } from "../../vcommerce/shared/vcommerceApi.js";
import "../../../styles/dashboard-my-orders.css";

const STATUS_TONE = {
  pending: "amber", processing: "amber",
  paid: "green", fulfilled: "green",
  failed: "red",
  cancelled: "grey", expired: "grey", refunded: "grey",
};

function formatPrice(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: currency.toUpperCase() }).format((minor || 0) / 100);
}

export default function DashboardMyOrdersSection() {
  const { t } = useTranslation(["dashboardSections"]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyOrders({ page: 1, pageSize: 4 })
      .then((data) => { if (!cancelled) setOrders(data.items || []); })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="dash-my-orders" aria-labelledby="dash-my-orders-title">
      <header className="dash-my-orders__intro">
        <div>
          <p>{t("dashboardSections:myOrdersSection.eyebrow")}</p>
          <h2 id="dash-my-orders-title">{t("dashboardSections:myOrdersSection.title")}</h2>
        </div>
        <Link to="/vcommerce/orders">
          {t("dashboardSections:myOrdersSection.viewAll")} <IconArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div className="dash-my-orders__list">
          {[0, 1].map((i) => <div key={i} className="dash-my-orders__skeleton" aria-hidden="true" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="dash-my-orders__empty">
          <IconPackage size={26} stroke={1.5} aria-hidden="true" />
          <p>{t("dashboardSections:myOrdersSection.emptyBody")}</p>
          <Link to="/vcommerce">{t("dashboardSections:myOrdersSection.browseMarketplace")} <IconArrowRight size={15} /></Link>
        </div>
      ) : (
        <div className="dash-my-orders__list">
          {orders.map((order) => {
            const itemCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
            return (
              <div key={order._id} className="dash-my-orders__card">
                <div className="dash-my-orders__card-icon"><IconPackage size={18} /></div>
                <div className="dash-my-orders__card-body">
                  <h4>{order.businessName || "—"}</h4>
                  <p>{t("dashboardSections:myOrdersSection.itemCount", { count: itemCount })}</p>
                </div>
                <div className="dash-my-orders__card-meta">
                  <strong>{formatPrice(order.subtotalMinor, order.currency)}</strong>
                  <span className={`dash-my-orders__badge dash-my-orders__badge--${STATUS_TONE[order.status] || "grey"}`}>
                    {t(`dashboardSections:myOrdersSection.status.${order.status}`, order.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
