import {
  isMailerConfigured,
  sendVentureStudioMessageEmail,
  sendVentureStudioQuoteEmail
} from "../services/ventureStudioContactMailer.js";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function trimField(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}

export async function submitVentureStudioMessage(req, res) {
  const name = trimField(req.body?.name, 120);
  const email = trimField(req.body?.email, 160);
  const subject = trimField(req.body?.subject, 200);
  const message = trimField(req.body?.message, 5000);

  if (!name) {
    return res.status(400).json({ error: "Full name is required." });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!isMailerConfigured()) {
    return res.status(503).json({
      error: "Email is not configured on the server. Please try again later or contact us directly."
    });
  }

  try {
    const result = await sendVentureStudioMessageEmail({ name, email, subject, message });
    if (!result.sent) {
      return res.status(503).json({ error: "Could not send your message. Please try again later." });
    }
    return res.status(200).json({
      message: "Thank you! We will get back to you shortly."
    });
  } catch (error) {
    console.error("[contact] Venture Studio message failed:", error.message);
    return res.status(500).json({ error: "Could not send your message. Please try again later." });
  }
}

export async function submitVentureStudioQuote(req, res) {
  const service = trimField(req.body?.service, 120);
  const projectType = trimField(req.body?.projectType, 120);
  const timeline = trimField(req.body?.timeline, 120);
  const details = trimField(req.body?.details, 5000);

  if (!service) {
    return res.status(400).json({ error: "Please select the service you need help with." });
  }
  if (!details) {
    return res.status(400).json({ error: "Please tell us more about your project." });
  }

  if (!isMailerConfigured()) {
    return res.status(503).json({
      error: "Email is not configured on the server. Please try again later or contact us directly."
    });
  }

  try {
    const result = await sendVentureStudioQuoteEmail({
      service,
      projectType,
      timeline,
      details
    });
    if (!result.sent) {
      return res.status(503).json({
        error: "Could not send your quote request. Please try again later."
      });
    }
    return res.status(200).json({
      message: "Thank you! Your quote request has been received."
    });
  } catch (error) {
    console.error("[contact] Venture Studio quote failed:", error.message);
    return res.status(500).json({
      error: "Could not send your quote request. Please try again later."
    });
  }
}
