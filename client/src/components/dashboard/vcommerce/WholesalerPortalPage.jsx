import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWholesaler } from "../../../contexts/WholesalerContext.jsx";
import { getMyWholesalerProfile, postReorderFromPastOrder } from "../../vcommerce/shared/vcommerceApi.js";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/vcommerce-marketplace.css";

const STATUS_CLASS = { pending: "vco-badge--warning", approved: "vco-badge--success", suspended: "vco-badge--error" };

function euro(minor) {
  return `€${(minor / 100).toFixed(2)}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function WholesalerPortalPage() {
  const { t } = useTranslation(["vcommercePortal"]);
  const { status: wsStatus, loaded } = useWholesaler();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [reordering, setReordering] = useState(null);
  const [reorderMsg, setReorderMsg] = useState("");

  const STATUS_LABELS = {
    pending: t("vcommercePortal:wholesalerPortal.status.pending"),
    approved: t("vcommercePortal:wholesalerPortal.status.approved"),
    suspended: t("vcommercePortal:wholesalerPortal.status.suspended"),
  };
  const TABS = [t("vcommercePortal:wholesalerPortal.tabs.overview"), t("vcommercePortal:wholesalerPortal.tabs.orderHistory")];

  useEffect(() => {
    if (wsStatus?.registered) {
      getMyWholesalerProfile().then((d) => setProfile(d.profile)).catch(() => {});
    }
  }, [wsStatus]);

  useEffect(() => {
    if (activeTab === 1) {
      apiFetch(`/api/wholesaler/me/orders?page=${ordersPage}&pageSize=10`, { headers: authHeaders() })
        .then((d) => { setOrders(d.items || []); setOrdersTotal(d.total || 0); })
        .catch(() => {});
    }
  }, [activeTab, ordersPage]);

  async function handleReorder(orderId) {
    setReordering(orderId);
    setReorderMsg("");
    try {
      const data = await postReorderFromPastOrder(orderId);
      // Merge items into vco_cart localStorage
      const cart = { businessId: data.cart.businessId, businessName: data.cart.businessName, cashbackPercent: 5, items: data.cart.items };
      localStorage.setItem("vco_cart", JSON.stringify(cart));
      setReorderMsg(t("vcommercePortal:wholesalerPortal.reorder.success"));
    } catch (e) {
      setReorderMsg(e.message || t("vcommercePortal:wholesalerPortal.reorder.error"));
    } finally {
      setReordering(null);
    }
  }

  if (!loaded) return <div className="vco-loading"><span className="vco-loading__dot" /><span className="vco-loading__dot" /><span className="vco-loading__dot" /></div>;

  if (!wsStatus?.registered) {
    return (
      <div className="vco-page vco-page--center">
        <div className="vco-auth-gate">
          <h2 className="vco-auth-gate__title">{t("vcommercePortal:wholesalerPortal.registrationRequired.title")}</h2>
          <p className="vco-auth-gate__text">{t("vcommercePortal:wholesalerPortal.registrationRequired.text")}</p>
          <Link to="/vcommerce/wholesaler/register" className="vco-btn vco-btn--primary">{t("vcommercePortal:wholesalerPortal.registrationRequired.button")}</Link>
        </div>
      </div>
    );
  }

  if (wsStatus.status === "pending") {
    return (
      <div className="vco-page vco-page--center">
        <div className="vco-auth-gate">
          <div className="mkt-success-card__icon" aria-hidden>⏳</div>
          <h2 className="vco-auth-gate__title">{t("vcommercePortal:wholesalerPortal.pendingReview.title")}</h2>
          <p className="vco-auth-gate__text">
            {t("vcommercePortal:wholesalerPortal.pendingReview.text", { companyName: wsStatus.companyName })}
          </p>
          <Link to="/vcommerce" className="vco-btn vco-btn--primary">{t("vcommercePortal:wholesalerPortal.pendingReview.button")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vco-page">
      <div className="mkt-portal">
        {/* Header card */}
        <div className="mkt-portal__header">
          <div className="mkt-portal__company">
            <div className="mkt-portal__company-icon" aria-hidden>📦</div>
            <div>
              <h1 className="mkt-portal__company-name">{profile?.companyName || wsStatus.companyName}</h1>
              <span className={`vco-badge ${STATUS_CLASS[wsStatus.status] || ""}`}>
                {STATUS_LABELS[wsStatus.status] || wsStatus.status}
              </span>
            </div>
          </div>
          <div className="mkt-portal__header-actions">
            <Link to="/vcommerce" className="vco-btn vco-btn--secondary">{t("vcommercePortal:wholesalerPortal.browseMarketplace")}</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="vco-tabs" role="tablist">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === i}
              className={`vco-tab ${activeTab === i ? "vco-tab--active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 0 && profile && (
          <div className="mkt-portal__overview">
            <div className="mkt-info-card">
              <h3 className="mkt-info-card__title">{t("vcommercePortal:wholesalerPortal.companyDetails.title")}</h3>
              <dl className="mkt-info-card__dl">
                <dt>{t("vcommercePortal:wholesalerPortal.companyDetails.companyName")}</dt><dd>{profile.companyName}</dd>
                <dt>{t("vcommercePortal:wholesalerPortal.companyDetails.type")}</dt><dd>{profile.companyType?.replace(/_/g, " ")}</dd>
                {profile.kvkNumber && <><dt>{t("vcommercePortal:wholesalerPortal.companyDetails.kvk")}</dt><dd>{profile.kvkNumber}</dd></>}
                {profile.vatNumber && <><dt>{t("vcommercePortal:wholesalerPortal.companyDetails.vat")}</dt><dd>{profile.vatNumber}</dd></>}
                <dt>{t("vcommercePortal:wholesalerPortal.companyDetails.status")}</dt><dd><span className={`vco-badge ${STATUS_CLASS[profile.status]}`}>{STATUS_LABELS[profile.status]}</span></dd>
                <dt>{t("vcommercePortal:wholesalerPortal.companyDetails.memberSince")}</dt><dd>{formatDate(profile.createdAt)}</dd>
              </dl>
            </div>
            <div className="mkt-info-card">
              <h3 className="mkt-info-card__title">{t("vcommercePortal:wholesalerPortal.contactAddress.title")}</h3>
              <dl className="mkt-info-card__dl">
                {profile.contactEmail && <><dt>{t("vcommercePortal:wholesalerPortal.contactAddress.email")}</dt><dd>{profile.contactEmail}</dd></>}
                {profile.contactPhone && <><dt>{t("vcommercePortal:wholesalerPortal.contactAddress.phone")}</dt><dd>{profile.contactPhone}</dd></>}
                {profile.website && <><dt>{t("vcommercePortal:wholesalerPortal.contactAddress.website")}</dt><dd><a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a></dd></>}
                {profile.address?.city && <><dt>{t("vcommercePortal:wholesalerPortal.contactAddress.location")}</dt><dd>{[profile.address.street, profile.address.city, profile.address.postcode, profile.address.country].filter(Boolean).join(", ")}</dd></>}
              </dl>
            </div>
          </div>
        )}

        {/* Order History */}
        {activeTab === 1 && (
          <div className="mkt-portal__orders">
            {reorderMsg && <div className="vco-success-banner" role="status">{reorderMsg}</div>}
            {orders.length === 0 ? (
              <div className="vco-empty-state">
                <p>{t("vcommercePortal:wholesalerPortal.orders.empty")}</p>
                <Link to="/vcommerce" className="vco-btn vco-btn--primary">{t("vcommercePortal:wholesalerPortal.browseMarketplace")}</Link>
              </div>
            ) : (
              <div className="mkt-order-table-wrap">
                <table className="mkt-order-table">
                  <thead>
                    <tr>
                      <th>{t("vcommercePortal:wholesalerPortal.orders.table.order")}</th>
                      <th>{t("vcommercePortal:wholesalerPortal.orders.table.seller")}</th>
                      <th>{t("vcommercePortal:wholesalerPortal.orders.table.items")}</th>
                      <th>{t("vcommercePortal:wholesalerPortal.orders.table.total")}</th>
                      <th>{t("vcommercePortal:wholesalerPortal.orders.table.status")}</th>
                      <th>{t("vcommercePortal:wholesalerPortal.orders.table.date")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td className="mkt-order-table__id">#{o._id.slice(-6).toUpperCase()}</td>
                        <td>{o.businessName}</td>
                        <td>{o.items?.length ?? 0}</td>
                        <td>{euro(o.subtotalMinor)}</td>
                        <td><span className={`vco-badge ${o.status === "fulfilled" ? "vco-badge--success" : o.status === "paid" ? "vco-badge--warning" : "vco-badge--secondary"}`}>{o.status}</span></td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>
                          {(o.status === "paid" || o.status === "fulfilled") && (
                            <button
                              className="vco-btn vco-btn--ghost vco-btn--sm"
                              onClick={() => handleReorder(o._id)}
                              disabled={reordering === o._id}
                            >
                              {reordering === o._id ? "…" : t("vcommercePortal:wholesalerPortal.orders.reorderButton")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ordersTotal > 10 && (
                  <div className="mkt-pagination">
                    <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => setOrdersPage((p) => Math.max(1, p - 1))} disabled={ordersPage === 1}>{t("vcommercePortal:wholesalerPortal.pagination.prev")}</button>
                    <span>{t("vcommercePortal:wholesalerPortal.pagination.page", { page: ordersPage })}</span>
                    <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => setOrdersPage((p) => p + 1)} disabled={ordersPage * 10 >= ordersTotal}>{t("vcommercePortal:wholesalerPortal.pagination.next")}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
