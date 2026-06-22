import { getAvailableDiscountsForUser } from "../services/dashboardAvailableDiscountsService.js";

function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) {
    console.error("[discounts]", error);
  }
  return res.status(status).json({ error: message });
}

/** @deprecated Use GET /api/dashboard/available-discounts */
export async function getCustomerDiscounts(req, res) {
  try {
    console.log("[HARDCODED_DISCOUNT_SOURCE_FOUND] legacy_endpoint=/api/discounts redirecting_to=available-discounts-service");
    const data = await getAvailableDiscountsForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
