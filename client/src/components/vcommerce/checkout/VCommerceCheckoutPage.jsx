import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripePromise } from "../../../utils/stripeClient.js";
import { getStripeElementsAppearance } from "../../../utils/stripePayment.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useCart } from "../cart/useCart.js";
import { postCreateOrder, getOrderStatus } from "../shared/vcommerceApi.js";

function formatPrice(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

// ── Order confirmation screen ──
function OrderConfirmation({ cashbackMinor, currency, orderId, onDone }) {
  return (
    <div style={{ maxWidth:560,margin:"0 auto",padding:"60px 24px",textAlign:"center" }}>
      <div style={{ fontSize:"3.5rem",marginBottom:16 }}>🎉</div>
      <h1 style={{ fontSize:"1.75rem",fontWeight:800,marginBottom:12 }}>Order Placed!</h1>
      <p style={{ color:"var(--color-text-secondary,#666)",lineHeight:1.6,marginBottom:24 }}>
        Your order has been confirmed. The business will be in touch to fulfil it.
      </p>
      {cashbackMinor > 0 && (
        <div style={{ background:"rgba(20,184,166,0.08)",border:"1px solid rgba(20,184,166,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:24,display:"inline-block" }}>
          <p style={{ margin:0,fontWeight:700,color:"var(--vco-accent-teal,#14B8A6)",fontSize:"1.1rem" }}>
            🎁 {formatPrice(cashbackMinor, currency)} added to your V.Wallet
          </p>
          <p style={{ margin:"4px 0 0",fontSize:"0.85rem",color:"var(--color-text-muted,#888)" }}>
            Cashback credited after payment confirmation
          </p>
        </div>
      )}
      <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
        <Link to="/vcommerce" className="vco-btn vco-btn--primary">Back to V.Commerce</Link>
        <Link to="/dashboard" className="vco-btn vco-btn--ghost">My Dashboard</Link>
      </div>
    </div>
  );
}

// ── Stripe payment form ──
function PaymentForm({ clientSecret, orderId, cashbackMinor, currency, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setSubmitting(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/vcommerce/checkout?order=${orderId}&payment_return=1`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message);
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
        // Poll briefly for order to be fulfilled by webhook
        let attempts = 0;
        const poll = async () => {
          attempts++;
          try {
            const { order } = await getOrderStatus(orderId);
            if (order?.status === "paid" || order?.status === "fulfilled") {
              onSuccess();
              return;
            }
          } catch { /* ignore */ }
          if (attempts < 8) setTimeout(poll, 1500);
          else onSuccess(); // show success anyway
        };
        await poll();
      } else {
        setError("Payment could not be completed. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      setError(err?.message || "Payment failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom:20 }}>
        <PaymentElement />
      </div>
      {error && (
        <p style={{ padding:"10px 14px",background:"rgba(239,68,68,0.08)",borderRadius:8,color:"#DC2626",fontSize:"0.875rem",marginBottom:16 }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting || !stripe}
        className="vco-btn vco-btn--primary"
        style={{ width:"100%",padding:"14px",fontSize:"1rem",justifyContent:"center" }}>
        {submitting ? "Processing…" : "Pay Now"}
      </button>
    </form>
  );
}

// ── Main checkout page ──
export default function VCommerceCheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cart, clearCart, subtotalMinor, cashbackMinor } = useCart();

  const businessId = searchParams.get("business") || cart?.businessId;
  const returnOrderId = searchParams.get("order");
  const isPaymentReturn = searchParams.get("payment_return") === "1";

  const [shipping, setShipping] = useState({
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    line1: "", line2: "", city: "", postcode: "", country: "NL",
  });
  const [note, setNote] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(returnOrderId || null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [step, setStep] = useState(isPaymentReturn ? "paying" : "shipping"); // shipping | paying | done

  const stripePromise = useMemo(() => getStripePromise(), []);
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const appearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);

  useEffect(() => {
    document.title = "Checkout — V.Commerce";
    return () => { document.title = "V.O.I.C.E. NL"; };
  }, []);

  // Handle return from bank redirect (iDEAL etc.)
  useEffect(() => {
    if (isPaymentReturn && returnOrderId) {
      setOrderId(returnOrderId);
      setConfirmed(true);
      setStep("done");
      clearCart();
    }
  }, [isPaymentReturn, returnOrderId, clearCart]);

  // Update shipping name when user loads
  useEffect(() => {
    if (user && !shipping.name) {
      setShipping((s) => ({
        ...s,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ display:"flex",justifyContent:"center",padding:80 }}>
        <div className="vco-loading-dots"><span/><span/><span/></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-gate-icon">🔒</div>
          <h1 className="vco-apply-page__title">Sign in to Checkout</h1>
          <p className="vco-apply-page__subtitle">You need to be signed in to complete your purchase.</p>
          <Link to="/my-account?return=/vcommerce/checkout" className="vco-btn vco-btn--primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (confirmed || step === "done") {
    return (
      <div className="vco-page">
        <OrderConfirmation
          cashbackMinor={cashbackMinor}
          currency={cart?.items?.[0]?.currency || "eur"}
          orderId={orderId}
          onDone={() => navigate("/vcommerce")}
        />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="vco-apply-page">
        <div className="vco-apply-page__inner vco-apply-page__gate">
          <div className="vco-gate-icon">🛒</div>
          <h1 className="vco-apply-page__title">Your cart is empty</h1>
          <Link to="/vcommerce" className="vco-btn vco-btn--primary">Browse V.Commerce</Link>
        </div>
      </div>
    );
  }

  async function handleShippingNext(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const result = await postCreateOrder(businessId, {
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variant: i.variant,
        })),
        shippingAddress: shipping,
        customerNote: note,
      });
      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
      setStep("paying");
    } catch (err) {
      setCreateError(err?.message || "Could not start checkout. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const currency = cart.items[0]?.currency || "eur";

  return (
    <div className="vco-page" style={{ minHeight:"100vh",padding:"40px 16px" }}>
      <div style={{ maxWidth:780,margin:"0 auto" }}>
        <Link to={`/vcommerce/${cart.businessSlug || ""}`}
          style={{ fontSize:"0.875rem",color:"var(--color-text-secondary,#666)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,marginBottom:24 }}>
          ← Back to {cart.businessName}
        </Link>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:32,alignItems:"start" }}>
          {/* Left: form */}
          <div>
            <h1 style={{ fontSize:"1.5rem",fontWeight:800,marginBottom:24 }}>
              {step === "shipping" ? "Shipping Details" : "Payment"}
            </h1>

            {step === "shipping" && (
              <form onSubmit={handleShippingNext} style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,border:"1px solid var(--color-border,rgba(128,128,128,0.15))",padding:28 }}>
                <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                  <div className="vco-field">
                    <label className="vco-label" htmlFor="sh-name">Full Name *</label>
                    <input id="sh-name" className="vco-input" type="text" required
                      value={shipping.name} onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Your full name" />
                  </div>
                  <div className="vco-field">
                    <label className="vco-label" htmlFor="sh-line1">Address *</label>
                    <input id="sh-line1" className="vco-input" type="text" required
                      value={shipping.line1} onChange={(e) => setShipping((s) => ({ ...s, line1: e.target.value }))}
                      placeholder="Street and number" />
                  </div>
                  <div className="vco-field">
                    <label className="vco-label" htmlFor="sh-line2">Apt / Suite</label>
                    <input id="sh-line2" className="vco-input" type="text"
                      value={shipping.line2} onChange={(e) => setShipping((s) => ({ ...s, line2: e.target.value }))}
                      placeholder="Optional" />
                  </div>
                  <div className="vco-field-grid">
                    <div className="vco-field">
                      <label className="vco-label" htmlFor="sh-city">City *</label>
                      <input id="sh-city" className="vco-input" type="text" required
                        value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                        placeholder="Amsterdam" />
                    </div>
                    <div className="vco-field">
                      <label className="vco-label" htmlFor="sh-post">Postcode *</label>
                      <input id="sh-post" className="vco-input" type="text" required
                        value={shipping.postcode} onChange={(e) => setShipping((s) => ({ ...s, postcode: e.target.value }))}
                        placeholder="1234 AB" />
                    </div>
                  </div>
                  <div className="vco-field">
                    <label className="vco-label" htmlFor="sh-country">Country</label>
                    <select id="sh-country" className="vco-input vco-input--select"
                      value={shipping.country} onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}>
                      <option value="NL">Netherlands</option>
                      <option value="BE">Belgium</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="GB">United Kingdom</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="vco-field">
                    <label className="vco-label" htmlFor="sh-note">Note to seller (optional)</label>
                    <textarea id="sh-note" className="vco-input vco-input--textarea"
                      value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="Any special instructions…" rows={3} />
                  </div>
                </div>

                {createError && (
                  <p style={{ padding:"10px 14px",background:"rgba(239,68,68,0.08)",borderRadius:8,color:"#DC2626",fontSize:"0.875rem",marginTop:16 }}>
                    {createError}
                  </p>
                )}

                <button type="submit" disabled={creating}
                  className="vco-btn vco-btn--primary"
                  style={{ width:"100%",padding:"14px",fontSize:"1rem",justifyContent:"center",marginTop:24 }}>
                  {creating ? "Setting up payment…" : "Continue to Payment →"}
                </button>
              </form>
            )}

            {step === "paying" && clientSecret && stripePromise && (
              <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,border:"1px solid var(--color-border,rgba(128,128,128,0.15))",padding:28 }}>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    orderId={orderId}
                    cashbackMinor={cashbackMinor}
                    currency={currency}
                    onSuccess={() => { clearCart(); setStep("done"); setConfirmed(true); }}
                  />
                </Elements>
                <button type="button"
                  style={{ marginTop:12,background:"none",border:"none",cursor:"pointer",fontSize:"0.85rem",color:"var(--color-text-muted,#aaa)" }}
                  onClick={() => setStep("shipping")}>
                  ← Edit shipping details
                </button>
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <div style={{ background:"var(--color-card-bg,#fff)",borderRadius:16,border:"1px solid var(--color-border,rgba(128,128,128,0.15))",padding:24,position:"sticky",top:24 }}>
            <h2 style={{ fontSize:"1rem",fontWeight:700,marginBottom:16 }}>Order Summary</h2>
            <p style={{ fontSize:"0.8rem",color:"var(--color-text-muted,#aaa)",marginBottom:12 }}>{cart.businessName}</p>

            <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:20 }}>
              {cart.items.map((item) => (
                <div key={`${item.productId}-${item.variant}`} style={{ display:"flex",gap:10,alignItems:"center" }}>
                  <div style={{ width:40,height:40,borderRadius:6,background:"var(--color-bg-muted,rgba(128,128,128,0.08))",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem" }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : "📦"}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:0,fontSize:"0.85rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</p>
                    {item.variant && <p style={{ margin:0,fontSize:"0.72rem",color:"var(--color-text-muted,#aaa)" }}>{item.variant}</p>}
                  </div>
                  <div style={{ flexShrink:0,textAlign:"right" }}>
                    <p style={{ margin:0,fontSize:"0.85rem",fontWeight:600 }}>× {item.quantity}</p>
                    <p style={{ margin:0,fontSize:"0.78rem",color:"var(--color-text-secondary,#666)" }}>{formatPrice(item.priceMinor * item.quantity, item.currency)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop:"1px solid var(--color-border,rgba(128,128,128,0.12))",paddingTop:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:"0.9rem" }}>
                <span style={{ color:"var(--color-text-secondary,#666)" }}>Subtotal</span>
                <strong>{formatPrice(subtotalMinor, currency)}</strong>
              </div>
              {cashbackMinor > 0 && (
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:"0.85rem" }}>
                  <span style={{ color:"var(--vco-accent-teal,#14B8A6)" }}>🎁 V.Wallet cashback</span>
                  <span style={{ color:"var(--vco-accent-teal,#14B8A6)",fontWeight:600 }}>+{formatPrice(cashbackMinor, currency)}</span>
                </div>
              )}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"1rem",fontWeight:700,marginTop:10 }}>
                <span>Total</span>
                <span>{formatPrice(subtotalMinor, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
