import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import {
  getMyBusiness,
  getMyProducts,
  postMyProduct,
  patchMyProduct,
  deleteMyProduct,
  getMyOrders,
  markOrderFulfilled,
  getMyPayouts,
  patchMyBusiness,
  uploadBusinessImage,
} from "../../vcommerce/shared/vcommerceApi.js";

const TABS = ["Overview", "Products", "Orders", "Payouts", "Settings"];

function formatPrice(minor, currency = "eur") {
  if (minor == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}

const S = {
  card: { background: "var(--color-card-bg,var(--color-surface,#fff))", borderRadius: 12, border: "1px solid var(--color-border,rgba(128,128,128,0.15))", padding: 20, marginBottom: 16 },
  statCard: { background: "var(--color-card-bg,var(--color-surface,#fff))", borderRadius: 12, border: "1px solid var(--color-border,rgba(128,128,128,0.15))", padding: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--color-border,rgba(128,128,128,0.18))", fontWeight: 600, color: "var(--color-text-muted,#888)", fontSize: "0.78rem", textTransform: "uppercase" },
  td: { padding: "12px", borderBottom: "1px solid var(--color-border,rgba(128,128,128,0.1))", verticalAlign: "middle" },
  badge: (c) => ({ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize: "0.74rem", fontWeight: 600, textTransform: "uppercase", background: c === "green" ? "rgba(16,185,129,0.12)" : c === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)", color: c === "green" ? "#059669" : c === "red" ? "#DC2626" : "#D97706" }),
  btn: (v = "primary") => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: v === "sm" ? "5px 12px" : "9px 18px", background: v === "ghost" || v === "sm" ? "transparent" : "var(--color-accent,#8B5CF6)", color: v === "ghost" || v === "sm" ? "inherit" : "#fff", border: v === "ghost" || v === "sm" ? "1px solid var(--color-border,rgba(128,128,128,0.3))" : "none", borderRadius: 8, fontSize: v === "sm" ? "0.8rem" : "0.875rem", fontWeight: 600, cursor: "pointer" }),
  input: { padding: "9px 12px", border: "1px solid var(--color-border,rgba(128,128,128,0.3))", borderRadius: 8, background: "var(--color-bg,#fff)", color: "inherit", fontSize: "0.9rem", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted,#888)", display: "block", marginBottom: 4 },
};

// ── Overview tab ──
function OverviewTab({ business }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: formatPrice(business.totalRevenueMinor) },
          { label: "Pending Payout", value: formatPrice(business.pendingPayoutMinor) },
          { label: "Total Paid Out", value: formatPrice(business.totalPayoutsMinor) },
          { label: "Total Orders", value: business.totalOrders ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} style={S.statCard}>
            <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted,#888)" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 700 }}>Your Business</h3>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          {business.logoUrl && (
            <img src={business.logoUrl} alt="logo" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
          )}
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "1.05rem" }}>{business.businessName}</p>
            <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--color-text-secondary,#666)" }}>{business.tagline}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ ...(S.badge(business.status === "active" ? "green" : "red")) }}>{business.status}</span>
              {business.isFeaturedThisWeek && <span style={S.badge("green")}>⭐ Featured this week</span>}
              <a href={`/vcommerce/${business.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.8rem", color: "var(--color-accent,#8B5CF6)" }}>
                View public page ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase" }}>Platform Fee</p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{business.platformFeePercent}%</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)" }}>Deducted from each payout</p>
        </div>
        <div style={S.card}>
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted,#888)", textTransform: "uppercase" }}>Customer Cashback</p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>{business.cashbackPercent}%</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted,#aaa)" }}>Credited to V.Wallet after purchase</p>
        </div>
      </div>
    </div>
  );
}

// ── Products tab ──
function ProductsTab({ businessId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | product
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getMyProducts()
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ name: "", type: "service", description: "", priceMinor: "", stockCount: "", deliveryInfo: "", isAvailable: true });
    setEditing("new");
  }

  function openEdit(p) {
    setForm({ name: p.name, type: p.type, description: p.description || "", priceMinor: (p.priceMinor / 100).toFixed(2), stockCount: p.stockCount ?? "", deliveryInfo: p.deliveryInfo || "", isAvailable: p.isAvailable });
    setEditing(p);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      description: form.description,
      priceMinor: Math.round(parseFloat(form.priceMinor) * 100),
      stockCount: form.stockCount === "" ? null : Number(form.stockCount),
      deliveryInfo: form.deliveryInfo,
      isAvailable: form.isAvailable,
    };
    try {
      if (editing === "new") {
        await postMyProduct(payload);
        setMsg("Product added.");
      } else {
        await patchMyProduct(editing._id, payload);
        setMsg("Product updated.");
      }
      setEditing(null);
      load();
    } catch (err) {
      setMsg(err?.message || "Error saving product.");
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteMyProduct(productId);
      setMsg("Product deleted.");
      load();
    } catch (err) {
      setMsg(err?.message || "Error deleting product.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Your Products & Services</h3>
        <button type="button" style={S.btn()} onClick={openNew}>+ Add Product</button>
      </div>

      {msg && <p style={{ padding: "10px 14px", background: "rgba(16,185,129,0.1)", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", color: "#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color: "var(--color-text-muted,#888)", padding: 40, textAlign: "center" }}>Loading…</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--color-card-bg,#fff)", borderRadius: 12, border: "1px dashed var(--color-border,rgba(128,128,128,0.2))" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>📦</div>
          <p style={{ margin: "0 0 16px", color: "var(--color-text-secondary,#666)" }}>No products yet. Add your first one!</p>
          <button type="button" style={S.btn()} onClick={openNew}>Add Product</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Price</th>
                <th style={S.th}>Stock</th>
                <th style={S.th}>Available</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td style={S.td}><strong>{p.name}</strong></td>
                  <td style={S.td}>{p.type}</td>
                  <td style={S.td}>{formatPrice(p.priceMinor, p.currency)}</td>
                  <td style={S.td}>{p.stockCount ?? "∞"}</td>
                  <td style={S.td}><span style={S.badge(p.isAvailable ? "green" : "red")}>{p.isAvailable ? "Yes" : "No"}</span></td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" style={S.btn("sm")} onClick={() => openEdit(p)}>Edit</button>
                      <button type="button" style={{ ...S.btn("sm"), color: "#DC2626", borderColor: "rgba(220,38,38,0.3)" }} onClick={() => handleDelete(p._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product form modal */}
      {editing !== null && (
        <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,maxWidth:500,width:"100%",overflow:"auto",maxHeight:"90vh" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:"1px solid var(--color-border,rgba(128,128,128,0.15))" }}>
              <h3 style={{ margin:0,fontSize:"1rem",fontWeight:700 }}>{editing === "new" ? "Add Product" : "Edit Product"}</h3>
              <button type="button" style={{ background:"none",border:"none",cursor:"pointer",fontSize:"1.2rem",color:"var(--color-text-muted,#888)" }} onClick={() => setEditing(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ padding:24,display:"flex",flexDirection:"column",gap:14 }}>
              <div><label style={S.label}>Name *</label><input style={S.input} type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div>
                <label style={S.label}>Type *</label>
                <select style={S.input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="service">Service</option>
                  <option value="physical">Physical Product</option>
                  <option value="digital">Digital Product</option>
                </select>
              </div>
              <div><label style={S.label}>Description</label><textarea style={{ ...S.input, minHeight:80, resize:"vertical" }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div>
                  <label style={S.label}>Price (€) *</label>
                  <input style={S.input} type="number" min="0" step="0.01" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: e.target.value }))} required />
                </div>
                <div>
                  <label style={S.label}>Stock (blank = unlimited)</label>
                  <input style={S.input} type="number" min="0" value={form.stockCount} onChange={(e) => setForm((f) => ({ ...f, stockCount: e.target.value }))} />
                </div>
              </div>
              <div><label style={S.label}>Delivery Info</label><input style={S.input} type="text" value={form.deliveryInfo} onChange={(e) => setForm((f) => ({ ...f, deliveryInfo: e.target.value }))} placeholder="e.g. Ships within 3-5 days" /></div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <input type="checkbox" id="avail" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} />
                <label htmlFor="avail" style={{ fontSize:"0.9rem" }}>Available for purchase</label>
              </div>
              <div style={{ display:"flex",gap:10,marginTop:8 }}>
                <button type="submit" style={S.btn()}>Save</button>
                <button type="button" style={S.btn("ghost")} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders tab ──
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [fulfilling, setFulfilling] = useState(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getMyOrders(statusFilter ? { status: statusFilter } : {})
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleFulfil(e) {
    e.preventDefault();
    try {
      await markOrderFulfilled(fulfilling._id, note);
      setMsg("Order marked as fulfilled.");
      setFulfilling(null);
      setNote("");
      load();
    } catch (err) {
      setMsg(err?.message || "Error.");
    }
  }

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {["","paid","fulfilled","pending","cancelled"].map((s) => (
          <button key={s} type="button"
            style={{ ...S.btn("ghost"), background: statusFilter===s ? "var(--color-accent,#8B5CF6)" : undefined, color: statusFilter===s ? "#fff" : undefined, border: statusFilter===s ? "none" : undefined }}
            onClick={() => setStatusFilter(s)}>
            {s === "" ? "All" : s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

      {msg && <p style={{ padding:"10px 14px",background:"rgba(16,185,129,0.1)",borderRadius:8,marginBottom:16,fontSize:"0.875rem",color:"#059669" }}>{msg}</p>}

      {loading ? (
        <p style={{ color:"var(--color-text-muted,#888)",padding:40,textAlign:"center" }}>Loading…</p>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Order</th>
                <th style={S.th}>Customer</th>
                <th style={S.th}>Items</th>
                <th style={S.th}>Total</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0
                ? <tr><td colSpan={7} style={{ ...S.td,textAlign:"center",color:"var(--color-text-muted,#888)",padding:40 }}>No orders found.</td></tr>
                : orders.map((o) => (
                  <tr key={o._id}>
                    <td style={S.td}><code style={{ fontSize:"0.78rem" }}>{o._id?.slice(-8)}</code></td>
                    <td style={S.td}>{o.customerName}<br/><span style={{ fontSize:"0.78rem",color:"var(--color-text-muted,#888)" }}>{o.customerEmail}</span></td>
                    <td style={S.td}>{o.items?.length ?? 0} item{o.items?.length !== 1 ? "s" : ""}</td>
                    <td style={S.td}><strong>{formatPrice(o.subtotalMinor, o.currency)}</strong><br/><span style={{ fontSize:"0.75rem",color:"var(--color-text-muted,#aaa)" }}>You receive {formatPrice(o.businessAmountMinor, o.currency)}</span></td>
                    <td style={S.td}><span style={S.badge(o.status==="paid"||o.status==="fulfilled"?"green":o.status==="cancelled"?"red":"yellow")}>{o.status}</span></td>
                    <td style={S.td}>{formatDate(o.createdAt)}</td>
                    <td style={S.td}>
                      {o.status === "paid" && (
                        <button type="button" style={S.btn("sm")} onClick={() => { setFulfilling(o); setNote(""); }}>
                          Mark Fulfilled
                        </button>
                      )}
                      {o.shippingAddress?.line1 && (
                        <div style={{ fontSize:"0.72rem",color:"var(--color-text-muted,#aaa)",marginTop:4 }}>
                          {o.shippingAddress.city}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {fulfilling && (
        <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={(e) => e.target === e.currentTarget && setFulfilling(null)}>
          <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,maxWidth:440,width:"100%",padding:28 }}>
            <h3 style={{ margin:"0 0 8px",fontSize:"1rem",fontWeight:700 }}>Mark Order as Fulfilled</h3>
            <p style={{ margin:"0 0 16px",fontSize:"0.875rem",color:"var(--color-text-secondary,#666)" }}>
              Order #{fulfilling._id?.slice(-8)} · {formatPrice(fulfilling.subtotalMinor, fulfilling.currency)}
            </p>
            <form onSubmit={handleFulfil}>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Note to customer (optional)</label>
                <textarea style={{ ...S.input,minHeight:70,resize:"vertical" }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Shipped via PostNL, tracking: ..." />
              </div>
              <div style={{ display:"flex",gap:10 }}>
                <button type="submit" style={S.btn()}>Confirm</button>
                <button type="button" style={S.btn("ghost")} onClick={() => setFulfilling(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payouts tab ──
function PayoutsTab() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayouts()
      .then((d) => setPayouts(d.payouts || []))
      .catch(() => setPayouts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p style={{ fontSize:"0.875rem",color:"var(--color-text-secondary,#666)",marginBottom:20,padding:"12px 16px",background:"rgba(139,92,246,0.06)",borderRadius:8 }}>
        💡 Payouts are processed manually by V.O.I.C.E. NL via bank transfer. Your pending earnings are released in batches. Make sure your IBAN is up to date in Settings.
      </p>
      {loading ? (
        <p style={{ color:"var(--color-text-muted,#888)",padding:40,textAlign:"center" }}>Loading…</p>
      ) : payouts.length === 0 ? (
        <p style={{ color:"var(--color-text-muted,#888)",textAlign:"center",padding:40 }}>No payouts yet.</p>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Period</th>
                <th style={S.th}>Orders</th>
                <th style={S.th}>Gross</th>
                <th style={S.th}>Platform Fee</th>
                <th style={S.th}>You Receive</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p._id}>
                  <td style={S.td}>{formatDate(p.createdAt)}</td>
                  <td style={S.td}>{p.orderCount}</td>
                  <td style={S.td}>{formatPrice(p.grossMinor, p.currency)}</td>
                  <td style={S.td}>{formatPrice(p.platformFeeMinor, p.currency)}</td>
                  <td style={S.td}><strong>{formatPrice(p.netMinor, p.currency)}</strong></td>
                  <td style={S.td}><span style={S.badge(p.status==="paid"?"green":p.status==="failed"?"red":"yellow")}>{p.status}</span></td>
                  <td style={S.td}><span style={{ fontSize:"0.78rem",color:"var(--color-text-muted,#888)" }}>{p.paymentReference || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Settings tab ──
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageUploadField({ label, currentUrl, field, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");
  const [err, setErr] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const imageData = await readFileAsDataUrl(file);
      setPreview(imageData);
      const { url } = await uploadBusinessImage(field, imageData);
      setPreview(url);
      onUploaded(url);
    } catch (uploadErr) {
      setErr(uploadErr?.message || "Upload failed.");
      setPreview(currentUrl || "");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isLogo = field === "logo";
  const previewStyle = isLogo
    ? { width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid var(--color-border,rgba(128,128,128,0.2))" }
    : { width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border,rgba(128,128,128,0.2))" };

  return (
    <div style={{ marginBottom: 4 }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {preview
          ? <img src={preview} alt={label} style={previewStyle} />
          : <div style={{ ...previewStyle, background: "var(--color-bg-muted,rgba(128,128,128,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isLogo ? "1.5rem" : "1rem", color: "var(--color-text-muted,#aaa)", width: isLogo ? 80 : "100%" }}>
              {isLogo ? "🏪" : "🖼️ No banner"}
            </div>
        }
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFile} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            style={{ ...S.btn("sm"), opacity: uploading ? 0.6 : 1 }}>
            {uploading ? "Uploading…" : preview ? "Change image" : "Upload image"}
          </button>
          {preview && (
            <button type="button" onClick={() => { setPreview(""); onUploaded(""); }}
              style={{ ...S.btn("ghost"), fontSize: "0.75rem", padding: "4px 10px" }}>
              Remove
            </button>
          )}
        </div>
      </div>
      {err && <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "#DC2626" }}>{err}</p>}
    </div>
  );
}

function SettingsTab({ business, onRefresh }) {
  const [form, setForm] = useState({
    tagline: business.tagline || "",
    description: business.description || "",
    contactEmail: business.contactEmail || "",
    contactPhone: business.contactPhone || "",
    website: business.website || "",
    socialLinks: {
      instagram: business.socialLinks?.instagram || "",
      facebook: business.socialLinks?.facebook || "",
      linkedin: business.socialLinks?.linkedin || "",
      tiktok: business.socialLinks?.tiktok || "",
      whatsapp: business.socialLinks?.whatsapp || "",
    },
    payoutBankName: business.payoutBankName || "",
    payoutIBAN: business.payoutIBAN || "",
    payoutBankHolder: business.payoutBankHolder || "",
  });
  const [images, setImages] = useState({ logoUrl: business.logoUrl || "", bannerUrl: business.bannerUrl || "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "success" });

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }
  function setSocialField(key) {
    return (e) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", type: "success" });
    try {
      await patchMyBusiness({ ...form, ...images });
      setMsg({ text: "Profile updated successfully.", type: "success" });
      onRefresh();
    } catch (err) {
      setMsg({ text: err?.message || "Error saving.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const msgColor = msg.type === "error" ? { background: "rgba(239,68,68,0.1)", color: "#DC2626" } : { background: "rgba(16,185,129,0.1)", color: "#059669" };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 560 }}>
      {msg.text && <p style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: "0.875rem", ...msgColor }}>{msg.text}</p>}

      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 700 }}>Brand Images</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ImageUploadField
            label="Logo (square, 1:1)"
            currentUrl={images.logoUrl}
            field="logo"
            onUploaded={(url) => setImages((i) => ({ ...i, logoUrl: url }))}
          />
          <ImageUploadField
            label="Banner (wide, 3:1 recommended)"
            currentUrl={images.bannerUrl}
            field="banner"
            onUploaded={(url) => setImages((i) => ({ ...i, bannerUrl: url }))}
          />
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 700 }}>Public Profile</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={S.label}>Tagline <span style={{ fontWeight: 400, fontSize: "0.75rem" }}>({form.tagline.length}/160)</span></label><input style={S.input} type="text" maxLength={160} value={form.tagline} onChange={setField("tagline")} /></div>
          <div><label style={S.label}>Description</label><textarea style={{ ...S.input, minHeight: 100, resize: "vertical" }} maxLength={3000} value={form.description} onChange={setField("description")} /></div>
          <div><label style={S.label}>Contact Email</label><input style={S.input} type="email" value={form.contactEmail} onChange={setField("contactEmail")} /></div>
          <div><label style={S.label}>Contact Phone</label><input style={S.input} type="tel" value={form.contactPhone} onChange={setField("contactPhone")} /></div>
          <div><label style={S.label}>Website</label><input style={S.input} type="url" value={form.website} onChange={setField("website")} placeholder="https://yourwebsite.com" /></div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Social Links</h3>
        <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "var(--color-text-muted,#888)" }}>Enter full URLs or just usernames (we'll add https:// if needed).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "instagram", label: "Instagram", placeholder: "@yourhandle" },
            { key: "facebook", label: "Facebook", placeholder: "facebook.com/yourpage" },
            { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you" },
            { key: "tiktok", label: "TikTok", placeholder: "@yourtiktok" },
            { key: "whatsapp", label: "WhatsApp", placeholder: "+31 6 12345678" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              <input style={S.input} type="text" value={form.socialLinks[key]} onChange={setSocialField(key)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Bank Details for Payouts</h3>
        <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "var(--color-text-muted,#888)" }}>Required to receive manual SEPA transfers from V.O.I.C.E. NL.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={S.label}>Account Holder Name</label><input style={S.input} type="text" value={form.payoutBankHolder} onChange={setField("payoutBankHolder")} placeholder="Legal name as on bank account" /></div>
          <div><label style={S.label}>IBAN</label><input style={S.input} type="text" value={form.payoutIBAN} onChange={setField("payoutIBAN")} placeholder="NL00 BANK 0000 0000 00" /></div>
          <div><label style={S.label}>Bank Name</label><input style={S.input} type="text" value={form.payoutBankName} onChange={setField("payoutBankName")} placeholder="ING, Rabobank, ABN AMRO…" /></div>
        </div>
      </div>

      <button type="submit" disabled={saving} style={{ ...S.btn(), padding: "11px 24px" }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

// ── Main portal page ──
export default function VCommercePortalPage() {
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadBusiness = useCallback(() => {
    getMyBusiness()
      .then((d) => setBusiness(d.business || null))
      .catch((err) => setError(err?.message || "Could not load your business."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadBusiness(); }, [loadBusiness]);

  if (loading) {
    return (
      <div style={{ padding:"60px 24px",textAlign:"center" }}>
        <div style={{ display:"inline-flex",gap:6 }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"var(--color-accent,#8B5CF6)",opacity:0.4,animation:`pulse 1.2s ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div style={{ maxWidth:560,margin:"0 auto",padding:"60px 24px",textAlign:"center" }}>
        <div style={{ fontSize:"3rem",marginBottom:16 }}>🏪</div>
        <h2 style={{ fontSize:"1.5rem",fontWeight:700,marginBottom:12 }}>No Business Found</h2>
        <p style={{ color:"var(--color-text-secondary,#666)",marginBottom:24 }}>
          {error || "You don't have an approved VCommerce listing yet."}
        </p>
        <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
          <Link to="/vcommerce/apply" className="vco-btn vco-btn--primary">Apply Now</Link>
          <Link to="/dashboard" className="vco-btn vco-btn--ghost">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:900,margin:"0 auto",padding:"clamp(48px,8vw,72px) 24px 60px" }}>
      <div style={{ marginBottom:8 }}>
        <Link to="/dashboard" style={{ fontSize:"0.85rem",color:"var(--color-text-secondary,#666)",textDecoration:"none" }}>
          ← Dashboard
        </Link>
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:12 }}>
        <div>
          <h1 style={{ margin:"0 0 4px",fontSize:"1.4rem",fontWeight:800 }}>My Business</h1>
          <p style={{ margin:0,fontSize:"0.9rem",color:"var(--color-text-secondary,#666)" }}>{business.businessName}</p>
        </div>
        <a href={`/vcommerce/${business.slug}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:"0.85rem",color:"var(--color-accent,#8B5CF6)",textDecoration:"none",display:"flex",alignItems:"center",gap:4 }}>
          View public page ↗
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,borderBottom:"1px solid var(--color-border,rgba(128,128,128,0.15))",marginBottom:28,overflowX:"auto" }}>
        {TABS.map((tab, i) => (
          <button key={tab} type="button" onClick={() => setActiveTab(i)}
            style={{ padding:"10px 18px",background:"none",border:"none",cursor:"pointer",fontWeight:activeTab===i?700:400,color:activeTab===i?"var(--color-accent,#8B5CF6)":"var(--color-text-secondary,#666)",borderBottom:activeTab===i?"2px solid var(--color-accent,#8B5CF6)":"2px solid transparent",fontSize:"0.9rem",whiteSpace:"nowrap",marginBottom:-1 }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <OverviewTab business={business} />}
      {activeTab === 1 && <ProductsTab businessId={business._id} />}
      {activeTab === 2 && <OrdersTab />}
      {activeTab === 3 && <PayoutsTab />}
      {activeTab === 4 && <SettingsTab business={business} onRefresh={loadBusiness} />}
    </div>
  );
}
