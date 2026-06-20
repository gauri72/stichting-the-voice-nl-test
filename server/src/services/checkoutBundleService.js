import crypto from "crypto";
import CheckoutSession from "../models/CheckoutSession.js";
import { getPublishedEventBySlugOrId } from "./eventService.js";
import { detectMemberStatus, MEMBER_STATES } from "./memberDetectionService.js";
import { MEMBERSHIP_SOURCE } from "./membershipDetectionService.js";
import {
  CUSTOMER_MEMBERSHIP_MESSAGES,
  buildActiveMembershipAppliedBody,
  buildActiveMembershipFoundBody,
} from "../utils/membershipDisplayLabels.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";
import { calculatePricePreview, generateSessionId } from "./pricePreviewService.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "./checkoutAuditService.js";
import { getNextSequence } from "../utils/sequence.js";
import TicketOrder from "../models/TicketOrder.js";
import { createTicketPaymentIntent } from "./ticketPaymentService.js";
import { formatMoney } from "./ticketPricingService.js";
import { resolvePlanId } from "../config/membershipPlans.js";

const SESSION_TTL_MS = 60 * 60 * 1000;

async function buildOrderNumber() {
  const seq = await getNextSequence("ticket_order");
  const year = new Date().getFullYear();
  return `VOICE-${year}-${String(seq).padStart(6, "0")}`;
}

export async function createOrUpdateSession({
  sessionId,
  eventId,
  userId,
  email,
  items,
  includeMembership = false,
  selectedPlanId = null,
  purchaseType = "NEW",
  discountCode = "",
  applyMemberBenefit = true,
  isLoggedIn = false,
}) {
  const sid = sessionId || generateSessionId();
  const preview = await calculatePricePreview({
    eventId,
    items,
    userId,
    email,
    isLoggedIn,
    includeMembership,
    selectedPlanId,
    purchaseType,
    discountCode,
    applyMemberBenefit,
    sessionId: sid,
  });

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await CheckoutSession.findOneAndUpdate(
    { sessionId: sid },
    {
      sessionId: sid,
      userId: userId || null,
      email: String(email || "").toLowerCase(),
      eventId: preview.event.id,
      detectedMemberStatus: preview.memberDetection.status,
      selectedTickets: items,
      selectedMembership: includeMembership
        ? { planId: selectedPlanId, purchaseType }
        : { planId: "", purchaseType: "" },
      appliedDiscounts: preview.appliedDiscounts,
      pricePreview: preview,
      includeMembership,
      applyMemberBenefit,
      discountCode: discountCode || "",
      membershipDetected: preview.memberDetection.isActive,
      membershipSource: preview.membershipSource || preview.memberDetection.source || "",
      membershipStatus: preview.memberDetection.status || "",
      membershipType: preview.memberDetection.membershipType || "",
      memberUntil: preview.memberDetection.memberUntil || "",
      ticketTailorMembershipId: preview.memberDetection.membership?.membershipNumber || "",
      requiresLogin: preview.memberDetection.requiresLogin || false,
      membershipBenefitApplied: preview.membershipBenefitApplied,
      membershipDiscountAmount: preview.discountResult?.memberDiscountMinor || 0,
      membershipDiscountRule: preview.memberDetection.discountRule || null,
      membershipDetectionResult: preview.memberDetection,
      expiresAt,
    },
    { upsert: true, new: true }
  );

  return { sessionId: sid, preview, expiresAt };
}

export async function getSession(sessionId) {
  const session = await CheckoutSession.findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) {
    const err = new Error("Checkout session expired or not found.");
    err.status = 404;
    throw err;
  }
  return session;
}

