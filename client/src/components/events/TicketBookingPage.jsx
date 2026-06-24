import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { IconCalendar, IconMapPin, IconTicket, IconCheck } from "@tabler/icons-react";
import StripeCheckoutForm from "../payments/StripeCheckoutForm.jsx";
import MembershipBenefitBanner from "./MembershipBenefitBanner.jsx";
import MembershipPlanCards from "./MembershipPlanCards.jsx";
import BookingPricePreview from "./BookingPricePreview.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { apiFetch, authHeaders } from "../../utils/api.js";
import { getStripePromise, STRIPE_PUBLISHABLE_KEY } from "../../utils/stripeClient.js";
import {
  clearCheckoutSession,
  completePaymentReturn,
  getStripeElementsAppearance,
  isPaymentReturnUrl,
  persistCheckoutSession,
  readCheckoutSession,
} from "../../utils/stripePayment.js";
import { CUSTOMER_MEMBERSHIP_MESSAGES, sanitizeCustomerDiscountLabel } from "../../utils/membershipDisplayLabels.js";
import SeatMapSelector from "./SeatMapSelector.jsx";
import DynamicCheckoutForm, { serializeCheckoutAnswers } from "./DynamicCheckoutForm.jsx";
import useBookingFlow from "../../hooks/useBookingFlow.js";
import "../../styles/sponsorship-payment-block.css";
import "../../styles/seat-map.css";

const TICKET_CHECKOUT_SESSION_KEY = "voice_nl_ticket_checkout";

const EMPTY_ATTENDEE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const STEPS = [
  "Select tickets",
  "Your details",
  "Member benefits",
  "Membership",
  "Review",
  "Payment",
];

