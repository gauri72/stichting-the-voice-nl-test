import { sendNewsletterSubscribeEmails } from "../services/mailer.js";
import { isMailerConfigured } from "../services/smtpTransport.js";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export async function subscribeNewsletter(req, res) {
  const email = String(req.body?.email || "").trim().slice(0, 160);

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  if (!isMailerConfigured()) {
    return res.status(503).json({
      error: "Email is not configured on the server. Please try again later or contact us directly."
    });
  }

  try {
    const result = await sendNewsletterSubscribeEmails({ email });
    if (result.skipped) {
      return res.status(503).json({ error: "Could not send confirmation email. Please try again later." });
    }
    return res.status(200).json({
      message: "Thank you for subscribing. A confirmation email is on its way."
    });
  } catch (error) {
    console.error("[newsletter] Subscribe failed:", error.message);
    return res.status(500).json({ error: "Could not complete subscription. Please try again later." });
  }
}