export async function saveCheckoutBeforeLogin({
  sessionId,
  eventId,
  eventSlug = "",
  userId = null,
  email = "",
  items = [],
  attendeeDetails = {},
  discountCode = "",
  referralCode = "",
  membershipCode = "",
  memberDetection = null,
  returnStep = 3,
  includeMembership = false,
  selectedPlanId = null,
  purchaseType = "NEW",
  applyMemberBenefit = true,
}) {
  const sid = sessionId || generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  console.log("[LOGIN_REDIRECT_STARTED] sessionId=%s eventId=%s", sid, eventId);
  console.log("[CHECKOUT_SESSION_SAVED_BEFORE_LOGIN] sessionId=%s", sid);

  await CheckoutSession.findOneAndUpdate(
    { sessionId: sid },
    {
      sessionId: sid,
      userId: userId || null,
      email: String(email || attendeeDetails.email || "").toLowerCase(),
      eventId,
      eventSlug,
      selectedTickets: items,
      attendeeDetails: {
        firstName: attendeeDetails.firstName || "",
        lastName: attendeeDetails.lastName || "",
        email: String(attendeeDetails.email || email || "").toLowerCase(),
        phone: attendeeDetails.phone || "",
      },
      detectedMemberStatus: memberDetection?.status || "GUEST_UNKNOWN",
      membershipDetectionResult: memberDetection || null,
      includeMembership,
      selectedMembership: includeMembership
        ? { planId: selectedPlanId || "", purchaseType }
        : { planId: "", purchaseType: "" },
      discountCode: discountCode || "",
      referralCode: referralCode || "",
      membershipCode: membershipCode || "",
      applyMemberBenefit,
      returnStep,
      expiresAt,
    },
    { upsert: true, new: true }
  );

  await logCheckoutAction({
    action: CHECKOUT_AUDIT_ACTIONS.CHECKOUT_SESSION_SAVED_BEFORE_LOGIN,
    sessionId: sid,
    userId,
    email,
    eventId,
    memberStatus: memberDetection?.status || "",
    details: { eventSlug, returnStep },
  });

  const returnPath = eventSlug
    ? `/events/${eventSlug}/tickets?checkoutSessionId=${sid}`
    : `/events/${eventId}/tickets?checkoutSessionId=${sid}`;

  console.log("[LOGIN_REDIRECT_URL_BUILT] url=%s", returnPath);

  return { sessionId: sid, returnPath, expiresAt };
}

export async function restoreCheckoutSession(sessionId) {
  const session = await getSession(sessionId);
  console.log("[CHECKOUT_SESSION_RESTORED_AFTER_LOGIN] sessionId=%s", sessionId);

  await logCheckoutAction({
    action: CHECKOUT_AUDIT_ACTIONS.CHECKOUT_SESSION_RESTORED_AFTER_LOGIN,
    sessionId,
    userId: session.userId,
    email: session.email,
    eventId: session.eventId,
    memberStatus: session.detectedMemberStatus,
  });

  return {
    sessionId: session.sessionId,
    eventId: session.eventId?.toString?.() || session.eventId,
    eventSlug: session.eventSlug || "",
    email: session.email,
    items: session.selectedTickets || [],
    attendeeDetails: session.attendeeDetails || {},
    discountCode: session.discountCode || "",
    referralCode: session.referralCode || "",
    membershipCode: session.membershipCode || "",
    memberDetection: session.membershipDetectionResult || null,
    includeMembership: session.includeMembership,
    selectedPlanId: session.selectedMembership?.planId || null,
    purchaseType: session.selectedMembership?.purchaseType || "NEW",
    applyMemberBenefit: session.applyMemberBenefit !== false,
    returnStep: session.returnStep || 3,
    pricePreview: session.pricePreview || null,
  };
}

export async function applyMemberBenefitsAfterLogin({ sessionId, userId, email }) {
  const session = await getSession(sessionId);
  const checkoutEmail = email || session.email || session.attendeeDetails?.email || "";

  console.log("[AUTH_CALLBACK_RECEIVED] sessionId=%s userId=%s", sessionId, userId);

  const detection = await detectMemberForCheckout({
    userId,
    email: checkoutEmail,
    isLoggedIn: true,
    sessionId,
    membershipCode: session.membershipCode || null,
  });

  const items = session.selectedTickets || [];
  const includeMembership = session.includeMembership;
  const selectedPlanId = session.selectedMembership?.planId || null;
  const purchaseType = session.selectedMembership?.purchaseType || "NEW";

  const result = await createOrUpdateSession({
    sessionId,
    eventId: session.eventId,
    userId,
    email: checkoutEmail,
    items,
    includeMembership,
    selectedPlanId,
    purchaseType,
    discountCode: session.discountCode || "",
    applyMemberBenefit: true,
    isLoggedIn: true,
  });

  await CheckoutSession.findOneAndUpdate(
    { sessionId },
    {
      userId,
      email: checkoutEmail,
      detectedMemberStatus: detection.status,
      membershipDetectionResult: detection,
      applyMemberBenefit: true,
    }
  );

  await logCheckoutAction({
    action: CHECKOUT_AUDIT_ACTIONS.MEMBER_DISCOUNT_APPLIED_AFTER_LOGIN,
    sessionId,
    userId,
    email: checkoutEmail,
    eventId: session.eventId,
    memberStatus: detection.status,
    details: { membershipType: detection.membershipType },
  });

  console.log("[MEMBER_DISCOUNT_APPLIED_AFTER_LOGIN] sessionId=%s status=%s", sessionId, detection.status);

  return {
    ...result,
    detection,
    messages: buildDetectionMessages(detection),
    restored: await restoreCheckoutSession(sessionId),
  };
}

