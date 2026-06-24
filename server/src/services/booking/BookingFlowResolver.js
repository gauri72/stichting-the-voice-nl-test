import Event from "../../models/Event.js";
import TicketType from "../../models/TicketType.js";
import {
  BOOKING_MODES,
  BOOKING_FLOW_TYPES,
  BOOKING_STEPS,
  DEFAULT_CHECKOUT_STEPS,
  RSVP_STEPS,
  SESSION_STEPS,
} from "./bookingTypes.js";
import { resolveCheckoutForms } from "./CheckoutFormResolver.js";
import { calculateBookingPrice } from "./PricingService.js";
import { detectMemberForCheckout } from "./MembershipDetectionService.js";
import { createOrUpdateSession } from "./CheckoutStepStateService.js";
import { joinWaitlist } from "./WaitlistService.js";

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Infer booking mode from event/ticket context.
 */
export async function resolveBookingMode(context = {}) {
  const { eventId, items = [], voucherCode, membershipDetected, isLoggedIn, totalMinor } = context;

  if (context.mode) return context.mode;
  if (context.flowType === BOOKING_FLOW_TYPES.RSVP) return BOOKING_MODES.RSVP_EVENT;
  if (context.flowType === BOOKING_FLOW_TYPES.SESSION) return BOOKING_MODES.WORKSHOP;
  if (context.flowType === BOOKING_FLOW_TYPES.WAITLIST) return BOOKING_MODES.WAITLIST;
  if (context.flowType === BOOKING_FLOW_TYPES.COMPLIMENTARY) return BOOKING_MODES.COMPLIMENTARY;
  if (context.flowType === BOOKING_FLOW_TYPES.FESTIVAL_PASS) return BOOKING_MODES.FESTIVAL_PASS;

  if (!eventId) return BOOKING_MODES.GUEST;

  const event = await Event.findById(eventId).lean();
  if (!event) throwError("Event not found.", 404);

  const ticketTypes = items.length
    ? await TicketType.find({ _id: { $in: items.map((i) => i.ticketTypeId) } }).lean()
    : [];

  const hasReservedSeating = Boolean(context.reservedSeatingEnabled);
  const ticketQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);

  if (ticketQty > 1 && ticketTypes.some((t) => /family|group/i.test(t.name || ""))) {
    return BOOKING_MODES.FAMILY_BOOKING;
  }
  if (ticketQty > 1) return BOOKING_MODES.GROUP_BOOKING;
  if (hasReservedSeating) return BOOKING_MODES.RESERVED_SEATING;
  if (voucherCode) return BOOKING_MODES.VOUCHER;
  if (membershipDetected && totalMinor === 0) return BOOKING_MODES.PREMIUM_FREE;
  if (membershipDetected || context.applyMemberBenefit) return BOOKING_MODES.MEMBERSHIP_AWARE;
  if (totalMinor === 0) return BOOKING_MODES.FREE_EVENT;
  if (!isLoggedIn) return BOOKING_MODES.GUEST;

  return BOOKING_MODES.TICKETED_EVENT;
}

/**
 * Returns step sequence for a booking mode.
 */
export function resolveBookingSteps(mode, options = {}) {
  const { showMembershipUpsell = true, isLoggedIn = false, membershipDetected = false } = options;

  if (mode === BOOKING_MODES.RSVP_EVENT) return RSVP_STEPS;
  if ([BOOKING_MODES.WORKSHOP, BOOKING_MODES.FITNESS_SLOT, BOOKING_MODES.RESTAURANT].includes(mode)) {
    return SESSION_STEPS;
  }
  if (mode === BOOKING_MODES.WAITLIST) {
    return ["join_waitlist", "confirmation"];
  }

  const steps = [...DEFAULT_CHECKOUT_STEPS];

  if (options.reservedSeatingEnabled) {
    const idx = steps.indexOf(BOOKING_STEPS.SELECT_TICKETS);
    if (idx >= 0) steps.splice(idx + 1, 0, "select_seats");
  }

  if (isLoggedIn && membershipDetected) {
    return steps.filter((s) => s !== BOOKING_STEPS.MEMBERSHIP_DETECTION);
  }

  if (!showMembershipUpsell) {
    return steps.filter((s) => s !== BOOKING_STEPS.MEMBERSHIP_UPSELL);
  }

  return steps;
}

/**
 * Resolve full booking flow configuration for client rendering.
 */
