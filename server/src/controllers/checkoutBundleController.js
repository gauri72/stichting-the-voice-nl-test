import {
  detectMemberForCheckout,
  createOrUpdateSession,
  createBundleCheckout,
  completeFreeOrder,
} from "../services/checkoutBundleService.js";
import {
  calculatePricePreview,
  getAvailableMembershipPlans,
  generateSessionId,
} from "../services/pricePreviewService.js";
import {
  getMembershipCheckoutSettings,
  updateMembershipCheckoutSettings,
} from "../services/membershipCheckoutSettingsService.js";
import { logCheckoutAction, CHECKOUT_AUDIT_ACTIONS } from "../services/checkoutAuditService.js";
import Event from "../models/Event.js";
import { fulfillOrder } from "../services/postPaymentFulfillmentService.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) console.error("[checkout-bundle]", error);
  return res.status(status).json({ error: message });
}

export async function detectMemberStatus(req, res) {
  try {
    const { email, sessionId } = req.body || {};
    const userId = req.user?.id || req.user?._id || null;
    const isLoggedIn = Boolean(userId);

    const result = await detectMemberForCheckout({
      userId,
      email: email || req.user?.email,
      isLoggedIn,
      sessionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function calculatePreview(req, res) {
  try {
    const {
      eventId,
      items,
      email,
      includeMembership = false,
      selectedPlanId = null,
      purchaseType = "NEW",
      discountCode = null,
      applyMemberBenefit = true,
      sessionId = null,
    } = req.body || {};

    if (!eventId || !items?.length) {
      return res.status(400).json({ error: "Event and ticket items are required." });
    }

    const userId = req.user?.id || req.user?._id || null;
    const preview = await calculatePricePreview({
      eventId,
      items,
      userId,
      email: email || req.user?.email,
      isLoggedIn: Boolean(userId),
      includeMembership,
      selectedPlanId,
      purchaseType,
      discountCode,
      applyMemberBenefit,
      sessionId,
    });

    return res.status(200).json({ preview });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function applyMembershipBenefit(req, res) {
  try {
    const {
      eventId,
      items,
      email,
      includeMembership = true,
      selectedPlanId,
      purchaseType = "NEW",
      discountCode = null,
      sessionId = null,
    } = req.body || {};

    const userId = req.user?.id || req.user?._id || null;

    const result = await createOrUpdateSession({
      sessionId,
      eventId,
      userId,
      email: email || req.user?.email,
      items,
      includeMembership,
      selectedPlanId,
      purchaseType,
      discountCode,
      applyMemberBenefit: true,
      isLoggedIn: Boolean(userId),
    });

    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBER_DISCOUNT_APPLIED,
      sessionId: result.sessionId,
      userId,
      email,
      eventId,
      details: { selectedPlanId, purchaseType },
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addMembershipToCart(req, res) {
  try {
    const {
      eventId,
      items,
      email,
      selectedPlanId,
      purchaseType = "NEW",
      discountCode = null,
      sessionId = null,
    } = req.body || {};

    if (!selectedPlanId) {
      return res.status(400).json({ error: "Membership plan is required." });
    }

    const userId = req.user?.id || req.user?._id || null;

    const result = await createOrUpdateSession({
      sessionId,
      eventId,
      userId,
      email: email || req.user?.email,
      items,
      includeMembership: true,
      selectedPlanId,
      purchaseType,
      discountCode,
      applyMemberBenefit: true,
      isLoggedIn: Boolean(userId),
    });

    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBERSHIP_ADDED,
      sessionId: result.sessionId,
      userId,
      email,
      eventId,
      details: { selectedPlanId, purchaseType },
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removeMembershipFromCart(req, res) {
  try {
    const { eventId, items, email, discountCode = null, sessionId = null } = req.body || {};
    const userId = req.user?.id || req.user?._id || null;

    const result = await createOrUpdateSession({
      sessionId,
      eventId,
      userId,
      email: email || req.user?.email,
      items,
      includeMembership: false,
      selectedPlanId: null,
      purchaseType: "NEW",
      discountCode,
      applyMemberBenefit: Boolean(userId),
      isLoggedIn: Boolean(userId),
    });

    await logCheckoutAction({
      action: CHECKOUT_AUDIT_ACTIONS.MEMBERSHIP_REMOVED,
      sessionId: result.sessionId,
      userId,
      email,
      eventId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function completeFreeOrderHandler(req, res) {
  try {
    const { eventId, ...payload } = req.body || {};
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required." });
    }
    if (!payload.items?.length) {
      return res.status(400).json({ error: "Select at least one ticket." });
    }

    const result = await completeFreeOrder(
      eventId,
      payload,
      req.user?.id || req.user?._id || null
    );

    return res.status(200).json({
      success: true,
      order: result.order,
      tickets: result.tickets,
      membership: result.membership || null,
      isFreeBooking: true,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createPaymentSession(req, res) {
  try {
    const result = await createBundleCheckout(
      req.body.eventId,
      req.body,
      req.user?.id || req.user?._id || null
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function paymentSuccess(req, res) {
  try {
    const { orderId, paymentIntentId } = req.body || {};
    if (!orderId && !paymentIntentId) {
      return res.status(400).json({ error: "Order ID or payment intent ID is required." });
    }

    let resolvedOrderId = orderId;
    if (!resolvedOrderId && paymentIntentId) {
      const TicketOrder = (await import("../models/TicketOrder.js")).default;
      const order = await TicketOrder.findOne({ paymentIntentId }).lean();
      if (order) resolvedOrderId = order._id.toString();
    }

    const result = await fulfillOrder(resolvedOrderId, paymentIntentId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getMembershipPlansForEvent(req, res) {
  try {
    const { eventId } = req.params;
    const plans = await getAvailableMembershipPlans(eventId);
    return res.status(200).json({ plans });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function initCheckoutSession(req, res) {
  try {
    const sessionId = generateSessionId();
    return res.status(201).json({ sessionId });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateEventMembershipSettings(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found." });

    const data = req.body || {};
    const current = event.checkoutSettings?.toObject?.() || event.checkoutSettings || {};

    event.checkoutSettings = {
      enableMemberDiscount:
        data.enableMemberDiscount !== undefined
          ? Boolean(data.enableMemberDiscount)
          : current.enableMemberDiscount !== false,
      enableMembershipUpsell:
        data.enableMembershipUpsell !== undefined
          ? Boolean(data.enableMembershipUpsell)
          : current.enableMembershipUpsell !== false,
      allowInstantMembershipBenefit:
        data.allowInstantMembershipBenefit !== undefined
          ? Boolean(data.allowInstantMembershipBenefit)
          : current.allowInstantMembershipBenefit !== false,
      allowMembershipTicketBundle:
        data.allowMembershipTicketBundle !== undefined
          ? Boolean(data.allowMembershipTicketBundle)
          : current.allowMembershipTicketBundle !== false,
      eligibleMembershipTypes:
        data.eligibleMembershipTypes || current.eligibleMembershipTypes || [],
      allowDiscountStacking:
        data.allowDiscountStacking !== undefined
          ? Boolean(data.allowDiscountStacking)
          : current.allowDiscountStacking !== false,
      showPriceComparisonPreview:
        data.showPriceComparisonPreview !== undefined
          ? Boolean(data.showPriceComparisonPreview)
          : current.showPriceComparisonPreview !== false,
    };

    await event.save();
    return res.status(200).json({ checkoutSettings: event.checkoutSettings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getMembershipCheckoutSettingsHandler(req, res) {
  try {
    const settings = await getMembershipCheckoutSettings();
    return res.status(200).json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateMembershipCheckoutSettingsHandler(req, res) {
  try {
    const adminId = req.admin?.id || req.admin?._id || null;
    const settings = await updateMembershipCheckoutSettings(req.body, adminId);
    return res.status(200).json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}