export async function detectMemberForCheckout({ userId, email, isLoggedIn, sessionId, membershipCode = null }) {
  const detection = await detectMemberStatus({
    userId,
    email,
    isLoggedIn: Boolean(isLoggedIn && userId),
    membershipCode,
  });

  if (sessionId) {
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBER_STATUS_DETECTED,
      sessionId,
      userId,
      email,
      memberStatus: detection.status,
      details: { isActive: detection.isActive, isExpired: detection.isExpired },
    });

    if (detection.status === MEMBER_STATES.GUEST_EMAIL_ACTIVE_MEMBER) {
      await logCheckoutAction({
        action: CHECKOUT_AUDIT_ACTIONS.LOGIN_PROMPTED,
        sessionId,
        email,
        memberStatus: detection.status,
      });
    }
    if (detection.status === MEMBER_STATES.GUEST_EMAIL_EXPIRED_MEMBER) {
      await logCheckoutAction({
        action: CHECKOUT_AUDIT_ACTIONS.EXPIRED_RENEWAL_OFFERED,
        sessionId,
        email,
        memberStatus: detection.status,
      });
    }
  }

  const membershipSettings = await getMembershipCheckoutSettings();

  return {
    ...detection,
    settings: {
      allowPurchase: membershipSettings.allowPurchaseDuringTicketCheckout,
      allowRenewal: membershipSettings.allowRenewalDuringTicketCheckout,
    },
    messages: buildDetectionMessages(detection),
  };
}

function buildDetectionMessages(detection) {
  const membershipLabel = detection.membershipType || detection.membership?.planName || "membership";
  const validUntil = detection.memberUntil || detection.membership?.memberUntilFormatted || "";

  switch (detection.status) {
    case MEMBER_STATES.GUEST_EMAIL_ACTIVE_MEMBER:
      return {
        title: CUSTOMER_MEMBERSHIP_MESSAGES.activeFound,
        body: buildActiveMembershipFoundBody({
          membershipLabel,
          validUntil,
          requiresAccountLinking: detection.requiresAccountLinking,
        }),
        showLoginPrompt: true,
        showRenewalOption: false,
        showUpsell: false,
      };
    case MEMBER_STATES.LOGGED_IN_ACTIVE_MEMBER:
      return {
        title: CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied,
        body: buildActiveMembershipAppliedBody({ membershipLabel, validUntil }),
        showLoginPrompt: false,
        showRenewalOption: false,
        showUpsell: false,
      };
    case MEMBER_STATES.GUEST_EMAIL_EXPIRED_MEMBER:
    case MEMBER_STATES.LOGGED_IN_EXPIRED_MEMBER:
      return {
        title: "Membership Expired",
        body: `Your membership expired on ${validUntil || "the previous renewal date"}. Renew your membership with this booking to enjoy member benefits immediately.`,
        showLoginPrompt: false,
        showRenewalOption: true,
        showUpsell: false,
      };
    case MEMBER_STATES.GUEST_EMAIL_NON_MEMBER:
    case MEMBER_STATES.LOGGED_IN_NON_MEMBER:
      return {
        title: "Become a member",
        body: "Become a V.O.I.C.E. NL member and unlock exclusive discounts, priority access and member benefits.",
        showLoginPrompt: false,
        showRenewalOption: false,
        showUpsell: true,
      };
    default:
      return {
        title: "",
        body: "",
        showLoginPrompt: false,
        showRenewalOption: false,
        showUpsell: false,
      };
  }
}

