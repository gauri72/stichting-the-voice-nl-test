export {
  saveCheckoutFormResponse,
  listCheckoutFormResponses,
} from "../checkoutFormService.js";

import CheckoutFormResponse from "../../models/CheckoutFormResponse.js";
import { validateCheckoutFormAnswers } from "../checkoutFormService.js";

export async function storeCheckoutAnswers(payload = {}) {
  const validated = await validateCheckoutFormAnswers(payload);
  const { saveCheckoutFormResponse } = await import("../checkoutFormService.js");
  return saveCheckoutFormResponse({ ...payload, answers: validated.answers });
}

export async function getAnswersByOrderId(orderId) {
  return CheckoutFormResponse.findOne({ orderId }).lean();
}

export async function getAnswersByResponseId(responseId) {
  return CheckoutFormResponse.findOne({ responseId }).lean();
}