export default function TicketBookingPage() {
  const { eventIdOrSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const stripeAppearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);

  const [event, setEvent] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [attendee, setAttendee] = useState(EMPTY_ATTENDEE);
  const [voucherCode, setVoucherCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [handlingReturn, setHandlingReturn] = useState(() => isPaymentReturnUrl());
  const checkoutInitRef = useRef(false);

  const [sessionId, setSessionId] = useState("");
  const [memberDetection, setMemberDetection] = useState(null);
  const [detectionMessages, setDetectionMessages] = useState(null);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [includeMembership, setIncludeMembership] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [purchaseType, setPurchaseType] = useState("NEW");
  const [applyMemberBenefit, setApplyMemberBenefit] = useState(true);
  const [detectingMember, setDetectingMember] = useState(false);
  const [membershipCode, setMembershipCode] = useState("");
  const [membershipCodeMessage, setMembershipCodeMessage] = useState("");
  const [membershipCodeApplied, setMembershipCodeApplied] = useState(false);
  const [reservedSeatingEnabled, setReservedSeatingEnabled] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [selectedSeatsDetail, setSelectedSeatsDetail] = useState([]);
  const [checkoutFormFields, setCheckoutFormFields] = useState([]);
  const [checkoutFormValues, setCheckoutFormValues] = useState({});
  const sessionRestoreRef = useRef(false);

  const checkoutSessionIdFromUrl = searchParams.get("checkoutSessionId") || "";
  const returnPath = checkoutSessionIdFromUrl
    ? `/events/${eventIdOrSlug}/tickets?checkoutSessionId=${checkoutSessionIdFromUrl}`
    : `/events/${eventIdOrSlug}/tickets`;
  const payer = useMemo(
    () => ({
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      name: `${attendee.firstName} ${attendee.lastName}`.trim(),
      email: attendee.email,
      phone: attendee.phone,
    }),
    [attendee]
  );

  const amountLabel = preview?.combined?.grandTotal || "€0.00";

  const isFreeCheckout = (preview?.combined?.grandTotalMinor ?? 1) <= 0;

  const selectedItems = (event?.ticketTypes || [])
    .filter((tt) => (quantities[tt.id] || 0) > 0)
    .map((tt) => ({ ticketTypeId: tt.id, quantity: quantities[tt.id] }));

  const checkoutSettings = event?.checkoutSettings || {};
  const showMembershipStep =
    checkoutSettings.enableMembershipUpsell !== false &&
    checkoutSettings.allowMembershipTicketBundle !== false;

  const seatOffset = reservedSeatingEnabled ? 1 : 0;
  const ticketQty = selectedItems.reduce((sum, li) => sum + li.quantity, 0);
  const checkoutFormAnswers = useMemo(
    () => serializeCheckoutAnswers(checkoutFormFields, checkoutFormValues),
    [checkoutFormFields, checkoutFormValues]
  );
  const knownCheckoutAnswers = useMemo(
    () => ({
      first_name: attendee.firstName,
      last_name: attendee.lastName,
      email: attendee.email,
      phone: attendee.phone,
      full_name: `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim(),
    }),
    [attendee]
  );

  const booking = useBookingFlow({
    flowType: "event_ticket",
    eventId: event?.id || null,
    items: selectedItems,
    attendee,
    email: attendee.email,
    reservedSeatingEnabled,
    enabled: Boolean(event?.id && selectedItems.length),
    sessionId,
  });
  const {
    fetchPreview,
    detectMembership,
    saveBeforeLogin: saveBeforeLoginApi,
    restoreSession: restoreSessionApi,
    applyBenefitsAfterLogin,
    resolveForms,
    populateFormValues,
    validateMembershipCode,
    validateDiscountCode,
    checkout: checkoutBookingFlow,
    confirm: confirmBookingFlow,
    validateForms,
  } = booking;
  const DETAILS_STEP = 2 + seatOffset;
  const BENEFITS_STEP = 3 + seatOffset;
  const MEMBERSHIP_STEP = 4 + seatOffset;
  const REVIEW_STEP = (showMembershipStep ? 5 : 4) + seatOffset;
  const PAYMENT_STEP = REVIEW_STEP + 1;

  useEffect(() => {
    if (user) {
      setAttendee({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [eventData, sessionData] = await Promise.all([
          apiFetch(`/api/events/${eventIdOrSlug}`),
          apiFetch("/api/booking/event_ticket/start", { method: "POST", headers: authHeaders(), body: JSON.stringify({}) }),
        ]);
        if (!cancelled) {
          setEvent(eventData.event);
          setSessionId(sessionData.sessionId);
          const initial = {};
          (eventData.event.ticketTypes || []).forEach((tt) => {
            initial[tt.id] = 0;
          });
          setQuantities(initial);

          if (eventData.event?.id) {
            try {
              const [plansData, seatData] = await Promise.all([
                apiFetch(`/api/booking/membership-plans/${eventData.event.id}`, { headers: authHeaders() }),
                apiFetch(`/api/events/${eventData.event.id}/seat-map?checkoutSessionId=${sessionData.sessionId}`).catch(() => ({ reservedSeatingEnabled: false })),
              ]);
              if (!cancelled) {
                setMembershipPlans(plansData.plans || []);
                setReservedSeatingEnabled(Boolean(seatData.reservedSeatingEnabled));
              }
            } catch {
              /* plans optional */
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Event not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [eventIdOrSlug]);

  const refreshPreview = useCallback(async (overrides = {}) => {
    if (!selectedItems.length || !event?.id) {
      setPreview(null);
      return;
    }
    try {
      const data = await fetchPreview({
          includeMembership: overrides.includeMembership ?? includeMembership,
          selectedPlanId: overrides.selectedPlanId ?? selectedPlanId,
          purchaseType: overrides.purchaseType ?? purchaseType,
          discountCode: voucherCode || undefined,
          applyMemberBenefit: overrides.applyMemberBenefit ?? applyMemberBenefit,
          membershipCode: membershipCode || undefined,
        });
      setPreview(data.preview);
      setError("");
    } catch (err) {
      setError(err.message || "Could not calculate total.");
    }
  }, [
    event?.id,
    selectedItems,
    attendee.email,
    includeMembership,
    selectedPlanId,
    purchaseType,
    voucherCode,
    applyMemberBenefit,
    sessionId,
    membershipCode,
    fetchPreview,
  ]);

  const detectMember = useCallback(async (email, codeOverride = null) => {
    if (!email?.trim() && !codeOverride) return;
    setDetectingMember(true);
    try {
      const data = await detectMembership(codeOverride ?? (membershipCode || ""));
      setMemberDetection(data);
      setDetectionMessages(data.messages);

      if (
        data.status === "GUEST_EMAIL_EXPIRED_MEMBER" ||
        data.status === "LOGGED_IN_EXPIRED_MEMBER"
      ) {
        setPurchaseType("RENEWAL");
        if (data.membership?.planId) setSelectedPlanId(data.membership.planId);
      }
    } catch (err) {
      console.warn("Member detection failed:", err.message);
    } finally {
      setDetectingMember(false);
    }
  }, [membershipCode, detectMembership]);

  const saveCheckoutBeforeLogin = useCallback(async () => {
    if (!event?.id) return { returnPath };
    const data = await saveBeforeLoginApi({
        eventSlug: event.slug || eventIdOrSlug,
        email: attendee.email,
        items: selectedItems,
        attendeeDetails: attendee,
        discountCode: voucherCode || "",
        membershipCode: membershipCode || "",
        memberDetection,
        returnStep: step,
        includeMembership,
        selectedPlanId,
        purchaseType,
        applyMemberBenefit: true,
      });
    if (data.sessionId) setSessionId(data.sessionId);
    return data;
  }, [
    event,
    eventIdOrSlug,
    sessionId,
    attendee,
    selectedItems,
    voucherCode,
    membershipCode,
    memberDetection,
    step,
    includeMembership,
    selectedPlanId,
    purchaseType,
    returnPath,
    saveBeforeLoginApi,
  ]);

  const restoreCheckoutFromSession = useCallback(async (checkoutSessionId) => {
    const data = await restoreSessionApi(checkoutSessionId);
    const restored = data.session;
    if (!restored) return;

    if (restored.attendeeDetails) {
      setAttendee({
        firstName: restored.attendeeDetails.firstName || "",
        lastName: restored.attendeeDetails.lastName || "",
        email: restored.attendeeDetails.email || "",
        phone: restored.attendeeDetails.phone || "",
      });
    }
    if (restored.discountCode) setVoucherCode(restored.discountCode);
    if (restored.membershipCode) {
      setMembershipCode(restored.membershipCode);
      setMembershipCodeApplied(true);
    }
    if (restored.includeMembership) setIncludeMembership(true);
    if (restored.selectedPlanId) setSelectedPlanId(restored.selectedPlanId);
    if (restored.purchaseType) setPurchaseType(restored.purchaseType);
    setApplyMemberBenefit(restored.applyMemberBenefit !== false);
    setSessionId(restored.sessionId);
    if (restored.items?.length && event?.ticketTypes) {
      const next = {};
      event.ticketTypes.forEach((tt) => { next[tt.id] = 0; });
      restored.items.forEach((item) => {
        next[item.ticketTypeId] = item.quantity;
      });
      setQuantities(next);
    }
    if (restored.memberDetection) {
      setMemberDetection(restored.memberDetection);
    }
    setStep(restored.returnStep || 3);
  }, [event?.ticketTypes, restoreSessionApi]);

  useEffect(() => {
    if (!checkoutSessionIdFromUrl || !event?.id || sessionRestoreRef.current) return;
    sessionRestoreRef.current = true;

    async function restore() {
      try {
        await restoreCheckoutFromSession(checkoutSessionIdFromUrl);
        if (user) {
          const result = await applyBenefitsAfterLogin({
              sessionId: checkoutSessionIdFromUrl,
              email: user.email,
            });
          if (result.detection) {
            setMemberDetection(result.detection);
            setDetectionMessages(result.messages);
            setApplyMemberBenefit(true);
          }
          if (result.preview) setPreview(result.preview);
        }
      } catch (err) {
        console.warn("Could not restore checkout session:", err.message);
      }
    }

    restore();
  }, [checkoutSessionIdFromUrl, event?.id, user, restoreCheckoutFromSession, applyBenefitsAfterLogin]);

  useEffect(() => {
    const shouldAutoDetect = step === DETAILS_STEP || step === BENEFITS_STEP;
    if (shouldAutoDetect && attendee.email?.includes("@")) {
      detectMember(attendee.email);
    }
  }, [step, attendee.email, DETAILS_STEP, BENEFITS_STEP, detectMember]);

  useEffect(() => {
    if (step >= 4 && selectedItems.length) {
      const timer = window.setTimeout(refreshPreview, 300);
      return () => window.clearTimeout(timer);
    }
  }, [step, refreshPreview, selectedItems.length, includeMembership, selectedPlanId, applyMemberBenefit]);

  useEffect(() => {
    if (!event?.id || !selectedItems.length) {
      setCheckoutFormFields([]);
      setCheckoutFormValues({});
      return;
    }
    let cancelled = false;
    async function resolveForm() {
      try {
        const data = await resolveForms({
            eventType: event.category || "",
            participantCount: ticketQty,
          });
        if (!cancelled) {
          setCheckoutFormFields(data.fields || []);
          setCheckoutFormValues((prev) =>
            populateFormValues(data.fields || [], prev)
          );
        }
      } catch {
        if (!cancelled) setCheckoutFormFields([]);
      }
    }
    resolveForm();
    return () => {
      cancelled = true;
    };
  }, [event?.id, event?.category, selectedItems, ticketQty, attendee.firstName, attendee.lastName, attendee.email, attendee.phone, resolveForms, populateFormValues]);

  const goToConfirmation = useCallback(
    (orderNumber, email = "") => {
      clearCheckoutSession(TICKET_CHECKOUT_SESSION_KEY);
      const normalizedEmail = String(email || "").trim();
      const query = normalizedEmail ? `?email=${encodeURIComponent(normalizedEmail)}` : "";
      navigate(`/events/${eventIdOrSlug}/tickets/confirmation/${orderNumber}${query}`);
    },
    [eventIdOrSlug, navigate]
  );

  const resolveOrderId = useCallback((paymentIntent) => {
    const saved = readCheckoutSession(TICKET_CHECKOUT_SESSION_KEY);
    return saved?.orderId || paymentIntent?.metadata?.order_id || null;
  }, []);

  const finalizeTicketPayment = useCallback(
    async (paymentIntent) => {
      const orderId = resolveOrderId(paymentIntent);
      try {
        if (orderId) {
          const confirmed = await apiFetch(`/api/events/orders/${orderId}/confirm`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          });
          goToConfirmation(confirmed.order.orderNumber, attendee.email);
          return;
        }

        const confirmed = await apiFetch("/api/events/orders/confirm-intent", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        goToConfirmation(confirmed.order.orderNumber, attendee.email);
      } catch (err) {
        setError(err.message || "Could not confirm your booking.");
      }
    },
    [attendee.email, goToConfirmation, resolveOrderId]
  );

  useEffect(() => {
    const promise = getStripePromise();
    if (!promise || !isPaymentReturnUrl()) return;

    promise.then(async (stripe) => {
      if (!stripe) return;
      setHandlingReturn(true);
      await completePaymentReturn(stripe, {
        onSuccess: finalizeTicketPayment,
        onError: (msg) => {
          setError(msg);
          setStep(PAYMENT_STEP);
        },
      });
      setHandlingReturn(false);
    });
  }, [finalizeTicketPayment]);

  async function applyMembershipCode() {
    if (!membershipCode.trim()) return;
    setMembershipCodeMessage("");
    setDetectingMember(true);
    try {
      const data = await validateMembershipCode(membershipCode.trim());
      if (data.valid) {
        setMembershipCodeApplied(true);
        const typeLabel = data.detection?.membershipType || "Membership";
        const until = data.detection?.memberUntil ? ` · Valid until ${data.detection.memberUntil}` : "";
        setMembershipCodeMessage(
          data.message
            ? `${data.message} — ${typeLabel}${until}`
            : `${CUSTOMER_MEMBERSHIP_MESSAGES.verified} — ${typeLabel}${until}`
        );
        setApplyMemberBenefit(true);
        if (attendee.email) await detectMember(attendee.email, membershipCode.trim());
        refreshPreview({ applyMemberBenefit: true });
      } else {
        setMembershipCodeApplied(false);
        setMembershipCodeMessage(data.message || "This membership code is invalid or expired.");
      }
    } catch (err) {
      setMembershipCodeApplied(false);
      setMembershipCodeMessage(err.message || "This membership code is invalid or expired.");
    } finally {
      setDetectingMember(false);
    }
  }

  async function applyVoucher() {
    if (!voucherCode.trim()) return;
    setVoucherMessage("");
    try {
      await validateDiscountCode(voucherCode, {
          orderType: "tickets",
          subtotalMinor: preview?.ticketPricing?.subtotalMinor || 0,
        });
      setVoucherMessage("Discount code applied successfully.");
      refreshPreview();
    } catch (err) {
      setVoucherMessage(err.message || "Invalid discount code.");
    }
  }

  async function initCheckout() {
    const totalMinor = preview?.combined?.grandTotalMinor ?? 1;
    if (!STRIPE_PUBLISHABLE_KEY && totalMinor > 0) {
      setError(
        "Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to client/.env and STRIPE_SECRET_KEY to server/.env."
      );
      return;
    }

    setCheckoutLoading(true);
    setError("");
    setClientSecret("");
    setCheckoutOrder(null);

    try {
      const checkout = await checkoutBookingFlow({
          attendeeFirstName: attendee.firstName,
          attendeeLastName: attendee.lastName,
          attendeeEmail: attendee.email,
          attendeePhone: attendee.phone,
          voucherCode: voucherCode || undefined,
          discountCode: voucherCode || undefined,
          termsAccepted,
          includeMembership,
          selectedPlanId: includeMembership ? selectedPlanId : undefined,
          purchaseType: includeMembership ? purchaseType : undefined,
          applyMemberBenefit,
          membershipCode: membershipCode || undefined,
          selectedSeatIds,
          checkoutFormAnswers,
          participantCount: ticketQty,
        });

      setCheckoutOrder(checkout.order);

      persistCheckoutSession(TICKET_CHECKOUT_SESSION_KEY, {
        orderId: checkout.order.id,
        orderNumber: checkout.order.orderNumber,
        paymentIntentId: checkout.payment?.paymentIntentId || null,
        eventIdOrSlug,
        payer,
      });

      if (checkout.payment?.mode === "free" || checkout.order.totalAmountMinor === 0) {
        return;
      }

      if (checkout.payment?.mode === "stripe" && checkout.payment?.clientSecret) {
        setClientSecret(checkout.payment.clientSecret);
        return;
      }

      throw new Error(checkout.payment?.message || "Could not start secure checkout.");
    } catch (err) {
      setError(err.message || "Could not start checkout.");
      checkoutInitRef.current = false;
      setStep(REVIEW_STEP);
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function completeFreeBooking() {
    setDetectingMember(false);
    setCheckoutLoading(true);
    setError("");
    try {
      const result = await confirmBookingFlow({
          skipPayment: true,
          isFreeOrder: true,
          attendeeFirstName: attendee.firstName,
          attendeeLastName: attendee.lastName,
          attendeeEmail: attendee.email,
          attendeePhone: attendee.phone,
          voucherCode: voucherCode || undefined,
          discountCode: voucherCode || undefined,
          termsAccepted,
          includeMembership,
          selectedPlanId: includeMembership ? selectedPlanId : undefined,
          purchaseType: includeMembership ? purchaseType : undefined,
          applyMemberBenefit,
          membershipCode: membershipCode || undefined,
          selectedSeatIds,
          checkoutFormAnswers,
          participantCount: ticketQty,
        });
      clearCheckoutSession(TICKET_CHECKOUT_SESSION_KEY);
      goToConfirmation(result.order.orderNumber, attendee.email);
    } catch (err) {
      setError(err.message || "We could not complete your free booking. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function goToPaymentStep() {
    if (!attendee.email?.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    void proceedToPayment();
  }

  async function proceedToPayment() {
    setError("");
    setDetectingMember(true);

    let detection = memberDetection;
    try {
      detection = await detectMembership(membershipCode || "");
      setMemberDetection(detection);
      setDetectionMessages(detection.messages);
    } catch (err) {
      console.warn("Member detection failed:", err.message);
    } finally {
      setDetectingMember(false);
    }

    const status = detection?.status;
    const isActiveGuest = status === "GUEST_EMAIL_ACTIVE_MEMBER";
    const isExpiredGuest =
      status === "GUEST_EMAIL_EXPIRED_MEMBER" && applyMemberBenefit && !includeMembership;

    try {
      await validateForms({
          eventId: event.id,
          eventType: event.category || "",
          ticketTypeIds: selectedItems.map((i) => i.ticketTypeId),
          items: selectedItems,
          ticketQuantity: ticketQty,
          participantCount: ticketQty,
          answers: checkoutFormAnswers,
          knownAnswers: knownCheckoutAnswers,
        });
    } catch (err) {
      setError(err.message || "Please complete required checkout questions.");
      setStep(REVIEW_STEP);
      return;
    }

    if (isActiveGuest && applyMemberBenefit) {
      setError("Please log in to apply member benefits, or choose Continue Without Benefits.");
      setStep(BENEFITS_STEP);
      return;
    }

    if (isExpiredGuest) {
      setError("Renew your membership to apply benefits, or choose Tickets Only.");
      setStep(BENEFITS_STEP);
      return;
    }

    checkoutInitRef.current = false;
    setClientSecret("");
    setCheckoutOrder(null);
    setStep(PAYMENT_STEP);
  }

  useEffect(() => {
    if (isFreeCheckout || step !== PAYMENT_STEP || clientSecret || checkoutLoading || handlingReturn || checkoutOrder) return;
    if (checkoutInitRef.current) return;
    checkoutInitRef.current = true;
    initCheckout();
  }, [step, clientSecret, checkoutLoading, handlingReturn, checkoutOrder, isFreeCheckout]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStripeSuccess(paymentIntent) {
    const orderId = checkoutOrder?.id || resolveOrderId(paymentIntent);
    if (!orderId && !paymentIntent?.id) {
      setError("Order reference missing. Please contact support.");
      return;
    }
    try {
      await finalizeTicketPayment(paymentIntent);
    } catch (err) {
      setError(err.message || "Payment succeeded but booking confirmation failed.");
    }
  }

  function handleAddMembership() {
    setIncludeMembership(true);
    if (!selectedPlanId && membershipPlans[0]) {
      setSelectedPlanId(membershipPlans[0].id);
    }
    if (
      memberDetection?.status === "GUEST_EMAIL_EXPIRED_MEMBER" ||
      memberDetection?.status === "LOGGED_IN_EXPIRED_MEMBER"
    ) {
      setPurchaseType("RENEWAL");
    }
    setStep(MEMBERSHIP_STEP);
  }

  function handleTicketsOnly() {
    setIncludeMembership(false);
    setSelectedPlanId(null);
    setApplyMemberBenefit(false);
    setStep(REVIEW_STEP);
  }

  function handleContinueWithoutDiscount() {
    setApplyMemberBenefit(false);
    setError("");
    refreshPreview({ applyMemberBenefit: false });
  }

  function nextFromDetails() {
    if (!attendee.firstName || !attendee.lastName || !attendee.email) return;
    setStep(BENEFITS_STEP);
  }

  function nextFromBenefits() {
    if (
      memberDetection?.status === "GUEST_EMAIL_ACTIVE_MEMBER" &&
      applyMemberBenefit
    ) {
      setError("Please log in to apply member benefits, or choose Continue Without Benefits.");
      return;
    }
    if (includeMembership || showMembershipStep) {
      setStep(MEMBERSHIP_STEP);
    } else {
      setStep(REVIEW_STEP);
    }
  }

  function nextFromMembership() {
    if (includeMembership && !selectedPlanId) {
      setError("Please select a membership plan.");
      return;
    }
    setError("");
    refreshPreview();
    setStep(REVIEW_STEP);
  }

  if (loading) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__status">Loading event…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__error" role="alert">{error || "Event not found."}</p>
        <Link to="/events">← Back to events</Link>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const visibleSteps = (() => {
    const base = showMembershipStep ? STEPS : STEPS.filter((s) => s !== "Membership");
    if (reservedSeatingEnabled) {
      return ["Select tickets", "Select seats", ...base.slice(1)];
    }
    return base;
  })();
  const displayStep = (() => {
    let s = step;
    if (!showMembershipStep && s > MEMBERSHIP_STEP) s -= 1;
    return s;
  })();

  return (
    <div className="ticket-booking">
      {event.heroImage ? (
        <div className="ticket-booking__hero" style={{ backgroundImage: `url(${event.heroImage})` }} />
      ) : (
        <div className="ticket-booking__hero ticket-booking__hero--placeholder" />
      )}

      <div className="ticket-booking__container">
        <header className="ticket-booking__header">
          <p className="ticket-booking__eyebrow">Book tickets</p>
          <h1>{event.title}</h1>
          <div className="ticket-booking__meta">
            <span><IconCalendar size={16} /> {eventDate} · {event.startTime}</span>
            <span><IconMapPin size={16} /> {event.venueName}</span>
          </div>
          {event.description ? <p className="ticket-booking__desc">{event.description}</p> : null}
        </header>

        <div className="ticket-booking__steps" aria-label="Booking progress">
          {visibleSteps.map((label, i) => (
            <span
              key={label}
              className={`ticket-booking__step${displayStep === i + 1 ? " ticket-booking__step--active" : ""}${displayStep > i + 1 ? " ticket-booking__step--done" : ""}`}
            >
              {displayStep > i + 1 ? <IconCheck size={14} /> : i + 1} {label}
            </span>
          ))}
        </div>

        {error ? <p className="ticket-booking__error" role="alert">{error}</p> : null}

        {step === 1 ? (
          <section className="ticket-booking__card">
            <h2><IconTicket size={20} /> Select tickets</h2>
            <ul className="ticket-booking__ticket-list">
              {(event.ticketTypes || []).map((tt) => {
                const selectable = tt.selectable === true;
                const statusClass = tt.computedStatus
                  ? ` ticket-booking__ticket-row--${tt.computedStatus.toLowerCase()}`
                  : "";
                return (
                <li key={tt.id} className={`ticket-booking__ticket-row${statusClass}${selectable ? "" : " ticket-booking__ticket-row--disabled"}`}>
                  <div>
                    <div className="ticket-booking__ticket-head">
                      <p className="ticket-booking__ticket-name">{tt.name}</p>
                      {tt.badge ? (
                        <span className={`ticket-booking__ticket-badge ticket-booking__ticket-badge--${(tt.computedStatus || "").toLowerCase()}`}>
                          {tt.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="ticket-booking__ticket-desc">{tt.description}</p>
                    <p className="ticket-booking__ticket-price">€{tt.price}</p>
                    {tt.displayLabel ? (
                      <p className="ticket-booking__ticket-status-note">{tt.displayLabel}</p>
                    ) : selectable ? (
                      <p className="ticket-booking__ticket-avail">{tt.available} available · max {tt.maxPerOrder} per order</p>
                    ) : null}
                  </div>
                  <label className="ticket-booking__qty-label">
                    <span className="ticket-booking__qty-text">Qty</span>
                    <select
                      value={quantities[tt.id] || 0}
                      disabled={!selectable}
                      onChange={(e) => setQuantities((q) => ({ ...q, [tt.id]: Number(e.target.value) }))}
                      aria-label={`Quantity for ${tt.name}`}
                    >
                      {selectable
                        ? Array.from({ length: Math.min(tt.maxPerOrder, tt.available) + 1 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))
                        : <option value={0}>0</option>}
                    </select>
                  </label>
                </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="ticket-booking__cta"
              disabled={!selectedItems.length}
              onClick={() => setStep(reservedSeatingEnabled ? 2 : DETAILS_STEP)}
            >
              Continue
            </button>
          </section>
        ) : null}

        {step === 2 && reservedSeatingEnabled ? (
          <section className="ticket-booking__card">
            <h2>Select your seats</h2>
            <p className="ticket-booking__hint">
              Choose {ticketQty} seat{ticketQty !== 1 ? "s" : ""} for your tickets.
            </p>
            <SeatMapSelector
              eventId={event.id}
              checkoutSessionId={sessionId}
              ticketQuantity={ticketQty}
              ticketTypeIds={selectedItems.map((i) => i.ticketTypeId)}
              selectedSeatIds={selectedSeatIds}
              onSelectionChange={(ids, seats) => {
                setSelectedSeatIds(ids);
                setSelectedSeatsDetail(seats || []);
              }}
              onError={setError}
            />
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(1)}>Back</button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={selectedSeatIds.length !== ticketQty}
                onClick={() => setStep(DETAILS_STEP)}
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === DETAILS_STEP ? (
          <section className="ticket-booking__card">
            <h2>Your details</h2>
            <p className="ticket-booking__hint">
              Enter your email so we can check for membership benefits.
            </p>
            <div className="ticket-booking__form-grid">
              <label>
                First name *
                <input value={attendee.firstName} onChange={(e) => setAttendee((a) => ({ ...a, firstName: e.target.value }))} />
              </label>
              <label>
                Last name *
                <input value={attendee.lastName} onChange={(e) => setAttendee((a) => ({ ...a, lastName: e.target.value }))} />
              </label>
              <label>
                Email *
                <input
                  type="email"
                  value={attendee.email}
                  onChange={(e) => setAttendee((a) => ({ ...a, email: e.target.value }))}
                  onBlur={() => attendee.email && detectMember(attendee.email)}
                />
              </label>
              <label>
                Phone
                <input type="tel" value={attendee.phone} onChange={(e) => setAttendee((a) => ({ ...a, phone: e.target.value }))} />
              </label>
            </div>
            <div className="ticket-booking__membership-code">
              <label>
                Membership Code
                <input
                  placeholder="Enter Membership Code"
                  value={membershipCode}
                  onChange={(e) => {
                    setMembershipCode(e.target.value.toUpperCase());
                    setMembershipCodeMessage("");
                    setMembershipCodeApplied(false);
                  }}
                />
              </label>
              <button
                type="button"
                className="ticket-booking__cta ticket-booking__cta--small"
                disabled={!membershipCode.trim() || detectingMember}
                onClick={applyMembershipCode}
              >
                Apply Membership Code
              </button>
            </div>
            {membershipCodeMessage ? (
              <p
                className={`ticket-booking__membership-code-msg${
                  membershipCodeApplied ? " ticket-booking__membership-code-msg--success" : ""
                }`}
                role="status"
              >
                {membershipCodeMessage}
              </p>
            ) : null}
            {detectingMember ? (
              <p className="ticket-booking__status" role="status">
                Checking membership benefits…
              </p>
            ) : null}
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(reservedSeatingEnabled ? 2 : 1)}>Back</button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={!attendee.firstName || !attendee.lastName || !attendee.email || detectingMember}
                onClick={nextFromDetails}
              >
                {detectingMember ? "Checking membership benefits…" : "Continue"}
              </button>
            </div>
          </section>
        ) : null}

        {step === BENEFITS_STEP ? (
          <section className="ticket-booking__card">
            <h2>Membership benefit check</h2>
            <MembershipBenefitBanner
              detection={memberDetection}
              messages={detectionMessages}
              includeMembership={includeMembership}
              returnPath={returnPath}
              onSaveBeforeLogin={saveCheckoutBeforeLogin}
              onLogin={() => setApplyMemberBenefit(true)}
              onContinueWithoutDiscount={handleContinueWithoutDiscount}
              onAddMembership={handleAddMembership}
              onTicketsOnly={handleTicketsOnly}
              memberDiscountApplied={preview?.ticketPricing?.memberDiscountMinor > 0}
              discountWarning={preview?.membershipDiscountWarning || ""}
              memberDiscountLabel={preview?.memberDiscountLabel || ""}
            />
            {!memberDetection?.isActive && !includeMembership ? (
              <p className="ticket-booking__hint">
                You can continue without membership or add a plan in the next step.
              </p>
            ) : null}
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(DETAILS_STEP)}>Back</button>
              <button type="button" className="ticket-booking__cta" onClick={nextFromBenefits}>
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === MEMBERSHIP_STEP && showMembershipStep ? (
          <section className="ticket-booking__card">
            <h2>Membership add-on</h2>
            <label className="ticket-booking__toggle">
              <input
                type="checkbox"
                checked={includeMembership}
                onChange={(e) => {
                  setIncludeMembership(e.target.checked);
                  if (!e.target.checked) setSelectedPlanId(null);
                  else if (!selectedPlanId && membershipPlans[0]) setSelectedPlanId(membershipPlans[0].id);
                }}
              />
              Include membership with this booking
            </label>
            {includeMembership ? (
              <MembershipPlanCards
                plans={membershipPlans}
                selectedPlanId={selectedPlanId}
                purchaseType={purchaseType}
                onSelect={setSelectedPlanId}
              />
            ) : null}
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(BENEFITS_STEP)}>Back</button>
              <button type="button" className="ticket-booking__cta" onClick={nextFromMembership}>
                Continue to review
              </button>
            </div>
          </section>
        ) : null}

        {step === REVIEW_STEP ? (
          <section className="ticket-booking__card">
            <h2>Review your booking</h2>

            <div className="ticket-booking__voucher">
              <input
                placeholder="Discount or referral code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              />
              <button type="button" onClick={applyVoucher}>Apply</button>
            </div>
            {voucherMessage ? <p className="ticket-booking__voucher-msg">{voucherMessage}</p> : null}

            <div className="ticket-booking__membership-code">
              <input
                placeholder="Enter Membership Code"
                value={membershipCode}
                onChange={(e) => {
                  setMembershipCode(e.target.value.toUpperCase());
                  setMembershipCodeMessage("");
                  setMembershipCodeApplied(false);
                }}
              />
              <button
                type="button"
                onClick={applyMembershipCode}
                disabled={!membershipCode.trim() || detectingMember}
              >
                Apply Membership Code
              </button>
            </div>
            {membershipCodeMessage ? (
              <p
                className={`ticket-booking__membership-code-msg${
                  membershipCodeApplied ? " ticket-booking__membership-code-msg--success" : ""
                }`}
                role="status"
              >
                {membershipCodeMessage}
              </p>
            ) : null}

            {preview?.membershipBenefitApplied && preview?.ticketPricing?.memberDiscountMinor > 0 ? (
              <p className="ticket-booking__discount-note ticket-booking__discount-note--success">
                {sanitizeCustomerDiscountLabel(
                  preview.memberDiscountLabel || CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied
                )}
              </p>
            ) : preview?.membershipDiscountWarning ? (
              <p className="ticket-booking__discount-note ticket-booking__discount-note--warning" role="status">
                {preview.membershipDiscountWarning}
              </p>
            ) : null}

            {reservedSeatingEnabled && selectedSeatsDetail.length ? (
              <div className="seat-map-summary" style={{ position: "static", marginBottom: 16 }}>
                <h3>Selected seats</h3>
                <ul>
                  {selectedSeatsDetail.map((s) => (
                    <li key={s.seatId}>
                      {s.section ? `${s.section} · ` : ""}Row {s.row}, Seat {s.seatNumber}
                      {s.category && s.category !== "regular" ? ` (${s.category})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DynamicCheckoutForm
              fields={checkoutFormFields}
              values={checkoutFormValues}
              onChange={(key, value) => setCheckoutFormValues((prev) => ({ ...prev, [key]: value }))}
              hideCollected
              knownAnswers={knownCheckoutAnswers}
            />

            <BookingPricePreview preview={preview} />

            <label className="ticket-booking__terms">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              I accept the <Link to="/terms-and-conditions" target="_blank">terms and conditions</Link>
            </label>

            {detectingMember ? (
              <p className="ticket-booking__status" role="status">
                Checking membership benefits…
              </p>
            ) : null}
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(showMembershipStep ? MEMBERSHIP_STEP : BENEFITS_STEP)}>Back</button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={!termsAccepted || !preview || detectingMember || checkoutLoading}
                onClick={goToPaymentStep}
              >
                {detectingMember
                  ? "Checking membership benefits…"
                  : isFreeCheckout
                    ? "Complete free booking"
                    : "Continue to payment"}
              </button>
            </div>
          </section>
        ) : null}

        {step === PAYMENT_STEP ? (
          <section className="ticket-booking__card ticket-booking__card--payment">
            {isFreeCheckout ? (
              <>
                <h2>Secure booking</h2>
                <p className="ticket-booking__free-note">
                  Your discount covers the full amount. No payment is required.
                </p>
                {preview?.combined ? (
                  <div className="ticket-booking__summary ticket-booking__summary--large">
                    <div className="ticket-booking__summary-total">
                      <span>Total due</span><span>{preview.combined.grandTotal}</span>
                    </div>
                    {preview.combined.totalSavingsMinor > 0 ? (
                      <p className="ticket-booking__savings">{preview.combined.savingsMessage}</p>
                    ) : (
                      <p className="ticket-booking__discount-note">Discount applied</p>
                    )}
                  </div>
                ) : null}
                {preview ? <BookingPricePreview preview={preview} /> : null}
                <button
                  type="button"
                  className="ticket-booking__cta ticket-booking__cta--free"
                  disabled={checkoutLoading || !termsAccepted}
                  onClick={completeFreeBooking}
                >
                  {checkoutLoading ? "Completing booking…" : "Complete Free Booking"}
                </button>
              </>
            ) : (
              <>
                <h2>Secure payment</h2>
                {preview?.combined ? (
                  <div className="ticket-booking__summary ticket-booking__summary--large">
                    <div className="ticket-booking__summary-total">
                      <span>Total due</span><span>{preview.combined.grandTotal}</span>
                    </div>
                  </div>
                ) : null}

                {handlingReturn || checkoutLoading ? (
                  <p className="ticket-booking__status" role="status">
                    {handlingReturn ? "Confirming your payment…" : "Preparing secure checkout…"}
                  </p>
                ) : null}

                {!STRIPE_PUBLISHABLE_KEY && (preview?.combined?.grandTotalMinor ?? 0) > 0 ? (
                  <p className="ticket-booking__error">
                    Stripe is not configured. Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to client/.env and restart.
                  </p>
                ) : null}

                {clientSecret && STRIPE_PUBLISHABLE_KEY ? (
                  <div className="ticket-booking__stripe">
                    <Elements
                      key={isDark ? "ticket-stripe-dark" : "ticket-stripe-light"}
                      stripe={getStripePromise()}
                      options={{
                        clientSecret,
                        appearance: stripeAppearance,
                        locale: "auto",
                      }}
                    >
                      <StripeCheckoutForm
                        amountLabel={amountLabel}
                        payer={payer}
                        tier={{ id: event.id, name: event.title }}
                        sessionKey={TICKET_CHECKOUT_SESSION_KEY}
                        returnPath={returnPath}
                        onSuccess={handleStripeSuccess}
                        onError={(msg) => setError(msg)}
                      />
                    </Elements>
                  </div>
                ) : null}
              </>
            )}

            <div className="ticket-booking__nav">
              <button
                type="button"
                className="ticket-booking__back"
                disabled={checkoutLoading || handlingReturn}
                onClick={() => {
                  setClientSecret("");
                  setCheckoutOrder(null);
                  checkoutInitRef.current = false;
                  setStep(REVIEW_STEP);
                }}
              >
                Back
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