export async function validateBundle({
  eventId,
  items,
  userId,
  email,
  isLoggedIn,
  includeMembership,
  selectedPlanId,
  purchaseType,
  discountCode,
  applyMemberBenefit,
}) {
  const event = await getPublishedEventBySlugOrId(eventId);
  const membershipSettings = await getMembershipCheckoutSettings();
  const detection = await detectMemberStatus({ userId, email, isLoggedIn: Boolean(isLoggedIn && userId) });

  if (includeMembership) {
    if (!event.checkoutSettings?.allowMembershipTicketBundle) {
      const err = new Error("Membership bundle is not available for this event.");
      err.status = 400;
      throw err;
    }
    if (!selectedPlanId) {
      const err = new Error("Select a membership plan.");
      err.status = 400;
      throw err;
    }
    const planId = resolvePlanId(selectedPlanId);
    if (!event.checkoutSettings?.eligibleMembershipTypes?.includes(planId)) {
      const err = new Error("This membership type is not available for this event.");
      err.status = 400;
      throw err;
    }
    if (!membershipSettings.availableMembershipTypes?.includes(planId)) {
      const err = new Error("This membership type is not available during checkout.");
      err.status = 400;
      throw err;
    }
    if (purchaseType === "RENEWAL" && !membershipSettings.allowRenewalDuringTicketCheckout) {
      const err = new Error("Membership renewal during ticket checkout is not enabled.");
      err.status = 400;
      throw err;
    }
    if (purchaseType === "NEW" && !membershipSettings.allowPurchaseDuringTicketCheckout) {
      const err = new Error("Membership purchase during ticket checkout is not enabled.");
      err.status = 400;
      throw err;
    }
    if (
      detection.isActive &&
      purchaseType === "NEW" &&
      !includeMembership
    ) {
      const err = new Error("You already have an active membership.");
      err.status = 400;
      throw err;
    }
  }

  if (
    detection.isActive &&
    !isLoggedIn &&
    applyMemberBenefit &&
    !includeMembership
  ) {
    const err = new Error(
      "Please log in to apply your member discount, or continue without member benefits."
    );
    err.status = 400;
    err.code = "MEMBER_LOGIN_REQUIRED";
    throw err;
  }

  if (
    detection.isExpired &&
    applyMemberBenefit &&
    !includeMembership
  ) {
    const err = new Error(
      "Renew your membership to apply member benefits, or continue with tickets only."
    );
    err.status = 400;
    err.code = "MEMBER_RENEWAL_REQUIRED";
    throw err;
  }

  return true;
}

