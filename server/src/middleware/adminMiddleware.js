import { verifyAdminToken, getAdminById } from "../services/adminService.js";

export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: "Admin authentication required." });
    }

    const payload = verifyAdminToken(match[1]);
    const admin = await getAdminById(payload.sub);
    if (!admin) {
      return res.status(401).json({ error: "Invalid or expired admin session." });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({ error: error.message || "Invalid or expired admin session." });
  }
}
