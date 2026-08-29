import BusinessProfile from "../models/BusinessProfile.js";
import { getMailFromAddress, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";
import { escapeHtml } from "../utils/escapeHtml.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitBusinessInquiry(businessId, { productId, productName, name, email, phone, message }) {
  const business = await BusinessProfile.findOne({ _id: businessId, status: "active" }).lean();
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }
  if (!business.contactEmail) {
    const err = new Error("This business has no contact email on file.");
    err.status = 503;
    throw err;
  }

  const cleanName = String(name || "").trim().slice(0, 160);
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPhone = String(phone || "").trim().slice(0, 40);
  const cleanMessage = String(message || "").trim().slice(0, 4000);

  if (!cleanName) {
    const err = new Error("Name is required.");
    err.status = 400;
    throw err;
  }
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
    const err = new Error("A valid email address is required.");
    err.status = 400;
    throw err;
  }
  if (!cleanMessage) {
    const err = new Error("Please tell us a bit about your application.");
    err.status = 400;
    throw err;
  }

  if (!isMailerConfigured()) {
    const err = new Error("Email is not configured. Please try again later.");
    err.status = 503;
    throw err;
  }

  const transporter = getSmtpTransporter();
  const subjectProduct = productName ? `: ${productName}` : "";

  await transporter.sendMail({
    from: getMailFromAddress(),
    to: business.contactEmail,
    replyTo: cleanEmail,
    subject: `New Application via V.Commerce${subjectProduct}`,
    html: `
      <p>A new application was submitted on your V.Commerce business page.</p>
      <table cellpadding="6" cellspacing="0">
        ${productName ? `<tr><td><strong>Product/Tour</strong></td><td>${escapeHtml(productName)}</td></tr>` : ""}
        <tr><td><strong>Name</strong></td><td>${escapeHtml(cleanName)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(cleanEmail)}</td></tr>
        ${cleanPhone ? `<tr><td><strong>Phone</strong></td><td>${escapeHtml(cleanPhone)}</td></tr>` : ""}
      </table>
      <p><strong>Message</strong></p>
      <p>${escapeHtml(cleanMessage).replace(/\n/g, "<br>")}</p>
      <p style="color:#888;font-size:12px;">Reply directly to this email to respond to the applicant.</p>
    `,
    text: [
      "A new application was submitted on your V.Commerce business page.",
      productName ? `Product/Tour: ${productName}` : "",
      `Name: ${cleanName}`,
      `Email: ${cleanEmail}`,
      cleanPhone ? `Phone: ${cleanPhone}` : "",
      "",
      "Message:",
      cleanMessage,
    ].filter(Boolean).join("\n"),
  });

  return { sent: true };
}
