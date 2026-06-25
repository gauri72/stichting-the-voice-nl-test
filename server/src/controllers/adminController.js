import { loginAdmin, getAdminById } from "../services/adminService.js";
import { getAdminDashboardPayload } from "../services/adminDashboardService.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin]" });
}

export async function adminLogin(req, res) {
  try {
    const { email, password, rememberMe } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await loginAdmin({ email, password, rememberMe }, req);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function adminMe(req, res) {
  try {
    const admin = await getAdminById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found." });
    }
    return res.status(200).json({ admin });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function adminDashboard(req, res) {
  try {
    const payload = await getAdminDashboardPayload(req.admin);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error);
  }
}

export { requireAdmin };
