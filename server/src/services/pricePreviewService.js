import crypto from "crypto";
import { getPlan, resolvePlanId } from "../config/membershipPlans.js";
import { DEFAULT_EVENT_CHECKOUT_SETTINGS } from "../config/checkoutDefaults.js";
import { getPublishedEventBySlugOrId } from "./eventService.js";
import { detectMemberStatus, MEMBER_STATES } from "./memberDetectionService.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";
import { MEMBERSHIP_SOURCE } from "./membershipDetectionService.js";
import { getMembershipDiscountCapStatus } from "./membershipTicketCapService.js";
import {
  CUSTOMER_MEMBERSHIP_MESSAGES,
  sanitizeCustomerDiscountLabel,
} from "../utils/membershipDisplayLabels.js";
import {
  applyDiscountsToOrderLines,
  calculateDiscountAmount,
  getMembershipDiscountRule,
} from "./discountService.js";
import { buildOrderSummary, formatMoney } from "./ticketPricingService.js";
import { validateTicketLineItems } from "./ticketTypeAdminService.js";
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
  return validateTicketLineItems(event, items);
}

async function resolveMemberBenefitContext({
  memberDetection,
  includeMembership,
  selectedPlanId,
  purchaseType,
  eventSettings,
  membershipSettings,
  applyMemberBenefit,
  isLoggedIn,
  eventId,
  ticketTypeId = null,
  subtotalMinor,
  // The per-event membership discount redemption cap (see membershipTicketCapService.js)
  // applies identically whether or not the customer is logged in — once it's on, logging
  // in doesn't unlock a bigger discount than a guest already gets, so it widens this gate
  // rather than being a separate branch. false preserves today's exact behavior.
  capFeatureEnabled = false,
  // True when this line has quantity > 0 but the redemption cap left zero eligible units —
  // distinguishes "no discount because you already used your cap" from "no discount because
  // this membership type has no rule configured," which otherwise produce the identical
  // subtotalMinor === 0 code path below.
  cappedToZero = false,
  capLimit = null,
}) {
  const instantAllowed =
    eventSettings.allowInstantMembershipBenefit &&
    membershipSettings.instantBenefitRules?.applyToCurrentTicketPurchase;

  let memberPlanId = null;
  let benefitReason = "";
  let benefitApplied = false;
  let memberRuleOverride = null;
  let membershipSource = memberDetection.source || memberDetection.membershipSource || "LOCAL";
  let discountWarning = null;
  let previewAmount = 0;

  const membershipType =
    memberDetection.membershipType ||
    memberDetection.membership?.planName ||
    "";
  const rawPlanId = memberDetection.membership?.planId || memberDetection.normalizedPlanId || null;

  const isTicketTailorActive =
    memberDetection.isActive &&
    (membershipSource === MEMBERSHIP_SOURCE.TICKETTAILOR ||
      memberDetection.membership?.source === MEMBERSHIP_SOURCE.TICKETTAILOR);

  const canApplyWithoutLogin =
    isTicketTailorActive &&
    membershipSettings.requireLoginForTicketTailorBenefits === false;

  if (
    memberDetection.isActive &&
    eventSettings.enableMemberDiscount &&
    applyMemberBenefit !== false
  ) {
    if (isLoggedIn || canApplyWithoutLogin || capFeatureEnabled) {
      memberPlanId = rawPlanId;

      if (isTicketTailorActive && membershipSettings.applyTicketTailorMembershipDiscounts !== false) {
        membershipSource = MEMBERSHIP_SOURCE.TICKETTAILOR;
        memberRuleOverride = await getMembershipDiscountRule({
          planId: rawPlanId,
          membershipType,
          source: MEMBERSHIP_SOURCE.TICKETTAILOR,
          eventId,
          ticketTypeId,
          orderType: "tickets",
          settings: membershipSettings,
        });
        benefitReason = "tickettailor_active_member";
      } else if (memberPlanId || membershipType) {
        memberRuleOverride = await getMembershipDiscountRule({
          planId: rawPlanId,
          membershipType,
          source: membershipSource,
          eventId,
          ticketTypeId,
          orderType: "tickets",
          settings: membershipSettings,
        });
        benefitReason = "active_member_logged_in";
      }

      if (memberRuleOverride && subtotalMinor > 0) {
        previewAmount = calculateDiscountAmount(subtotalMinor, memberRuleOverride);
        benefitApplied = previewAmount > 0;
        console.log(
          "[TT_DISCOUNT_AMOUNT_CALCULATED] subtotal=%s discountType=%s discountValue=%s amount=%s",
          subtotalMinor,
          memberRuleOverride.discountType,
          memberRuleOverride.discountValue,
          previewAmount
        );
        if (!benefitApplied) {
          discountWarning =
            "Membership found, but no discount is configured for this membership type.";
        }
      } else if (memberDetection.isActive) {
        discountWarning =
          "Membership found, but no discount is configured for this membership type.";
        console.log(
          "[TT_DISCOUNT_RULE_NOT_FOUND] membershipType=%s source=%s",
          membershipType,
          membershipSource
        );
      }

      // Overrides whichever generic warning was just set above — a cap-exhausted line
      // isn't "no discount configured," it's "you already used your discount," which is a
      // different, more actionable message regardless of whether a rule happens to exist.
      if (cappedToZero) {
        discountWarning = capLimit != null
          ? `Membership found, but the ${capLimit}-ticket discount cap for this event has already been reached for this email.`
          : "Membership found, but the discount cap for this event has already been reached for this email.";
      }
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
    memberRuleOverride = await getMembershipDiscountRule({
      planId: memberPlanId,
      membershipType: "",
      source: "LOCAL",
      eventId,
      ticketTypeId,
      orderType: "tickets",
      settings: membershipSettings,
    });
    benefitApplied = Boolean(memberRuleOverride);
  }

  return {
    memberPlanId,
    benefitReason,
    benefitApplied,
    memberRuleOverride,
    membershipSource,
    discountWarning,
    memberDiscountAmountMinor: benefitApplied ? previewAmount : 0,
  };
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
  discountCodes = {},
  applyMemberBenefit = true,
  sessionId = null,
  membershipCode = null,
}) {
  const event = await getPublishedEventBySlugOrId(eventId);
  if (!event.salesEnabled) {
    const err = new Error("Ticket sales are not enabled for this event.");
    err.status = 400;
    throw err;
  }
  const eventSettings = getEventCheckoutSettings(event);
  const membershipSettings = await getMembershipCheckoutSettings();

  const { lineItems, subtotalMinor } = await buildTicketLineItems(event, items);

  const memberDetection = await detectMemberStatus({
    userId,
    email,
    isLoggedIn: Boolean(isLoggedIn && userId),
    membershipCode,
    eventId: event.id,
  });

  // Deliberately NOT gated on applyMemberBenefit — that's independently re-checked inside
  // resolveMemberBenefitContext below, where it still correctly prevents any discount from
  // applying. Gating capStatus itself on it too just hid the cap status (and the client's
  // "cap reached" note) in cases where the real discount logic didn't need it hidden.
  // enableMemberDiscount IS checked here though: when an event opts out of member discounts
  // entirely, no discount could ever apply regardless of the cap, so surfacing a "cap
  // reached" note for it is just misleading.
  const capFeatureEnabled =
    membershipSettings.enableMembershipTicketDiscountCap !== false &&
    eventSettings.enableMemberDiscount !== false;
  let capStatus = null;
  if (memberDetection.isActive && capFeatureEnabled) {
    capStatus = await getMembershipDiscountCapStatus({ eventId: event.id, email, membershipSettings });
  }
  let capRemaining = capStatus?.remaining ?? Infinity;

  // Resolved per ticket type, not once for the whole cart: a membership discount (just
  // like a code) can now be scoped to specific ticket types, so the same membership might
  // yield a discount on a VIP line but nothing on a General line within the same order.
  // Sequential (not Promise.all) because the discount-redemption cap is shared across the
  // whole cart — each line's eligible quantity depends on how much of the cap prior lines
  // in the same request already consumed, decremented in the order items were submitted.
  const perLineMemberContext = [];
  const lineEligibility = [];
  for (const line of lineItems) {
    const eligibleQty = capStatus ? Math.max(0, Math.min(line.quantity, capRemaining)) : line.quantity;
    const eligibleSubtotalMinor = eligibleQty > 0 ? line.unitPriceMinor * eligibleQty : 0;
    const cappedToZero = Boolean(capStatus) && line.quantity > 0 && eligibleQty === 0;

    const ctx = await resolveMemberBenefitContext({
      memberDetection,
      includeMembership,
      selectedPlanId,
      purchaseType,
      eventSettings,
      membershipSettings,
      applyMemberBenefit,
      isLoggedIn,
      eventId: event.id,
      ticketTypeId: line.ticketTypeId,
      subtotalMinor: eligibleSubtotalMinor,
      capFeatureEnabled,
      cappedToZero,
      capLimit: capStatus?.capLimit ?? null,
    });

    perLineMemberContext.push(ctx);
    // Only an actually-applied discount (a real rule matched, amount > 0) consumes the
    // shared cap — matches countDiscountedTicketsForEmail's definition of "used" exactly,
    // so a membership type with no configured discount rule never eats into the cap.
    const appliedQty = ctx.benefitApplied ? eligibleQty : 0;
    lineEligibility.push({ requestedQty: line.quantity, eligibleQty: appliedQty });
    if (capStatus) capRemaining -= appliedQty;
  }

  // Cart-level display fields (banner text, comparison view) collapse the per-line contexts
  // back to one representative value — the first line where a benefit actually applied, or
  // the first line's facts otherwise. Validation itself stays fully per-line via
  // discountLineItems below; this is display-only.
  const firstApplied = perLineMemberContext.find((c) => c.benefitApplied) || perLineMemberContext[0] || {};
  const { memberPlanId, benefitReason, benefitApplied, membershipSource, discountWarning } = firstApplied;

  if (benefitApplied) {
    console.log(
      "[TT_DISCOUNT_APPLIED_TO_PREVIEW] source=%s",
      membershipSource
    );
  }

  const allowStacking =
    (eventSettings.allowDiscountStacking &&
      (membershipSettings.instantBenefitRules?.allowWithCodeDiscounts !== false ||
        !includeMembership)) ||
    (membershipSource === MEMBERSHIP_SOURCE.TICKETTAILOR &&
      membershipSettings.allowTicketTailorMembershipDiscountStacking !== false);

  // minQuantity ("5+ tickets") is a whole-order headcount, not a per-ticket-type
  // threshold — a code offering "10% off for groups of 5+" must count 2 Corporate + 3
  // Individual as 5, not reject each line for only having 2 or 3 of its own type. Every
  // line's eligibility check uses this combined total; each line's discount *amount* still
  // comes from its own lineSubtotalMinor below, so a percentage discount still applies
  // only to that line's own price, not the whole cart's.
  const totalCartQuantity = lineItems.reduce((sum, l) => sum + (l.quantity || 0), 0);

  const discountLineItems = lineItems.map((line, i) => {
    const lineMemberContext = perLineMemberContext[i];
    const lineCode = discountCodes[line.ticketTypeId] ?? discountCode ?? null;
    return {
      ticketTypeId: line.ticketTypeId,
      lineSubtotalMinor: line.originalPriceMinor,
      quantity: totalCartQuantity,
      discountCode: lineCode,
      voucherCode: lineCode,
      memberRuleOverride: lineMemberContext.benefitApplied ? lineMemberContext.memberRuleOverride : null,
      // Overrides the recomputed-from-full-subtotal member discount with the
      // cap-bounded amount actually resolved above (see resolveStackedDiscounts's
      // memberDiscountAmountOverride) — without this, discountService.js would
      // silently recompute the full, uncapped discount off the whole line.
      memberDiscountAmountOverrideMinor: lineMemberContext.benefitApplied
        ? lineMemberContext.memberDiscountAmountMinor
        : null,
    };
  });

  const discountResult = await applyDiscountsToOrderLines({
    userId: isLoggedIn ? userId : null,
    email,
    eventId: event.id,
    orderType: "tickets",
    lineItems: discountLineItems,
    memberPlanId: null,
    allowStacking,
    // The per-line loop above (resolveMemberBenefitContext) already made the complete,
    // cap-aware decision for every line, including "no discount" — this must never be
    // re-derived from scratch here, or a logged-in member's discount silently comes back
    // uncapped via discountService.js's legacy getAutomaticMemberDiscount fallback.
    skipAutomaticMemberLookup: true,
  });

  if (benefitApplied && discountResult.memberDiscountMinor > 0) {
    console.log(
      "[TT_TOTAL_RECALCULATED] subtotal=%s discount=%s total=%s",
      subtotalMinor,
      discountResult.memberDiscountMinor,
      subtotalMinor - discountResult.memberDiscountMinor
    );
  }

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
    const isTicketTailorDiscount =
      membershipSource === MEMBERSHIP_SOURCE.TICKETTAILOR ||
      discountResult.memberRule?.source === "TICKETTAILOR";
    appliedDiscounts.push({
      type: isTicketTailorDiscount ? "tickettailor_member" : "member",
      label: sanitizeCustomerDiscountLabel(
        discountResult.memberLabel || CUSTOMER_MEMBERSHIP_MESSAGES.discountApplied
      ),
      amountMinor: discountResult.memberDiscountMinor,
      ruleId: discountResult.memberRule?.id || null,
      membershipSource: isTicketTailorDiscount ? MEMBERSHIP_SOURCE.TICKETTAILOR : membershipSource,
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
      source: memberDetection.source || memberDetection.membershipSource || "",
      membershipType: memberDetection.membershipType || "",
      memberUntil: memberDetection.memberUntil || "",
      requiresLogin: memberDetection.requiresLogin || memberDetection.requiresLoginForBenefits || false,
      discountType: memberDetection.discountType || null,
      discountValue: memberDetection.discountValue || null,
      membership: memberDetection.membership
        ? {
            planId: memberDetection.membership.planId,
            planName: memberDetection.membership.planName,
            endsAt:
              memberDetection.membership.memberUntil ||
              memberDetection.membership.endsAt ||
              null,
            memberUntil:
              memberDetection.memberUntil ||
              memberDetection.membership.memberUntilFormatted ||
              "",
            membershipNumber: memberDetection.membership.membershipNumber,
          }
        : null,
    },
    ticketPricing: {
      lineItems: lineItems.map((line, i) => {
        const lineDiscount = discountResult.lineItems.find((l) => l.ticketTypeId === line.ticketTypeId);
        const finalPriceMinor = Math.max(0, line.originalPriceMinor - (lineDiscount?.discountAmountMinor || 0));
        const eligibility = lineEligibility[i] || { requestedQty: line.quantity, eligibleQty: 0 };
        return {
          ...line,
          memberDiscountMinor: lineDiscount?.memberDiscountMinor || 0,
          codeDiscountMinor: lineDiscount?.codeDiscountMinor || 0,
          voucherDiscountMinor: lineDiscount?.voucherDiscountMinor || 0,
          referralDiscountMinor: lineDiscount?.referralDiscountMinor || 0,
          personalDiscountMinor: lineDiscount?.personalDiscountMinor || 0,
          discountAmountMinor: lineDiscount?.discountAmountMinor || 0,
          memberLabel: sanitizeCustomerDiscountLabel(lineDiscount?.memberLabel || ""),
          codeLabel: lineDiscount?.codeLabel || "",
          codeError: lineDiscount?.codeError || null,
          finalPriceMinor,
          finalPrice: formatMoney(finalPriceMinor),
          eligibleDiscountQty: eligibility.eligibleQty,
          discountCapReached: Boolean(capStatus) && eligibility.eligibleQty < eligibility.requestedQty,
        };
      }),
      subtotalMinor,
      subtotal: formatMoney(subtotalMinor),
      eventDiscountMinor: 0,
      ticketTailorMembershipDiscountMinor:
        membershipSource === MEMBERSHIP_SOURCE.TICKETTAILOR ? discountResult.memberDiscountMinor : 0,
      ticketTailorMembershipDiscount: formatMoney(
        membershipSource === MEMBERSHIP_SOURCE.TICKETTAILOR ? discountResult.memberDiscountMinor : 0
      ),
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
    membershipBenefitApplied: benefitApplied && discountResult.memberDiscountMinor > 0,
    membershipBenefitReason: benefitReason,
    membershipSource,
    membershipDiscountWarning: discountWarning,
    memberDiscountLabel: sanitizeCustomerDiscountLabel(discountResult.memberLabel || ""),
    codeDiscountLabel: discountResult.codeLabel || "",
    appliedDiscounts,
    comparison,
    discountResult,
    membershipDiscountCap: capStatus
      ? {
          enabled: true,
          limit: capStatus.capLimit,
          usedBeforeThisOrder: capStatus.usedCount,
          remainingBeforeThisOrder: capStatus.remaining,
          unitsDiscountedInThisOrder: lineEligibility.reduce((sum, l) => sum + l.eligibleQty, 0),
          unitsAtFullPriceDueToCap: lineEligibility.reduce(
            (sum, l) => sum + Math.max(0, l.requestedQty - l.eligibleQty),
            0
          ),
        }
      : null,
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
