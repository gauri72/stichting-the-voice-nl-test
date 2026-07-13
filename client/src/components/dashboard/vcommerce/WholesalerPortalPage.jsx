import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWholesaler } from "../../../contexts/WholesalerContext.jsx";
import { getMyWholesalerProfile, postReorderFromPastOrder } from "../../vcommerce/shared/vcommerceApi.js";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/vcommerce-marketplace.css";

const STATUS_LABELS = { pending: "Pending Review", approved: "Approved", suspended: "Suspended" };
const STATUS_CLASS = { pending: "vco-badge--warning", approved: "vco-badge--success", suspended: "vco-badge--error" };

function euro(minor) {
  return `€${(minor / 100).toFixed(2)}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

const TABS = ["Overview", "Order History"];

export default function WholesalerPortalPage() {
  const { status: wsStatus, loaded } = useWholesaler();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [reordering, setReordering] = useState(null);
  const [reorderMsg, setReorderMsg] = useState("");

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
      setReorderMsg("Cart loaded — go to marketplace to checkout.");
    } catch (e) {
      setReorderMsg(e.message || "Could not load reorder.");
    } finally {
      setReordering(null);
    }
  }

  if (!loaded) return <div className="vco-loading"><span className="vco-loading__dot" /><span className="vco-loading__dot" /><span className="vco-loading__dot" /></div>;

  if (!wsStatus?.registered) {
    return (
      <div className="vco-page vco-page--center">
        <div className="vco-auth-gate">
          <h2 className="vco-auth-gate__title">Wholesaler Account Required</h2>
          <p className="vco-auth-gate__text">Register as a wholesaler to access bulk pricing and the wholesaler portal.</p>
          <Link to="/vcommerce/wholesaler/register" className="vco-btn vco-btn--primary">Register as Wholesaler</Link>
        </div>
      </div>
    );
  }

  if (wsStatus.status === "pending") {
    return (
      <div className="vco-page vco-page--center">
        <div className="vco-auth-gate">
          <div className="mkt-success-card__icon" aria-hidden>⏳</div>
          <h2 className="vco-auth-gate__title">Application Under Review</h2>
          <p className="vco-auth-gate__text">
            Your wholesaler application for <strong>{wsStatus.companyName}</strong> is being reviewed.
            You will receive an email when it is approved.
          </p>
          <Link to="/vcommerce" className="vco-btn vco-btn--primary">Browse Marketplace</Link>
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
            <Link to="/vcommerce" className="vco-btn vco-btn--secondary">Browse Marketplace</Link>
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
              <h3 className="mkt-info-card__title">Company Details</h3>
              <dl className="mkt-info-card__dl">
                <dt>Company Name</dt><dd>{profile.companyName}</dd>
                <dt>Type</dt><dd>{profile.companyType?.replace(/_/g, " ")}</dd>
                {profile.kvkNumber && <><dt>KvK / Registration</dt><dd>{profile.kvkNumber}</dd></>}
                {profile.vatNumber && <><dt>VAT Number</dt><dd>{profile.vatNumber}</dd></>}
                <dt>Status</dt><dd><span className={`vco-badge ${STATUS_CLASS[profile.status]}`}>{STATUS_LABELS[profile.status]}</span></dd>
                <dt>Member Since</dt><dd>{formatDate(profile.createdAt)}</dd>
              </dl>
            </div>
            <div className="mkt-info-card">
              <h3 className="mkt-info-card__title">Contact &amp; Address</h3>
              <dl className="mkt-info-card__dl">
                {profile.contactEmail && <><dt>Email</dt><dd>{profile.contactEmail}</dd></>}
                {profile.contactPhone && <><dt>Phone</dt><dd>{profile.contactPhone}</dd></>}
                {profile.website && <><dt>Website</dt><dd><a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a></dd></>}
                {profile.address?.city && <><dt>Location</dt><dd>{[profile.address.street, profile.address.city, profile.address.postcode, profile.address.country].filter(Boolean).join(", ")}</dd></>}
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
                <p>No orders yet.</p>
                <Link to="/vcommerce" className="vco-btn vco-btn--primary">Browse Marketplace</Link>
              </div>
            ) : (
              <div className="mkt-order-table-wrap">
                <table className="mkt-order-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Seller</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
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
                              {reordering === o._id ? "…" : "Reorder"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ordersTotal > 10 && (
                  <div className="mkt-pagination">
                    <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => setOrdersPage((p) => Math.max(1, p - 1))} disabled={ordersPage === 1}>← Prev</button>
                    <span>Page {ordersPage}</span>
                    <button className="vco-btn vco-btn--ghost vco-btn--sm" onClick={() => setOrdersPage((p) => p + 1)} disabled={ordersPage * 10 >= ordersTotal}>Next →</button>
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
