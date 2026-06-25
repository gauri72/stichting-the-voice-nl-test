import {
  applyDiscountsToOrder,
  validateDiscountCode,
  getAutomaticMemberDiscount,
  recordDiscountUsage,
} from "../services/discountService.js";
import { buildOrderSummary, formatMoney } from "../services/ticketPricingService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[checkout-discount]" });
}

export async function applyDiscount(req, res) {
  try {
    const {
      subtotalMinor,
      eventId,
      orderType = "tickets",
      discountCode,
      voucherCode,
      email,
    } = req.body || {};

    if (!subtotalMinor || subtotalMinor <= 0) {
      return res.status(400).json({ error: "Subtotal is required." });
    }

    const userId = req.user?.id || null;
    const userEmail = email || req.user?.email || "";

    const result = await applyDiscountsToOrder({
      userId,
      email: userEmail,
      eventId,
      orderType,
      subtotalMinor: Number(subtotalMinor),
      discountCode,
      voucherCode,
    });

    const summary = buildOrderSummary({
      subtotalMinor: Number(subtotalMinor),
      bookingFeeMinor: Number(req.body.bookingFeeMinor) || 0,
      membershipDiscountMinor: result.memberDiscountMinor,
      voucherDiscountMinor: result.voucherDiscountMinor + result.personalDiscountMinor,
      referralDiscountMinor: result.referralDiscountMinor,
    });

    return res.status(200).json({
      applied: true,
      memberDiscount: result.memberDiscountMinor > 0
        ? { amount: result.memberDiscountMinor, label: result.memberLabel }
        : null,
      codeDiscount: result.codeDiscountMinor > 0
        ? {
            amount: result.codeDiscountMinor,
            label: result.codeLabel,
            code: result.codeRule?.code || "",
            type: result.codeRule?.type || "",
          }
        : null,
      summary: {
        ...summary,
        subtotal: formatMoney(summary.subtotalMinor),
        memberDiscount: formatMoney(summary.membershipDiscountMinor),
        voucherDiscount: formatMoney(summary.voucherDiscountMinor),
        referralDiscount: formatMoney(summary.referralDiscountMinor || 0),
        discount: formatMoney(summary.discountAmountMinor),
        total: formatMoney(summary.totalAmountMinor),
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removeDiscount(req, res) {
  try {
    const { subtotalMinor, bookingFeeMinor = 0 } = req.body || {};
    const userId = req.user?.id || null;
    const eventId = req.body?.eventId;

    const memberRule = await getAutomaticMemberDiscount(userId, eventId, "tickets");
    let memberDiscountMinor = 0;
    if (memberRule) {
      const { calculateDiscountAmount } = await import("../services/discountService.js");
      memberDiscountMinor = calculateDiscountAmount(Number(subtotalMinor), memberRule);
    }

    const summary = buildOrderSummary({
      subtotalMinor: Number(subtotalMinor),
      bookingFeeMinor: Number(bookingFeeMinor),
      membershipDiscountMinor: memberDiscountMinor,
      voucherDiscountMinor: 0,
      referralDiscountMinor: 0,
    });

    return res.status(200).json({
      removed: true,
      summary: {
        ...summary,
        subtotal: formatMoney(summary.subtotalMinor),
        memberDiscount: formatMoney(summary.membershipDiscountMinor),
        total: formatMoney(summary.totalAmountMinor),
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getMemberDiscount(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(200).json({ discount: null });

    const { eventId, orderType = "tickets" } = req.query;
    const rule = await getAutomaticMemberDiscount(userId, eventId, orderType);

    if (!rule) return res.status(200).json({ discount: null });

    return res.status(200).json({
      discount: {
        name: rule.name,
        label: rule.label,
        discountType: rule.discountType,
        discountValue: rule.discountValue,
        membershipPlanId: rule.membershipPlanId,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validateCode(req, res) {
  try {
    const { code, eventId, orderType = "tickets", subtotalMinor = 0, email } = req.body || {};
    const userId = req.user?.id || null;
    const userEmail = email || req.user?.email || "";

    const rule = await validateDiscountCode(code, userId, userEmail, eventId, orderType, Number(subtotalMinor));

    return res.status(200).json({
      valid: true,
      code: rule.code,
      type: rule.type,
      label: rule.label,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export { recordDiscountUsage };
