import crypto from "crypto";
import { getPlan, resolvePlanId } from "../config/membershipPlans.js";
import { DEFAULT_EVENT_CHECKOUT_SETTINGS } from "../config/checkoutDefaults.js";
import { getPublishedEventBySlugOrId } from "./eventService.js";
import { detectMemberStatus, MEMBER_STATES } from "./memberDetectionService.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";
import {
  applyDiscountsToOrder,
  calculateDiscountAmount,
} from "./discountService.js";
import { buildOrderSummary, formatMoney } from "./ticketPricingService.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "./checkoutAuditService.js";

function getEventCheckoutSettings(event) {
  return { ...DEFAULT_EVENT_CHECKOUT_SETTINGS, ...(event.checkoutSettings || {}) };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function buildTicketLineItems(event, items) {
  const lineItems = [];
  let subtotalMinor = 0;

  for (const item of items || []) {
    const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!tt) {
      const err = new Error("Invalid ticket type selected.");
      err.status = 400;
      throw err;
    }
    if (tt.status === "sold_out") {
      const err = new Error(`${tt.name} is sold out.`);
      err.status = 400;
      throw err;
    }

    const qty = Math.max(1, Number(item.quantity) || 1);
    if (qty > tt.maxPerOrder) {
      const err = new Error(`Maximum ${tt.maxPerOrder} tickets per order for ${tt.name}.`);
      err.status = 400;
      throw err;
    }
    if (qty > tt.available) {
      const err = new Error(`Only ${tt.available} tickets available for ${tt.name}.`);
      err.status = 400;
      throw err;
    }

    const lineTotal = tt.priceMinor * qty;
    subtotalMinor += lineTotal;
    lineItems.push({
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      quantity: qty,
      unitPriceMinor: tt.priceMinor,
      originalPriceMinor: lineTotal,
    });
  }

  if (!lineItems.length) {
    const err = new Error("Select at least one ticket.");
    err.status = 400;
    throw err;
  }

  return { lineItems, subtotalMinor };
}

function resolveMemberBenefitContext({
  memberDetection,
  includeMembership,
  selectedPlanId,
  purchaseType,
  eventSettings,
  membershipSettings,
  applyMemberBenefit,
  isLoggedIn,
}) {
  const instantAllowed =
    eventSettings.allowInstantMembershipBenefit &&
    membershipSettings.instantBenefitRules?.applyToCurrentTicketPurchase;

  let memberPlanId = null;
  let benefitReason = "";
  let benefitApplied = false;

  if (isLoggedIn && memberDetection.isActive && eventSettings.enableMemberDiscount) {
    if (applyMemberBenefit !== false) {
      memberPlanId = memberDetection.membership?.planId;
      benefitReason = "active_member_logged_in";
      benefitApplied = Boolean(memberPlanId);
    }
  } else if (
    includeMembership &&
    selectedPlanId &&
    instantAllowed &&
    eventSettings.allowMembershipTicketBundle &&
    eventSettings.enableMemberDiscount
  ) {
    memberPlanId = resolvePlanId(selectedPlanId);
    benefitReason = purchaseType === "RENEWAL" ? "instant_benefit_renewal" : "instant_benefit_new";
    benefitApplied = true;
  }

  return { memberPlanId, benefitReason, benefitApplied };
}

export function calculateMembershipPrice(planId, membershipSettings) {
  const plan = getPlan(planId);
  if (!plan) {
    const err = new Error("Invalid membership plan.");
    err.status = 400;
    throw err;
  }

  const originalPriceMinor = plan.feeMinor;
  const discountPercent = membershipSettings.membershipCheckoutDiscountPercent || 0;
  const membershipDiscountMinor = Math.round(originalPriceMinor * (discountPercent / 100));
  const finalPriceMinor = Math.max(0, originalPriceMinor - membershipDiscountMinor);

  return {
    planId: plan.id,
    membershipType: plan.name,
    originalPriceMinor,
    membershipDiscountMinor,
    finalPriceMinor,
    memberUntil: addDays(new Date(), plan.durationDays || 365),
    benefits: plan.benefits || [],
    durationLabel: `${plan.durationYears || 1} year`,
    regularPrice: formatMoney(originalPriceMinor),
    discountedPrice: formatMoney(finalPriceMinor),
  };
}

