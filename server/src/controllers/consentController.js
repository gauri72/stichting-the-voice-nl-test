import {
  getLatestConsentForUser,
  saveConsentRecord,
  validateConsentPayload,
} from "../services/cookieConsentService.js";

export async function saveConsent(req, res) {
  const error = validateConsentPayload(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const userId = req.user?._id || null;
    const record = await saveConsentRecord({
      body: req.body,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return res.status(201).json({ consent: record });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not save your cookie consent." });
  }
}

export async function getConsentByUserId(req, res) {
  const { userId } = req.params;

  if (String(req.user._id) !== String(userId)) {
    return res.status(403).json({ error: "You can only view your own consent record." });
  }

  try {
    const record = await getLatestConsentForUser(userId);
    if (!record) {
      return res.status(404).json({ error: "No consent record found for this user." });
    }
    return res.json({ consent: record });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not load the consent record." });
  }
}