export async function createBundleCheckout(eventId, payload, userId) {
  const {
    items,
    attendeeFirstName,
    attendeeLastName,
    attendeeEmail,
    attendeePhone,
    voucherCode,
    discountCode,
    termsAccepted,
    includeMembership = false,
    selectedPlanId = null,
    purchaseType = "NEW",
    applyMemberBenefit = true,
    sessionId = null,
  } = payload;

  const code = discountCode || voucherCode;
  const email = attendeeEmail?.trim().toLowerCase();
  const isLoggedIn = Boolean(userId);

  if (!attendeeFirstName?.trim() || !attendeeLastName?.trim() || !email) {
    const err = new Error("Attendee first name, last name, and email are required.");
    err.status = 400;
    throw err;
  }
  if (!termsAccepted) {
    const err = new Error("You must accept the terms and conditions.");
    err.status = 400;
    throw err;
  }

  await validateBundle({
    eventId,
    items,
    userId,
    email,
    isLoggedIn,
    includeMembership,
    selectedPlanId,
    purchaseType: includeMembership ? purchaseType : "NEW",
    discountCode: code,
    applyMemberBenefit,
  });

  console.log("[CHECKOUT_PAYMENT_STARTED]", {
    email,
    eventId,
    includeMembership,
    applyMemberBenefit,
    isLoggedIn,
  });

  if (sessionId) {
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.CHECKOUT_PAYMENT_STARTED,
      sessionId,
      userId,
      email,
      eventId,
    });
  }

  const preview = await calculatePricePreview({
    eventId,
    items,
    userId,
    email,
    isLoggedIn,
    includeMembership,
    selectedPlanId,
    purchaseType: includeMembership ? purchaseType : "NEW",
    discountCode: code,
    applyMemberBenefit,
    sessionId,
  });

  const orderNumber = await buildOrderNumber();
  const orderType = includeMembership ? "TICKET_AND_MEMBERSHIP" : "TICKET_ONLY";

  const enrichedLineItems = preview.ticketPricing.lineItems.map((li) => ({
    ...li,
    originalPriceMinor: li.originalPriceMinor || li.unitPriceMinor * li.quantity,
    eventDiscountMinor: 0,
    memberDiscountMinor: 0,
    finalPriceMinor: li.unitPriceMinor * li.quantity,
  }));

  const membershipItems = includeMembership && preview.membershipPricing
    ? [
        {
          membershipType: preview.membershipPricing.membershipType,
          planId: preview.membershipPricing.planId,
          purchaseType: purchaseType === "RENEWAL" ? "RENEWAL" : "NEW",
          originalPriceMinor: preview.membershipPricing.originalPriceMinor,
          membershipDiscountMinor: preview.membershipPricing.membershipDiscountMinor,
          finalPriceMinor: preview.membershipPricing.finalPriceMinor,
          memberUntil: preview.membershipPricing.memberUntil,
        },
      ]
    : [];

  const order = await TicketOrder.create({
    orderNumber,
    orderType,
    userId: userId || null,
    eventId: preview.event.id,
    attendeeFirstName: attendeeFirstName.trim(),
    attendeeLastName: attendeeLastName.trim(),
    attendeeEmail: email,
    attendeePhone: String(attendeePhone || "").trim(),
    lineItems: enrichedLineItems,
    membershipItems,
    appliedDiscounts: preview.appliedDiscounts,
    memberStatusAtCheckout: preview.memberDetection.status,
    membershipSourceAtCheckout: preview.membershipSource || preview.memberDetection.source || "",
    membershipTypeAtCheckout: preview.memberDetection.membershipType || "",
    membershipBenefitApplied: preview.membershipBenefitApplied,
    membershipBenefitReason: preview.membershipBenefitReason,
    membershipDiscountAmount: preview.discountResult.memberDiscountMinor,
    subtotalMinor: preview.ticketPricing.subtotalMinor,
    discountAmountMinor: preview.discountResult.discountAmountMinor,
    membershipDiscountMinor: preview.discountResult.memberDiscountMinor,
    voucherDiscountMinor:
      preview.discountResult.voucherDiscountMinor + preview.discountResult.personalDiscountMinor,
    referralDiscountMinor: preview.discountResult.referralDiscountMinor,
    personalDiscountMinor: preview.discountResult.personalDiscountMinor,
    bookingFeeMinor: preview.summary.bookingFeeMinor,
    vatAmountMinor: preview.summary.vatAmountMinor,
    totalAmountMinor: preview.combined.grandTotalMinor,
    totalSavingsMinor: preview.combined.totalSavingsMinor,
    voucherCode: preview.discountResult.codeRule?.isLegacyVoucher
      ? preview.discountResult.codeRule.code
      : "",
    discountCode:
      preview.discountResult.codeRule && !preview.discountResult.codeRule.isLegacyVoucher
        ? preview.discountResult.codeRule.code
        : "",
    referralCode:
      preview.discountResult.codeRule?.type === "referral_code"
        ? preview.discountResult.codeRule.code
        : "",
    discountRuleId:
      preview.discountResult.codeRule?.id || preview.discountResult.codeRule?._id || null,
    memberDiscountRuleId:
      preview.discountResult.memberRule?.id || preview.discountResult.memberRule?._id || null,
    membershipDiscountPercent:
      preview.discountResult.memberRule?.discountType === "percentage"
        ? preview.discountResult.memberRule.discountValue
        : 0,
    paymentStatus: "pending",
    termsAccepted: true,
  });

  const payment = await createTicketPaymentIntent({
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    amountMinor: order.totalAmountMinor,
    eventTitle: preview.event.title,
    orderType,
    includeMembership,
    membershipPlanId: selectedPlanId || "",
  });

  if (order.totalAmountMinor <= 0) {
    return {
      order: formatBundleOrder(order),
      payment: { mode: "free", paymentIntentId: null, clientSecret: null, amountMinor: 0 },
      preview,
      requiresFreeCompletion: true,
      summary: {
        ...preview.summary,
        membershipTotalMinor: preview.combined.membershipTotalMinor,
        grandTotalMinor: 0,
        total: formatMoney(0),
      },
    };
  }

  order.paymentIntentId = payment.paymentIntentId;
  await order.save();

  if (sessionId) {
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.COMBINED_ORDER_CREATED,
      sessionId,
      orderId: order.orderNumber,
      userId,
      email,
      eventId: preview.event.id,
      memberStatus: preview.memberDetection.status,
      details: { orderType, grandTotalMinor: order.totalAmountMinor },
    });
  }

  if (preview.membershipBenefitApplied) {
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBER_DISCOUNT_APPLIED,
      sessionId: sessionId || "",
      orderId: order.orderNumber,
      userId,
      email,
      details: { reason: preview.membershipBenefitReason },
    });
  }

  return {
    order: formatBundleOrder(order),
    payment,
    preview,
    summary: {
      ...preview.summary,
      membershipTotalMinor: preview.combined.membershipTotalMinor,
      grandTotalMinor: preview.combined.grandTotalMinor,
      total: formatMoney(preview.combined.grandTotalMinor),
    },
  };
}