export async function calculatePricePreview({
  eventId,
  items,
  userId,
  email,
  isLoggedIn = false,
  includeMembership = false,
  selectedPlanId = null,
  purchaseType = "NEW",
  discountCode = null,
  applyMemberBenefit = true,
  sessionId = null,
}) {
  const event = await getPublishedEventBySlugOrId(eventId);
  const eventSettings = getEventCheckoutSettings(event);
  const membershipSettings = await getMembershipCheckoutSettings();

  const { lineItems, subtotalMinor } = await buildTicketLineItems(event, items);

  const memberDetection = await detectMemberStatus({
    userId,
    email,
    isLoggedIn: Boolean(isLoggedIn && userId),
  });

  const { memberPlanId, benefitReason, benefitApplied } = resolveMemberBenefitContext({
    memberDetection,
    includeMembership,
    selectedPlanId,
    purchaseType,
    eventSettings,
    membershipSettings,
    applyMemberBenefit,
    isLoggedIn,
  });

  const allowStacking =
    eventSettings.allowDiscountStacking &&
    (membershipSettings.instantBenefitRules?.allowWithCodeDiscounts !== false ||
      !includeMembership);

  const discountResult = await applyDiscountsToOrder({
    userId: benefitApplied && isLoggedIn ? userId : null,
    email,
    eventId: event.id,
    orderType: "tickets",
    subtotalMinor,
    discountCode,
    voucherCode: discountCode,
    memberPlanId: benefitApplied ? memberPlanId : null,
    allowStacking,
  });

  const ticketSummary = buildOrderSummary({
    subtotalMinor,
    bookingFeeMinor: event.bookingFeeMinor || 0,
    membershipDiscountMinor: discountResult.memberDiscountMinor,
    voucherDiscountMinor: discountResult.voucherDiscountMinor,
    referralDiscountMinor: discountResult.referralDiscountMinor,
    personalDiscountMinor: discountResult.personalDiscountMinor,
  });

  let membershipPricing = null;
  let membershipTotalMinor = 0;

  if (includeMembership && selectedPlanId) {
    membershipPricing = calculateMembershipPrice(selectedPlanId, membershipSettings);
    membershipTotalMinor = membershipPricing.finalPriceMinor;
  }

  const grandTotalMinor = ticketSummary.totalAmountMinor + membershipTotalMinor;
  const totalSavingsMinor = discountResult.discountAmountMinor;

  const withoutMembershipSummary = buildOrderSummary({
    subtotalMinor,
    bookingFeeMinor: event.bookingFeeMinor || 0,
    membershipDiscountMinor: 0,
    voucherDiscountMinor: 0,
    referralDiscountMinor: 0,
    personalDiscountMinor: 0,
  });

  const withMembershipTicketSummary = includeMembership && selectedPlanId && benefitApplied
    ? ticketSummary
    : null;

  const comparison = eventSettings.showPriceComparisonPreview
    ? {
        withoutMembership: {
          ticketTotal: formatMoney(withoutMembershipSummary.totalAmountMinor),
          ticketTotalMinor: withoutMembershipSummary.totalAmountMinor,
          membershipTotal: formatMoney(0),
          grandTotal: formatMoney(withoutMembershipSummary.totalAmountMinor),
          grandTotalMinor: withoutMembershipSummary.totalAmountMinor,
          savings: formatMoney(0),
        },
        withMembership: includeMembership && selectedPlanId
          ? {
              membershipTotal: formatMoney(membershipTotalMinor),
              membershipTotalMinor,
              ticketTotal: formatMoney(
                withMembershipTicketSummary?.totalAmountMinor ?? ticketSummary.totalAmountMinor
              ),
              ticketTotalMinor:
                withMembershipTicketSummary?.totalAmountMinor ?? ticketSummary.totalAmountMinor,
              grandTotal: formatMoney(grandTotalMinor),
              grandTotalMinor,
              savings: formatMoney(
                Math.max(
                  0,
                  withoutMembershipSummary.totalAmountMinor +
                    membershipTotalMinor -
                    grandTotalMinor
                )
              ),
              savingsMinor: Math.max(
                0,
                withoutMembershipSummary.totalAmountMinor + membershipTotalMinor - grandTotalMinor
              ),
            }
          : null,
      }
    : null;

  const appliedDiscounts = [];
  if (discountResult.memberDiscountMinor > 0) {
    appliedDiscounts.push({
      type: "member",
      label: discountResult.memberLabel || "Member Discount",
      amountMinor: discountResult.memberDiscountMinor,
      ruleId: discountResult.memberRule?.id || null,
    });
  }
  if (discountResult.voucherDiscountMinor > 0) {
    appliedDiscounts.push({
      type: "voucher",
      label: discountResult.codeLabel || "Voucher Discount",
      amountMinor: discountResult.voucherDiscountMinor,
      ruleId: discountResult.codeRule?.id || null,
    });
  }
  if (discountResult.referralDiscountMinor > 0) {
    appliedDiscounts.push({
      type: "referral",
      label: discountResult.codeLabel || "Referral Discount",
      amountMinor: discountResult.referralDiscountMinor,
      ruleId: discountResult.codeRule?.id || null,
    });
  }
  if (discountResult.personalDiscountMinor > 0) {
    appliedDiscounts.push({
      type: "campaign",
      label: discountResult.codeLabel || "Discount",
      amountMinor: discountResult.personalDiscountMinor,
      ruleId: discountResult.codeRule?.id || null,
    });
  }

  const preview = {
    event: {
      id: event.id,
      title: event.title,
      checkoutSettings: eventSettings,
    },
    memberDetection: {
      status: memberDetection.status,
      isActive: memberDetection.isActive,
      isExpired: memberDetection.isExpired,
      requiresLogin: memberDetection.status === MEMBER_STATES.GUEST_EMAIL_ACTIVE_MEMBER,
      membership: memberDetection.membership
        ? {
            planId: memberDetection.membership.planId,
            planName: memberDetection.membership.planName,
            endsAt: memberDetection.membership.endsAt,
            membershipNumber: memberDetection.membership.membershipNumber,
          }
        : null,
    },
    ticketPricing: {
      lineItems,
      subtotalMinor,
      subtotal: formatMoney(subtotalMinor),
      eventDiscountMinor: 0,
      memberDiscountMinor: discountResult.memberDiscountMinor,
      memberDiscount: formatMoney(discountResult.memberDiscountMinor),
      voucherDiscountMinor:
        discountResult.voucherDiscountMinor + discountResult.personalDiscountMinor,
      voucherDiscount: formatMoney(
        discountResult.voucherDiscountMinor + discountResult.personalDiscountMinor
      ),
      referralDiscountMinor: discountResult.referralDiscountMinor,
      referralDiscount: formatMoney(discountResult.referralDiscountMinor),
      bookingFeeMinor: ticketSummary.bookingFeeMinor,
      bookingFee: formatMoney(ticketSummary.bookingFeeMinor),
      vatAmountMinor: ticketSummary.vatAmountMinor,
      vat: formatMoney(ticketSummary.vatAmountMinor),
      totalMinor: ticketSummary.totalAmountMinor,
      total: formatMoney(ticketSummary.totalAmountMinor),
    },
    membershipPricing,
    combined: {
      ticketTotalMinor: ticketSummary.totalAmountMinor,
      ticketTotal: formatMoney(ticketSummary.totalAmountMinor),
      membershipTotalMinor,
      membershipTotal: formatMoney(membershipTotalMinor),
      grandTotalMinor,
      grandTotal: formatMoney(grandTotalMinor),
      totalSavingsMinor,
      totalSavings: formatMoney(totalSavingsMinor),
      savingsMessage:
        totalSavingsMinor > 0 ? `You save ${formatMoney(totalSavingsMinor)} with this option.` : "",
    },
    membershipBenefitApplied: benefitApplied,
    membershipBenefitReason: benefitReason,
    memberDiscountLabel: discountResult.memberLabel || "",
    codeDiscountLabel: discountResult.codeLabel || "",
    appliedDiscounts,
    comparison,
    discountResult,
    summary: ticketSummary,
  };

  if (sessionId) {
    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.PRICE_PREVIEW_GENERATED,
      sessionId,
      userId,
      email,
      eventId: event.id,
      memberStatus: memberDetection.status,
      details: { grandTotalMinor, includeMembership, selectedPlanId },
    });
  }

  return preview;
}

export async function getAvailableMembershipPlans(eventId) {
  const event = await getPublishedEventBySlugOrId(eventId);
  const eventSettings = getEventCheckoutSettings(event);
  const membershipSettings = await getMembershipCheckoutSettings();

  const eligible = eventSettings.eligibleMembershipTypes || [];
  const available = membershipSettings.availableMembershipTypes || [];

  const planIds = eligible.filter((id) => available.includes(id));

  return planIds.map((planId) => {
    const plan = getPlan(planId);
    const pricing = calculateMembershipPrice(planId, membershipSettings);
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      benefits: plan.benefits,
      ...pricing,
    };
  });
}

export function generateSessionId() {
  return `chk_${crypto.randomUUID().replace(/-/g, "")}`;
}
