import { getDashboardPayloadForUser } from "../services/dashboardService.js";

export async function getDashboard(req, res) {
  try {
    const data = await getDashboardPayloadForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Dashboard unavailable.";
    if (status >= 500) {
      console.error("[dashboard]", error);
    }
    return res.status(status).json({ error: message });
  }
}
