import { getAvailableDiscountsForUser } from "../services/dashboardAvailableDiscountsService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[discounts]" });
}

/** @deprecated Use GET /api/dashboard/available-discounts */
export async function getCustomerDiscounts(req, res) {
  try {
    const data = await getAvailableDiscountsForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
