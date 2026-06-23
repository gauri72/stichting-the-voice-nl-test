import {
  getCustomerDashboardConfigForUser,
  getCustomerDashboardDataForUser,
} from "../services/customerDashboardDataService.js";

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[customer-dashboard]", error);
  return res.status(status).json({ error: error.message || "Something went wrong." });
}

export async function getDashboardConfig(req, res) {
  try {
    const config = await getCustomerDashboardConfigForUser(req.user);
    return res.json(config || { sections: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getDashboardData(req, res) {
  try {
    const data = await getCustomerDashboardDataForUser(req.user);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}
