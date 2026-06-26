import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Elements } from "@stripe/react-stripe-js";
import { IconCalendar, IconMapPin, IconTicket, IconCheck, IconX, IconStar } from "@tabler/icons-react";
import StripeCheckoutForm from "../payments/StripeCheckoutForm.jsx";
import LoginModal from "../common/LoginModal.jsx";
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
import {
  getMembershipMessages,
  membershipBannerHasContent,
  sanitizeCustomerDiscountLabel,
} from "../../utils/membershipDisplayLabels.js";
import SeatMapSelector from "./SeatMapSelector.jsx";
import WaitlistJoinForm from "./WaitlistJoinForm.jsx";
import DynamicCheckoutForm, { serializeCheckoutAnswers } from "./DynamicCheckoutForm.jsx";
import useBookingFlow from "../../hooks/useBookingFlow.js";
import "../../styles/sponsorship-payment-block.css";
import "../../styles/seat-map.css";
import { devWarn } from "../../utils/devLog.js";

const TICKET_CHECKOUT_SESSION_KEY = "voice_nl_ticket_checkout";

const EMPTY_ATTENDEE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

function buildSteps(t) {
  return [
    t("checkout:steps.selectTickets"),
    t("checkout:steps.yourDetails"),
    t("checkout:steps.memberBenefits"),
    t("checkout:steps.membership"),
    t("checkout:steps.review"),
    t("checkout:steps.payment"),
  ];
}

