import {
  getCustomerDashboardConfigForUser,
  getCustomerDashboardDataForUser,
} from "../services/customerDashboardDataService.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[customer-dashboard]" });
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