export async function resolveBookingFlow(payload = {}) {
  const flowType = payload.flowType || BOOKING_FLOW_TYPES.EVENT_TICKET;
  const preview = payload.eventId
    ? await calculateBookingPrice({
        eventId: payload.eventId,
        items: payload.items || [],
        userId: payload.userId,
        email: payload.email,
        isLoggedIn: payload.isLoggedIn,
        includeMembership: payload.includeMembership,
        selectedPlanId: payload.selectedPlanId,
        purchaseType: payload.purchaseType,
        discountCode: payload.discountCode || payload.voucherCode,
        applyMemberBenefit: payload.applyMemberBenefit !== false,
        sessionId: payload.sessionId,
      }).catch(() => null)
    : null;

  const mode = await resolveBookingMode({
    ...payload,
    flowType,
    totalMinor: preview?.combined?.grandTotalMinor ?? payload.totalMinor,
    membershipDetected: preview?.memberDetection?.isActive,
  });

  const forms = payload.eventId
    ? await resolveCheckoutForms({
        eventId: payload.eventId,
        eventType: payload.eventType,
        ticketTypeIds: (payload.items || []).map((i) => i.ticketTypeId),
        items: payload.items,
        ticketQuantity: (payload.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
        knownAnswers: payload.knownAnswers,
        hideCollectedFields: true,
      })
    : { fields: [], forms: [] };

  const steps = resolveBookingSteps(mode, {
    reservedSeatingEnabled: payload.reservedSeatingEnabled,
    showMembershipUpsell: preview?.event?.checkoutSettings?.enableMembershipUpsell !== false,
    isLoggedIn: payload.isLoggedIn,
    membershipDetected: preview?.memberDetection?.isActive,
  });

  const skipPayment = (preview?.combined?.grandTotalMinor ?? 1) <= 0;

  return {
    flowType,
    mode,
    steps,
    skipPayment,
    forms,
    preview,
    features: {
      membershipDetection: true,
      ticketTailorMembership: true,
      dynamicCheckoutForms: true,
      voucherCodes: true,
      membershipCodes: true,
      seatSelection: Boolean(payload.reservedSeatingEnabled),
      waitlist: mode === BOOKING_MODES.WAITLIST,
      qrGeneration: true,
      pdfGeneration: true,
      loginModal: true,
    },
  };
}

export async function startBooking(flowType, payload, userId = null) {
  if (flowType === BOOKING_FLOW_TYPES.EVENT_TICKET) {
    const { generateSessionId } = await import("../pricePreviewService.js");
    const sessionId = payload.sessionId || generateSessionId();
    const result = await createOrUpdateSession({
      sessionId,
      eventId: payload.eventId,
      userId,
      email: payload.email,
      items: payload.items || [],
      includeMembership: payload.includeMembership,
      selectedPlanId: payload.selectedPlanId,
      purchaseType: payload.purchaseType,
      discountCode: payload.discountCode || payload.voucherCode,
      applyMemberBenefit: payload.applyMemberBenefit !== false,
      isLoggedIn: Boolean(userId),
    });
    return { sessionId: result.sessionId, preview: result.preview };
  }
  return resolveBookingFlow({ ...payload, flowType, userId, isLoggedIn: Boolean(userId) });
}

export async function previewBooking(flowType, payload, userId = null) {
  if (flowType === BOOKING_FLOW_TYPES.EVENT_TICKET) {
    const preview = await calculateBookingPrice({
      ...payload,
      userId,
      isLoggedIn: Boolean(userId),
    });
    return { preview };
  }
  if (flowType === BOOKING_FLOW_TYPES.SESSION) {
    const { getPublicSessionBySlug } = await import("./SessionBookingService.js");
    return getPublicSessionBySlug(payload.slug);
  }
  if (flowType === BOOKING_FLOW_TYPES.RSVP) {
    const { getPublicRsvpEvent } = await import("./RSVPService.js");
    return getPublicRsvpEvent(payload.slug);
  }
  throwError(`Preview not supported for flow: ${flowType}`);
}

export async function checkoutBooking(flowType, payload, userId = null) {
  if (flowType === BOOKING_FLOW_TYPES.EVENT_TICKET) {
    const { createBundleCheckout } = await import("../checkoutBundleService.js");
    return createBundleCheckout(payload.eventId, payload, userId);
  }
  if (flowType === BOOKING_FLOW_TYPES.SESSION) {
    const { createPublicSessionBooking } = await import("./SessionBookingService.js");
    return createPublicSessionBooking(payload, userId);
  }
  if (flowType === BOOKING_FLOW_TYPES.WAITLIST) {
    return joinWaitlist({ ...payload, userId });
  }
  if (flowType === BOOKING_FLOW_TYPES.RSVP) {
    const { submitRsvpResponse } = await import("./RSVPService.js");
    return submitRsvpResponse(payload.slug, payload);
  }
  throwError(`Checkout not supported for flow: ${flowType}`);
}

export async function confirmBooking(flowType, payload, userId = null) {
  if (flowType === BOOKING_FLOW_TYPES.EVENT_TICKET) {
    const { completeFreeOrder } = await import("../checkoutBundleService.js");
    if (payload.isFreeOrder || payload.skipPayment) {
      return completeFreeOrder(payload.eventId, payload, userId);
    }
    const { confirmPayment } = await import("./PaymentService.js");
    return confirmPayment({ orderId: payload.orderId, paymentIntentId: payload.paymentIntentId });
  }
  if (flowType === BOOKING_FLOW_TYPES.SESSION) {
    const { confirmSessionBookingPayment } = await import("./SessionBookingService.js");
    return confirmSessionBookingPayment(payload.bookingId, payload.paymentIntentId);
  }
  if (flowType === BOOKING_FLOW_TYPES.COMPLIMENTARY) {
    const { issueComplimentaryBooking } = await import("./ComplimentaryBookingService.js");
    return issueComplimentaryBooking(payload, userId);
  }
  if (flowType === BOOKING_FLOW_TYPES.FESTIVAL_PASS) {
    const { checkoutFestivalPass } = await import("./ComplimentaryBookingService.js");
    return checkoutFestivalPass(payload, userId);
  }
  throwError(`Confirm not supported for flow: ${flowType}`);
}

export async function detectMembership(payload) {
  return detectMemberForCheckout(payload);
}

export async function resolveForms(payload) {
  return resolveCheckoutForms(payload);
}

export async function issueComplimentaryBooking(payload, adminId) {
  const { issueComplimentaryBooking: issue } = await import("./ComplimentaryBookingService.js");
  return issue(payload, adminId);
}

export async function checkoutFestivalPass(payload, userId) {
  const { checkoutFestivalPass: checkout } = await import("./ComplimentaryBookingService.js");
  return checkout(payload, userId);
}