export function formatBundleOrder(order) {
  if (!order) return null;
  return {
    id: order._id?.toString() || order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType || "TICKET_ONLY",
    userId: order.userId?.toString?.() || order.userId || null,
    eventId: order.eventId?.toString?.() || order.eventId,
    attendeeFirstName: order.attendeeFirstName,
    attendeeLastName: order.attendeeLastName,
    attendeeEmail: order.attendeeEmail,
    attendeePhone: order.attendeePhone,
    attendeeName: `${order.attendeeFirstName} ${order.attendeeLastName}`.trim(),
    lineItems: order.lineItems,
    membershipItems: order.membershipItems || [],
    appliedDiscounts: order.appliedDiscounts || [],
    memberStatusAtCheckout: order.memberStatusAtCheckout,
    membershipBenefitApplied: order.membershipBenefitApplied,
    totalSavingsMinor: order.totalSavingsMinor || 0,
    subtotalMinor: order.subtotalMinor,
    discountAmountMinor: order.discountAmountMinor,
    bookingFeeMinor: order.bookingFeeMinor,
    vatAmountMinor: order.vatAmountMinor,
    totalAmountMinor: order.totalAmountMinor,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    subtotal: formatMoney(order.subtotalMinor),
    discount: formatMoney(order.discountAmountMinor),
    bookingFee: formatMoney(order.bookingFeeMinor),
    vat: formatMoney(order.vatAmountMinor),
    total: formatMoney(order.totalAmountMinor),
    totalSavings: formatMoney(order.totalSavingsMinor || 0),
    orderStatus: order.orderStatus || "PENDING",
    isFreeBooking: order.paymentStatus === "free" || order.totalAmountMinor <= 0,
  };
}