export default function TicketBookingPage() {
  const { t } = useTranslation(["checkout"]);
  const STEPS = useMemo(() => buildSteps(t), [t]);
  const messagesCopy = useMemo(() => getMembershipMessages(t), [t]);
  const { eventIdOrSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const stripeAppearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);

  const [event, setEvent] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [attendee, setAttendee] = useState(EMPTY_ATTENDEE);
  // Per-ticket-type discount/voucher code entry — replaces the old single cart-wide
  // voucherCode/voucherMessage (now entered once per ticket-type row in Select Tickets
  // instead of once for the whole order in Review).
  const [ticketCodes, setTicketCodes] = useState({});
  const [ticketCodeStatus, setTicketCodeStatus] = useState({});
  const [ticketCodeMessage, setTicketCodeMessage] = useState({});
  const [ticketCodeResult, setTicketCodeResult] = useState({});
  const ticketCodeTimersRef = useRef({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [preview, setPreview] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

  const selectedItems = useMemo(
    () =>
      (event?.ticketTypes || [])
        .filter((tt) => (quantities[tt.id] || 0) > 0)
        .map((tt) => ({ ticketTypeId: tt.id, quantity: quantities[tt.id] })),
    [event?.ticketTypes, quantities]
  );

  const checkoutSettings = event?.checkoutSettings || {};
  const showMembershipStep =
    checkoutSettings.enableMembershipUpsell !== false &&
    checkoutSettings.allowMembershipTicketBundle !== false;
  const benefitsHaveContent = membershipBannerHasContent(memberDetection, {
    memberDiscountApplied: preview?.ticketPricing?.memberDiscountMinor > 0,
    discountWarning: preview?.membershipDiscountWarning || "",
    messages: detectionMessages,
  });

  const seatOffset = reservedSeatingEnabled ? 1 : 0;
  const ticketQty = selectedItems.reduce((sum, li) => sum + li.quantity, 0);
  const checkoutFormAnswers = useMemo(() => {
    const serialized = serializeCheckoutAnswers(checkoutFormFields, checkoutFormValues);
    // The standard checkout form's own "terms" question duplicates this page's
    // dedicated terms checkbox below — it's hidden from display (see
    // visibleCheckoutFormFields), so mirror its value here instead of asking
    // the customer to accept terms twice.
    return serialized.map((a) =>
      a.questionId === "terms" ? { ...a, answer: termsAccepted } : a
    );
  }, [checkoutFormFields, checkoutFormValues, termsAccepted]);
  const visibleCheckoutFormFields = useMemo(
    () => checkoutFormFields.filter((f) => f.fieldId !== "terms"),
    [checkoutFormFields]
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
    joinWaitlist,
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
        if (!cancelled) setError(err.message || t("checkout:errors.eventNotFound"));
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
          discountCodes: ticketCodes,
          applyMemberBenefit: overrides.applyMemberBenefit ?? applyMemberBenefit,
          membershipCode: membershipCode || undefined,
        });
      setPreview(data.preview);
      setError("");
    } catch (err) {
      setError(err.message || t("checkout:errors.couldNotCalculateTotal"));
    }
  }, [
    event?.id,
    selectedItems,
    attendee.email,
    includeMembership,
    selectedPlanId,
    purchaseType,
    ticketCodes,
    applyMemberBenefit,
    sessionId,
    membershipCode,
    fetchPreview,
  ]);

  const lastDetectedRef = useRef("");

  const detectMember = useCallback(async (email, codeOverride = null) => {
    const trimmedEmail = email?.trim() || "";
    if (!trimmedEmail && !codeOverride) return;
    // Email blur (on losing focus, e.g. when clicking "Continue") and the
    // step-entry effect both call this for the same email — skip the repeat
    // so it can't flip the Continue button to disabled mid-click.
    const dedupeKey = `${trimmedEmail}|${codeOverride || ""}`;
    if (lastDetectedRef.current === dedupeKey) return;
    lastDetectedRef.current = dedupeKey;

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
      devWarn("Member detection failed:", err.message);
      lastDetectedRef.current = "";
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
        discountCodes: ticketCodes,
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
    ticketCodes,
    membershipCode,
    memberDetection,
    step,
    includeMembership,
    selectedPlanId,
    purchaseType,
    returnPath,
    saveBeforeLoginApi,
  ]);

  const handleRequestLogin = useCallback(async () => {
    // The modal never navigates away, so apply-benefits-after-login needs a CheckoutSession
    // record to write the post-login detection back onto — without this, that call 404s
    // ("Checkout session expired or not found") and the failure gets swallowed, leaving the
    // user stuck on the same screen after logging in.
    try {
      await saveCheckoutBeforeLogin();
    } catch (err) {
      setError(err.message || t("checkout:errors.couldNotStartCheckout"));
      return;
    }
    setIsLoginModalOpen(true);
  }, [saveCheckoutBeforeLogin, t]);

  const handleLoginModalAuthenticated = useCallback(async () => {
    setIsLoginModalOpen(false);
    setApplyMemberBenefit(true);
    try {
      const result = await applyBenefitsAfterLogin({ sessionId, email: attendee.email });
      if (result.detection) {
        setMemberDetection(result.detection);
        setDetectionMessages(result.messages);
      }
      if (result.preview) setPreview(result.preview);
    } catch (err) {
      devWarn("Could not apply member benefits after login:", err.message);
      setError(err.message || t("checkout:errors.couldNotStartCheckout"));
    }
  }, [applyBenefitsAfterLogin, sessionId, attendee.email, t]);

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
    if (restored.discountCodes && Object.keys(restored.discountCodes).length) {
      setTicketCodes(restored.discountCodes);
    }
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
        devWarn("Could not restore checkout session:", err.message);
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
    // Runs from Select Tickets onward (not just step >= 4 as before) so the per-ticket-type
    // membership badge and discount amounts have something to read as soon as quantities or
    // codes change, not only once the customer reaches Review.
    if (selectedItems.length) {
      const timer = window.setTimeout(refreshPreview, 300);
      return () => window.clearTimeout(timer);
    }
    setPreview(null);
  }, [refreshPreview, selectedItems.length, includeMembership, selectedPlanId, applyMemberBenefit]);

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
        setError(err.message || t("checkout:errors.couldNotConfirmBooking"));
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
        const typeLabel = data.detection?.membershipType || t("checkout:membershipMessages.defaultType");
        const until = data.detection?.memberUntil ? ` · ${t("checkout:membershipBanner.validUntilSuffix", { date: data.detection.memberUntil })}` : "";
        setMembershipCodeMessage(
          data.message
            ? `${data.message} — ${typeLabel}${until}`
            : `${messagesCopy.verified} — ${typeLabel}${until}`
        );
        setApplyMemberBenefit(true);
        if (attendee.email) await detectMember(attendee.email, membershipCode.trim());
        refreshPreview({ applyMemberBenefit: true });
      } else {
        setMembershipCodeApplied(false);
        setMembershipCodeMessage(data.message || t("checkout:errors.membershipCodeInvalid"));
      }
    } catch (err) {
      setMembershipCodeApplied(false);
      setMembershipCodeMessage(err.message || t("checkout:errors.membershipCodeInvalid"));
    } finally {
      setDetectingMember(false);
    }
  }

  async function validateTicketCode(ticketTypeId, code) {
    const tt = (event?.ticketTypes || []).find((t) => t.id === ticketTypeId);
    const qty = quantities[ticketTypeId] || 1;
    const lineSubtotalMinor = (tt?.priceMinor || 0) * qty;

    setTicketCodeStatus((s) => ({ ...s, [ticketTypeId]: "checking" }));
    try {
      const result = await validateDiscountCode(code, {
        ticketTypeId,
        orderType: "tickets",
        subtotalMinor: lineSubtotalMinor,
      });
      setTicketCodeStatus((s) => ({ ...s, [ticketTypeId]: "valid" }));
      setTicketCodeMessage((s) => ({ ...s, [ticketTypeId]: t("checkout:errors.discountApplied") }));
      setTicketCodeResult((s) => ({ ...s, [ticketTypeId]: result }));
      refreshPreview();
    } catch (err) {
      setTicketCodeStatus((s) => ({ ...s, [ticketTypeId]: "invalid" }));
      setTicketCodeMessage((s) => ({ ...s, [ticketTypeId]: err.message || t("checkout:errors.discountInvalid") }));
      setTicketCodeResult((s) => ({ ...s, [ticketTypeId]: null }));
    }
  }

  function handleTicketCodeChange(ticketTypeId, rawValue) {
    const value = rawValue.toUpperCase();
    setTicketCodes((c) => ({ ...c, [ticketTypeId]: value }));

    if (ticketCodeTimersRef.current[ticketTypeId]) {
      window.clearTimeout(ticketCodeTimersRef.current[ticketTypeId]);
    }

    if (!value.trim()) {
      setTicketCodeStatus((s) => ({ ...s, [ticketTypeId]: "idle" }));
      setTicketCodeMessage((s) => ({ ...s, [ticketTypeId]: "" }));
      setTicketCodeResult((s) => ({ ...s, [ticketTypeId]: null }));
      refreshPreview();
      return;
    }

    ticketCodeTimersRef.current[ticketTypeId] = window.setTimeout(() => {
      validateTicketCode(ticketTypeId, value);
    }, 500);
  }

  async function initCheckout() {
    const totalMinor = preview?.combined?.grandTotalMinor ?? 1;
    if (!STRIPE_PUBLISHABLE_KEY && totalMinor > 0) {
      setError(t("checkout:errors.stripeNotConfigured"));
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
          discountCodes: ticketCodes,
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

      throw new Error(checkout.payment?.message || t("checkout:errors.couldNotStartSecureCheckout"));
    } catch (err) {
      setError(err.message || t("checkout:errors.couldNotStartCheckout"));
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
          items: selectedItems,
          attendeeFirstName: attendee.firstName,
          attendeeLastName: attendee.lastName,
          attendeeEmail: attendee.email,
          attendeePhone: attendee.phone,
          discountCodes: ticketCodes,
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
      setError(err.message || t("checkout:errors.freeBookingFailed"));
    } finally {
      setCheckoutLoading(false);
    }
  }

  function goToPaymentStep() {
    if (!attendee.email?.includes("@")) {
      setError(t("checkout:errors.invalidEmail"));
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
      devWarn("Member detection failed:", err.message);
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
      setError(err.message || t("checkout:errors.completeRequiredQuestions"));
      setStep(REVIEW_STEP);
      return;
    }

    if (isActiveGuest && applyMemberBenefit && !membershipCodeApplied) {
      setError(t("checkout:errors.loginToApplyBenefits"));
      setStep(BENEFITS_STEP);
      return;
    }

    if (isExpiredGuest) {
      setError(t("checkout:errors.renewToApplyBenefits"));
      setStep(BENEFITS_STEP);
      return;
    }

    if (isFreeCheckout) {
      await completeFreeBooking();
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
      setError(t("checkout:errors.orderReferenceMissing"));
      return;
    }
    try {
      await finalizeTicketPayment(paymentIntent);
    } catch (err) {
      setError(err.message || t("checkout:errors.paymentSucceededConfirmationFailed"));
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
    setStep(includeMembership ? MEMBERSHIP_STEP : REVIEW_STEP);
  }

  function nextFromDetails() {
    if (!attendee.firstName || !attendee.lastName || !attendee.email) return;
    if (benefitsHaveContent) {
      setStep(BENEFITS_STEP);
    } else {
      setStep(includeMembership ? MEMBERSHIP_STEP : REVIEW_STEP);
    }
  }

  function nextFromBenefits() {
    if (
      memberDetection?.status === "GUEST_EMAIL_ACTIVE_MEMBER" &&
      applyMemberBenefit &&
      !membershipCodeApplied
    ) {
      setError(t("checkout:errors.loginToApplyBenefits"));
      return;
    }
    setStep(includeMembership ? MEMBERSHIP_STEP : REVIEW_STEP);
  }

  function nextFromMembership() {
    if (includeMembership && !selectedPlanId) {
      setError(t("checkout:errors.selectMembershipPlan"));
      return;
    }
    setError("");
    refreshPreview();
    setStep(REVIEW_STEP);
  }

  if (loading) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__status">{t("checkout:errors.loadingEvent")}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ticket-booking">
        <p className="ticket-booking__error" role="alert">{error || t("checkout:errors.eventNotFound")}</p>
        <Link to="/events">{t("checkout:common.backToEvents")}</Link>
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
    // STEPS index 3 is "Membership" — filter by position, not by translated
    // text, since the membership step label is no longer a stable literal.
    const base = showMembershipStep ? STEPS : STEPS.filter((_, i) => i !== 3);
    if (reservedSeatingEnabled) {
      return [STEPS[0], t("checkout:steps.selectSeats"), ...base.slice(1)];
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
      <LoginModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAuthenticated={handleLoginModalAuthenticated}
        returnTo={returnPath}
        prefillEmail={attendee.email}
      />
      {event.heroImage ? (
        <div className="ticket-booking__hero" style={{ backgroundImage: `url(${event.heroImage})` }} />
      ) : (
        <div className="ticket-booking__hero ticket-booking__hero--placeholder" />
      )}

      <div className="ticket-booking__container">
        <header className="ticket-booking__header">
          <p className="ticket-booking__eyebrow">{t("checkout:common.bookTickets")}</p>
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
            <h2><IconTicket size={20} /> {t("checkout:selectTickets.title")}</h2>
            <ul className="ticket-booking__ticket-list">
              {(event.ticketTypes || []).map((tt) => {
                const selectable = tt.selectable === true;
                const statusClass = tt.computedStatus
                  ? ` ticket-booking__ticket-row--${tt.computedStatus.toLowerCase()}`
                  : "";
                const qty = quantities[tt.id] || 0;
                const previewLine = preview?.ticketPricing?.lineItems?.find((l) => l.ticketTypeId === tt.id);
                const hasMembershipDiscount = (previewLine?.memberDiscountMinor || 0) > 0;
                const codeStatus = ticketCodeStatus[tt.id] || "idle";
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
                      {hasMembershipDiscount ? (
                        <span className="ticket-booking__ticket-badge ticket-booking__ticket-badge--member">
                          <IconStar size={12} /> {sanitizeCustomerDiscountLabel(previewLine.memberLabel, t) || t("checkout:selectTickets.memberDiscount")}
                        </span>
                      ) : null}
                    </div>
                    <p className="ticket-booking__ticket-desc">{tt.description}</p>
                    <p className="ticket-booking__ticket-price">
                      €{tt.price}
                      {previewLine?.discountAmountMinor > 0 ? (
                        <span className="ticket-booking__ticket-price-final"> → {previewLine.finalPrice}</span>
                      ) : null}
                    </p>
                    {tt.displayLabel ? (
                      <p className="ticket-booking__ticket-status-note">{tt.displayLabel}</p>
                    ) : selectable ? (
                      <p className="ticket-booking__ticket-avail">
                        {tt.available} {t("checkout:selectTickets.available")} · {t("checkout:selectTickets.maxPerOrder", { count: tt.maxPerOrder })}
                      </p>
                    ) : null}
                    {tt.computedStatus === "SOLD_OUT" && tt.soldOutDisplayMode === "waitlist" ? (
                      <WaitlistJoinForm
                        eventId={event.id}
                        ticketTypeId={tt.id}
                        ticketTypeName={tt.name}
                        maxQuantity={tt.maxPerOrder || 4}
                        defaultAttendee={attendee}
                        onJoinWaitlist={joinWaitlist}
                      />
                    ) : null}
                    {qty > 0 ? (
                      <div className="ticket-booking__ticket-code">
                        <div className={`ticket-booking__ticket-code-input ticket-booking__ticket-code-input--${codeStatus}`}>
                          <input
                            placeholder={t("checkout:selectTickets.codePlaceholder")}
                            value={ticketCodes[tt.id] || ""}
                            onChange={(e) => handleTicketCodeChange(tt.id, e.target.value)}
                            aria-label={`Discount or voucher code for ${tt.name}`}
                          />
                          {codeStatus === "checking" ? <span className="ticket-booking__ticket-code-spinner" aria-hidden="true" /> : null}
                          {codeStatus === "valid" ? <IconCheck className="ticket-booking__ticket-code-icon--valid" size={16} /> : null}
                          {codeStatus === "invalid" ? <IconX className="ticket-booking__ticket-code-icon--invalid" size={16} /> : null}
                        </div>
                        {ticketCodeMessage[tt.id] ? (
                          <p
                            className={`ticket-booking__ticket-code-msg ticket-booking__ticket-code-msg--${codeStatus}`}
                            role="status"
                          >
                            {ticketCodeMessage[tt.id]}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <label className="ticket-booking__qty-label">
                    <span className="ticket-booking__qty-text">{t("checkout:selectTickets.qty")}</span>
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

            {selectedItems.length ? (
              <div className="ticket-booking__membership-code">
                <label>
                  {t("checkout:yourDetails.membershipCode")}
                  <input
                    placeholder={t("checkout:yourDetails.membershipCodePlaceholder")}
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
                  {t("checkout:yourDetails.applyMembershipCode")}
                </button>
              </div>
            ) : null}
            {selectedItems.length && membershipCodeMessage ? (
              <p
                className={`ticket-booking__membership-code-msg${
                  membershipCodeApplied ? " ticket-booking__membership-code-msg--success" : ""
                }`}
                role="status"
              >
                {membershipCodeMessage}
              </p>
            ) : null}

            <button
              type="button"
              className="ticket-booking__cta"
              disabled={!selectedItems.length}
              onClick={() => setStep(reservedSeatingEnabled ? 2 : DETAILS_STEP)}
            >
              {t("checkout:selectTickets.continue")}
            </button>
          </section>
        ) : null}

        {step === 2 && reservedSeatingEnabled ? (
          <section className="ticket-booking__card">
            <h2>{t("checkout:selectSeats.title")}</h2>
            <p className="ticket-booking__hint">
              {ticketQty === 1
                ? t("checkout:selectSeats.hint", { count: ticketQty })
                : t("checkout:selectSeats.hintPlural", { count: ticketQty })}
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
              <button type="button" className="ticket-booking__back" onClick={() => setStep(1)}>{t("checkout:nav.back")}</button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={selectedSeatIds.length !== ticketQty}
                onClick={() => setStep(DETAILS_STEP)}
              >
                {t("checkout:nav.continue")}
              </button>
            </div>
          </section>
        ) : null}

        {step === DETAILS_STEP ? (
          <section className="ticket-booking__card">
            <h2>{t("checkout:yourDetails.title")}</h2>
            <p className="ticket-booking__hint">
              {t("checkout:yourDetails.hint")}
            </p>
            <div className="ticket-booking__form-grid">
              <label>
                {t("checkout:yourDetails.firstName")} *
                <input value={attendee.firstName} onChange={(e) => setAttendee((a) => ({ ...a, firstName: e.target.value }))} />
              </label>
              <label>
                {t("checkout:yourDetails.lastName")} *
                <input value={attendee.lastName} onChange={(e) => setAttendee((a) => ({ ...a, lastName: e.target.value }))} />
              </label>
              <label>
                {t("checkout:yourDetails.email")} *
                <input
                  type="email"
                  value={attendee.email}
                  onChange={(e) => setAttendee((a) => ({ ...a, email: e.target.value }))}
                  onBlur={() => attendee.email && detectMember(attendee.email)}
                />
              </label>
              <label>
                {t("checkout:yourDetails.phone")}
                <input type="tel" value={attendee.phone} onChange={(e) => setAttendee((a) => ({ ...a, phone: e.target.value }))} />
              </label>
            </div>
            <div className="ticket-booking__membership-code">
              <label>
                {t("checkout:yourDetails.membershipCode")}
                <input
                  placeholder={t("checkout:yourDetails.membershipCodePlaceholder")}
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
                {t("checkout:yourDetails.applyMembershipCode")}
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
                {t("checkout:yourDetails.checkingMembershipBenefits")}
              </p>
            ) : null}
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(reservedSeatingEnabled ? 2 : 1)}>{t("checkout:nav.back")}</button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={!attendee.firstName || !attendee.lastName || !attendee.email || detectingMember}
                onClick={nextFromDetails}
              >
                {detectingMember ? t("checkout:yourDetails.checkingMembershipBenefits") : t("checkout:nav.continue")}
              </button>
            </div>
          </section>
        ) : null}

        {step === BENEFITS_STEP ? (
          <section className="ticket-booking__card">
            <h2>{t("checkout:memberBenefits.title")}</h2>
            <MembershipBenefitBanner
              detection={memberDetection}
              messages={detectionMessages}
              includeMembership={includeMembership}
              returnPath={returnPath}
              onRequestLogin={handleRequestLogin}
              onContinueWithoutDiscount={handleContinueWithoutDiscount}
              onAddMembership={handleAddMembership}
              onTicketsOnly={handleTicketsOnly}
              memberDiscountApplied={preview?.ticketPricing?.memberDiscountMinor > 0}
              discountWarning={preview?.membershipDiscountWarning || ""}
              memberDiscountLabel={preview?.memberDiscountLabel || ""}
            />
            {!memberDetection?.isActive && !includeMembership ? (
              <p className="ticket-booking__hint">
                {t("checkout:memberBenefits.continueHint")}
              </p>
            ) : null}
            <div className="ticket-booking__nav">
              <button type="button" className="ticket-booking__back" onClick={() => setStep(DETAILS_STEP)}>{t("checkout:nav.back")}</button>
              <button type="button" className="ticket-booking__cta" onClick={nextFromBenefits}>
                {t("checkout:nav.continue")}
              </button>
            </div>
          </section>
        ) : null}

        {step === MEMBERSHIP_STEP && showMembershipStep ? (
          <section className="ticket-booking__card">
            <h2>{t("checkout:membership.title")}</h2>
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
              {t("checkout:membership.includeWithBooking")}
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
              <button type="button" className="ticket-booking__back" onClick={() => setStep(benefitsHaveContent ? BENEFITS_STEP : DETAILS_STEP)}>{t("checkout:nav.back")}</button>
              <button type="button" className="ticket-booking__cta" onClick={nextFromMembership}>
                {t("checkout:membership.continueToReview")}
              </button>
            </div>
          </section>
        ) : null}

        {step === REVIEW_STEP ? (
          <section className="ticket-booking__card">
            <h2>{t("checkout:review.title")}</h2>

            {(event.ticketTypes || []).filter((tt) => (quantities[tt.id] || 0) > 0).length ? (
              <div className="ticket-booking__review-vouchers">
                <p className="ticket-booking__review-vouchers-label">{t("checkout:review.voucherCodesTitle")}</p>
                {(event.ticketTypes || [])
                  .filter((tt) => (quantities[tt.id] || 0) > 0)
                  .map((tt) => {
                    const codeStatus = ticketCodeStatus[tt.id] || "idle";
                    return (
                      <div key={tt.id} className="ticket-booking__ticket-code">
                        <label>{tt.name}</label>
                        <div className={`ticket-booking__ticket-code-input ticket-booking__ticket-code-input--${codeStatus}`}>
                          <input
                            placeholder={t("checkout:selectTickets.codePlaceholder")}
                            value={ticketCodes[tt.id] || ""}
                            onChange={(e) => handleTicketCodeChange(tt.id, e.target.value)}
                            aria-label={`Discount or voucher code for ${tt.name}`}
                          />
                          {codeStatus === "checking" ? <span className="ticket-booking__ticket-code-spinner" aria-hidden="true" /> : null}
                          {codeStatus === "valid" ? <IconCheck className="ticket-booking__ticket-code-icon--valid" size={16} /> : null}
                          {codeStatus === "invalid" ? <IconX className="ticket-booking__ticket-code-icon--invalid" size={16} /> : null}
                        </div>
                        {ticketCodeMessage[tt.id] ? (
                          <p
                            className={`ticket-booking__ticket-code-msg ticket-booking__ticket-code-msg--${codeStatus}`}
                            role="status"
                          >
                            {ticketCodeMessage[tt.id]}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            ) : null}

            <div className="ticket-booking__membership-code">
              <input
                placeholder={t("checkout:yourDetails.membershipCodePlaceholder")}
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
                {t("checkout:yourDetails.applyMembershipCode")}
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
                  preview.memberDiscountLabel || messagesCopy.discountApplied,
                  t
                )}
              </p>
            ) : preview?.membershipDiscountWarning ? (
              <p className="ticket-booking__discount-note ticket-booking__discount-note--warning" role="status">
                {preview.membershipDiscountWarning}
              </p>
            ) : null}

            {reservedSeatingEnabled && selectedSeatsDetail.length ? (
              <div className="seat-map-summary" style={{ position: "static", marginBottom: 16 }}>
                <h3>{t("checkout:review.selectedSeats")}</h3>
                <ul>
                  {selectedSeatsDetail.map((s) => (
                    <li key={s.seatId}>
                      {s.section ? `${s.section} · ` : ""}{t("checkout:seatMap.row")} {s.row}, {t("checkout:seatMap.seat")} {s.seatNumber}
                      {s.category && s.category !== "regular" ? ` (${s.category})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DynamicCheckoutForm
              fields={visibleCheckoutFormFields}
              values={checkoutFormValues}
              onChange={(key, value) => setCheckoutFormValues((prev) => ({ ...prev, [key]: value }))}
              hideCollected
              knownAnswers={knownCheckoutAnswers}
            />

            <BookingPricePreview preview={preview} />

            <label className="ticket-booking__terms">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              {t("checkout:review.acceptTerms")} <Link to="/terms-and-conditions" target="_blank">{t("checkout:review.termsAndConditions")}</Link>
            </label>

            {detectingMember ? (
              <p className="ticket-booking__status" role="status">
                {t("checkout:yourDetails.checkingMembershipBenefits")}
              </p>
            ) : null}
            <div className="ticket-booking__nav">
              <button
                type="button"
                className="ticket-booking__back"
                onClick={() =>
                  setStep(
                    includeMembership
                      ? MEMBERSHIP_STEP
                      : benefitsHaveContent
                        ? BENEFITS_STEP
                        : DETAILS_STEP
                  )
                }
              >
                {t("checkout:nav.back")}
              </button>
              <button
                type="button"
                className="ticket-booking__cta"
                disabled={!termsAccepted || !preview || detectingMember || checkoutLoading}
                onClick={goToPaymentStep}
              >
                {detectingMember
                  ? t("checkout:yourDetails.checkingMembershipBenefits")
                  : isFreeCheckout
                    ? t("checkout:review.completeFreeBooking")
                    : t("checkout:review.continueToPayment")}
              </button>
            </div>
          </section>
        ) : null}

        {step === PAYMENT_STEP ? (
          <section className="ticket-booking__card ticket-booking__card--payment">
            {isFreeCheckout ? (
              <>
                <h2>{t("checkout:payment.secureBooking")}</h2>
                <p className="ticket-booking__free-note">
                  {t("checkout:payment.freeNote")}
                </p>
                {preview?.combined ? (
                  <div className="ticket-booking__summary ticket-booking__summary--large">
                    <div className="ticket-booking__summary-total">
                      <span>{t("checkout:payment.totalDue")}</span><span>{preview.combined.grandTotal}</span>
                    </div>
                    {preview.combined.totalSavingsMinor > 0 ? (
                      <p className="ticket-booking__savings">{preview.combined.savingsMessage}</p>
                    ) : (
                      <p className="ticket-booking__discount-note">{t("checkout:payment.discountApplied")}</p>
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
                  {checkoutLoading ? t("checkout:payment.completingBooking") : t("checkout:payment.completeFreeBooking")}
                </button>
              </>
            ) : (
              <>
                <h2>{t("checkout:payment.securePayment")}</h2>
                {preview?.combined ? (
                  <div className="ticket-booking__summary ticket-booking__summary--large">
                    <div className="ticket-booking__summary-total">
                      <span>{t("checkout:payment.totalDue")}</span><span>{preview.combined.grandTotal}</span>
                    </div>
                  </div>
                ) : null}

                {handlingReturn || checkoutLoading ? (
                  <p className="ticket-booking__status" role="status">
                    {handlingReturn ? t("checkout:payment.confirmingPayment") : t("checkout:payment.preparingCheckout")}
                  </p>
                ) : null}

                {!STRIPE_PUBLISHABLE_KEY && (preview?.combined?.grandTotalMinor ?? 0) > 0 ? (
                  <p className="ticket-booking__error">
                    {t("checkout:errors.stripeNotConfigured")}
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
                {t("checkout:nav.back")}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
