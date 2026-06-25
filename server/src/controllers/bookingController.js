import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[booking-engine]" });
}

export async function resolveBookingFlow(req, res) {
  try {
    const { resolveBookingFlow } = await import("../services/booking/BookingFlowResolver.js");
    const data = await resolveBookingFlow({
      ...(req.body || {}),
      userId: req.user?.id || req.user?._id || null,
      isLoggedIn: Boolean(req.user),
    });
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function startBooking(req, res) {
  try {
    const { startBooking } = await import("../services/booking/BookingFlowResolver.js");
    const flowType = req.params.flowType || req.body?.flowType || "event_ticket";
    const data = await startBooking(flowType, req.body || {}, req.user?.id || req.user?._id || null);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function previewBooking(req, res) {
  try {
    const { previewBooking } = await import("../services/booking/BookingFlowResolver.js");
    const flowType = req.params.flowType || req.body?.flowType || "event_ticket";
    const data = await previewBooking(flowType, req.body || {}, req.user?.id || req.user?._id || null);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function checkoutBooking(req, res) {
  try {
    const { checkoutBooking } = await import("../services/booking/BookingFlowResolver.js");
    const flowType = req.params.flowType || req.body?.flowType || "event_ticket";
    const data = await checkoutBooking(flowType, req.body || {}, req.user?.id || req.user?._id || null);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmBooking(req, res) {
  try {
    const { confirmBooking } = await import("../services/booking/BookingFlowResolver.js");
    const flowType = req.params.flowType || req.body?.flowType || "event_ticket";
    const data = await confirmBooking(flowType, req.body || {}, req.user?.id || req.user?._id || null);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function detectMembership(req, res) {
  try {
    const { detectMemberForCheckout } = await import("../services/checkoutBundleService.js");
    const { email, sessionId, membershipCode, eventId, checkoutSessionId } = req.body || {};
    const userId = req.user?.id || req.user?._id || null;
    const isLoggedIn = Boolean(userId);

    const result = await detectMemberForCheckout({
      userId,
      email: email || req.user?.email,
      isLoggedIn,
      sessionId: sessionId || checkoutSessionId,
      membershipCode: membershipCode || null,
      eventId,
    });

    return res.status(200).json({
      found: result.found,
      source: result.source || result.membershipSource,
      status: result.membershipStatus || result.status,
      membershipType: result.membershipType,
      memberUntil: result.memberUntil,
      eligibleForBenefits: result.eligibleForBenefits,
      requiresLogin: result.requiresLogin || result.requiresLoginForBenefits,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountRule: result.discountRule,
      ticketTailorMembershipId: result.ticketTailorMembershipId,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resolveCheckoutForms(req, res) {
  try {
    const { resolveForms } = await import("../services/booking/BookingFlowResolver.js");
    const data = await resolveForms(req.body || {});
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function joinWaitlist(req, res) {
  try {
    const { joinWaitlist } = await import("../services/booking/WaitlistService.js");
    const data = await joinWaitlist({
      ...(req.body || {}),
      userId: req.user?.id || req.user?._id || null,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listWaitlist(req, res) {
  try {
    const { listWaitlistEntries } = await import("../services/booking/WaitlistService.js");
    const entries = await listWaitlistEntries(req.query || {});
    return res.json({ entries });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validateCheckoutForms(req, res) {
  try {
    const { validateCheckoutFormAnswers } = await import("../services/checkoutFormService.js");
    const data = await validateCheckoutFormAnswers(req.body || {});
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function saveBeforeLogin(req, res) {
  try {
    const { saveCheckoutBeforeLogin } = await import("../services/checkoutBundleService.js");
    const data = await saveCheckoutBeforeLogin(req.body || {});
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function restoreSession(req, res) {
  try {
    const { restoreCheckoutSession } = await import("../services/checkoutBundleService.js");
    const session = await restoreCheckoutSession(req.params.sessionId);
    return res.json({ session });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function applyBenefitsAfterLogin(req, res) {
  try {
    const { applyMemberBenefitsAfterLogin } = await import("../services/checkoutBundleService.js");
    const data = await applyMemberBenefitsAfterLogin({
      ...(req.body || {}),
      userId: req.user?.id || req.user?._id || null,
    });
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validateDiscountCode(req, res) {
  try {
    const { validateCode } = await import("../controllers/checkoutDiscountController.js");
    return validateCode(req, res);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validateMembershipCode(req, res) {
  try {
    const { validateMembershipCode: handler } = await import("../controllers/checkoutBundleController.js");
    return handler(req, res);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getMembershipPlans(req, res) {
  try {
    const { getMembershipPlansForEvent } = await import("../controllers/checkoutBundleController.js");
    return getMembershipPlansForEvent(req, res);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function issueComplimentary(req, res) {
  try {
    const { issueComplimentaryBooking } = await import("../services/booking/BookingFlowResolver.js");
    const data = await issueComplimentaryBooking(req.body || {}, req.admin?.id || null);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function bookingAnalytics(req, res) {
  try {
    const { getBookingEngineAnalytics } = await import("../services/booking/bookingReportingService.js");
    const data = await getBookingEngineAnalytics(req.query || {});
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