export async function completeFreeOrder(eventId, payload, userId) {
  const {
    items,
    attendeeFirstName,
    attendeeLastName,
    attendeeEmail,
    attendeePhone,
    voucherCode,
    discountCode,
    termsAccepted,
    includeMembership = false,
    selectedPlanId = null,
    purchaseType = "NEW",
    applyMemberBenefit = true,
    sessionId = null,
  } = payload;

  const code = discountCode || voucherCode;
  const email = attendeeEmail?.trim().toLowerCase();
  const isLoggedIn = Boolean(userId);

  if (!attendeeFirstName?.trim() || !attendeeLastName?.trim() || !email) {
    const err = new Error("Attendee first name, last name, and email are required.");
    err.status = 400;
    throw err;
  }
  if (!termsAccepted) {
    const err = new Error("You must accept the terms and conditions.");
    err.status = 400;
    throw err;
  }

  await logCheckoutAction({
    action: CHECKOUT_AUDIT_ACTIONS.ZERO_VALUE_ORDER_STARTED,
    sessionId: sessionId || "",
    userId,
    email,
    eventId,
  });

  await validateBundle({
    eventId,
    items,
    userId,
    email,
    isLoggedIn,
    includeMembership,
    selectedPlanId,
    purchaseType: includeMembership ? purchaseType : "NEW",
    discountCode: code,
    applyMemberBenefit,
  });

  const preview = await calculatePricePreview({
    eventId,
    items,
    userId,
    email,
    isLoggedIn,
    includeMembership,
    selectedPlanId,
    purchaseType: includeMembership ? purchaseType : "NEW",
    discountCode: code,
    applyMemberBenefit,
    sessionId,
  });

  if (preview.combined.grandTotalMinor > 0) {
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.DISCOUNT_REJECTED,
      sessionId: sessionId || "",
      userId,
      email,
      eventId: preview.event.id,
      details: {
        reason: "grand_total_not_zero",
        grandTotalMinor: preview.combined.grandTotalMinor,
      },
    });
    const err = new Error(
      "This booking requires payment. The total is no longer €0.00 — please refresh and try again."
    );
    err.status = 400;
    throw err;
  }

  await logCheckoutAction({
    action: CHECKOUT_AUDIT_ACTIONS.ZERO_VALUE_ORDER_VALIDATED,
    sessionId: sessionId || "",
    userId,
    email,
    eventId: preview.event.id,
    details: { grandTotalMinor: 0, appliedDiscounts: preview.appliedDiscounts },
  });

  const orderNumber = await buildOrderNumber();
  const orderType = includeMembership ? "TICKET_AND_MEMBERSHIP" : "TICKET_ONLY";

  const enrichedLineItems = preview.ticketPricing.lineItems.map((li) => ({
    ...li,
    originalPriceMinor: li.originalPriceMinor || li.unitPriceMinor * li.quantity,
    eventDiscountMinor: 0,
    memberDiscountMinor: 0,
    finalPriceMinor: li.unitPriceMinor * li.quantity,
  }));

  const membershipItems =
    includeMembership && preview.membershipPricing
      ? [
          {
            membershipType: preview.membershipPricing.membershipType,
            planId: preview.membershipPricing.planId,
            purchaseType: purchaseType === "RENEWAL" ? "RENEWAL" : "NEW",
            originalPriceMinor: preview.membershipPricing.originalPriceMinor,
            membershipDiscountMinor: preview.membershipPricing.membershipDiscountMinor,
            finalPriceMinor: preview.membershipPricing.finalPriceMinor,
            memberUntil: preview.membershipPricing.memberUntil,
          },
        ]
      : [];

  const order = await TicketOrder.create({
    orderNumber,
    orderType,
    userId: userId || null,
    eventId: preview.event.id,
    attendeeFirstName: attendeeFirstName.trim(),
    attendeeLastName: attendeeLastName.trim(),
    attendeeEmail: email,
    attendeePhone: String(attendeePhone || "").trim(),
    lineItems: enrichedLineItems,
    membershipItems,
    appliedDiscounts: preview.appliedDiscounts,
    memberStatusAtCheckout: preview.memberDetection.status,
    membershipSourceAtCheckout: preview.membershipSource || preview.memberDetection.source || "",
    membershipTypeAtCheckout: preview.memberDetection.membershipType || "",
    membershipBenefitApplied: preview.membershipBenefitApplied,
    membershipBenefitReason: preview.membershipBenefitReason,
    membershipDiscountAmount: preview.discountResult.memberDiscountMinor,
    subtotalMinor: preview.ticketPricing.subtotalMinor,
    discountAmountMinor: preview.discountResult.discountAmountMinor,
    membershipDiscountMinor: preview.discountResult.memberDiscountMinor,
    voucherDiscountMinor:
      preview.discountResult.voucherDiscountMinor + preview.discountResult.personalDiscountMinor,
    referralDiscountMinor: preview.discountResult.referralDiscountMinor,
    personalDiscountMinor: preview.discountResult.personalDiscountMinor,
    bookingFeeMinor: preview.summary.bookingFeeMinor,
    vatAmountMinor: preview.summary.vatAmountMinor,
    totalAmountMinor: 0,
    totalSavingsMinor: preview.combined.totalSavingsMinor,
    voucherCode: preview.discountResult.codeRule?.isLegacyVoucher
      ? preview.discountResult.codeRule.code
      : "",
    discountCode:
      preview.discountResult.codeRule && !preview.discountResult.codeRule.isLegacyVoucher
        ? preview.discountResult.codeRule.code
        : "",
    referralCode:
      preview.discountResult.codeRule?.type === "referral_code"
        ? preview.discountResult.codeRule.code
        : "",
    discountRuleId:
      preview.discountResult.codeRule?.id || preview.discountResult.codeRule?._id || null,
    memberDiscountRuleId:
      preview.discountResult.memberRule?.id || preview.discountResult.memberRule?._id || null,
    membershipDiscountPercent:
      preview.discountResult.memberRule?.discountType === "percentage"
        ? preview.discountResult.memberRule.discountValue
        : 0,
    paymentStatus: "pending",
    orderStatus: "PENDING",
    termsAccepted: true,
  });

  const { fulfillOrder } = await import("./postPaymentFulfillmentService.js");
  const result = await fulfillOrder(order._id.toString(), null, { isFreeOrder: true });

  return {
    ...result,
    preview,
    isFreeBooking: true,
  };
}
