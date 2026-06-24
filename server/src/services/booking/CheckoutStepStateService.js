export {
  createOrUpdateSession,
  getSession,
  saveCheckoutBeforeLogin,
  restoreCheckoutSession,
  applyMemberBenefitsAfterLogin,
} from "../checkoutBundleService.js";

import CheckoutSession from "../../models/CheckoutSession.js";

const SESSION_TTL_MS = 60 * 60 * 1000;

export async function saveStepState({
  sessionId,
  returnStep,
  stepData = {},
  userId = null,
  email = "",
}) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await CheckoutSession.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        returnStep: Number(returnStep) || 1,
        stepData,
        userId: userId || null,
        email: String(email || "").toLowerCase(),
        expiresAt,
      },
    },
    { upsert: false }
  );
  return { sessionId, returnStep, expiresAt };
}

export async function getStepState(sessionId) {
  const session = await getSession(sessionId);
  return {
    returnStep: session.returnStep || 1,
    stepData: session.stepData || {},
    session,
  };
}

async function getSession(sessionId) {
  const { getSession: getCheckoutSession } = await import("../checkoutBundleService.js");
  return getCheckoutSession(sessionId);
}
