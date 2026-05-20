import { getDashboardPayloadForUser } from "../services/dashboardService.js";
import env from "../config/env.js";
import { getMembershipPageForUser, ensureDemoMembership } from "../services/membershipService.js";

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

export async function getMemberships(req, res) {
  try {
    const data = await getMembershipPageForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Membership data unavailable.";
    if (status >= 500) {
      console.error("[dashboard/memberships]", error);
    }
    return res.status(status).json({ error: message });
  }
}

/** Dev helper: create a sample membership for the logged-in user if none exists. */
export async function seedMembership(req, res) {
  if (env.nodeEnv === "production") {
    return res.status(404).json({ error: "Not found." });
  }
  try {
    await ensureDemoMembership(req.user.id);
    const data = await getMembershipPageForUser(req.user);
    return res.status(201).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Could not create membership.";
    return res.status(status).json({ error: message });
  }
}
