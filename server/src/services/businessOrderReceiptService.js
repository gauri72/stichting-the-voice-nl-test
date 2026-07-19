import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import BusinessOrder from "../models/BusinessOrder.js";
import BusinessProfile from "../models/BusinessProfile.js";
import { getMailFromAddress, getMailReplyTo, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICE_LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "src", "assets", "header-logo.png");

function money(minor, currency = "eur") {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: currency.toUpperCase() }).format(Number(minor || 0) / 100);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

async function loadRemoteImage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function voiceLogo() {
  try { return fs.existsSync(VOICE_LOGO_PATH) ? fs.readFileSync(VOICE_LOGO_PATH) : null; }
  catch { return null; }
}

export async function renderBusinessOrderReceipt(orderInput, businessInput = null) {
  const order = orderInput.toObject ? orderInput.toObject() : orderInput;
  const business = businessInput || await BusinessProfile.findById(order.businessId).lean();
  const businessLogo = await loadRemoteImage(business?.logoUrl);
  const orgLogo = voiceLogo();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Receipt ${order.receiptNumber || order.orderNumber}` } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (orgLogo) {
      try { doc.image(orgLogo, 48, 42, { fit: [150, 55] }); } catch { /* keep receipt usable */ }
    }
    if (businessLogo) {
      try { doc.image(businessLogo, 445, 42, { fit: [95, 55], align: "right" }); } catch { /* keep receipt usable */ }
    }
    doc.moveDown(4);
    doc.fontSize(22).fillColor("#0b2f47").text("V.Commerce Payment Receipt");
    doc.moveDown(.4).fontSize(10).fillColor("#5c7082")
      .text(`Receipt: ${order.receiptNumber || order.orderNumber}`)
      .text(`Order: ${order.orderNumber || order._id}`)
      .text(`Paid: ${new Date(order.paidAt || order.createdAt).toLocaleString("en-GB")}`);
    doc.moveDown(1.2).fontSize(13).fillColor("#0b2f47").text("Sold by");
    doc.fontSize(10).fillColor("#334e60").text(business?.businessName || order.businessName);
    if (business?.vatNumber) doc.text(`VAT: ${business.vatNumber}`);
    doc.moveDown().fontSize(13).fillColor("#0b2f47").text("Customer");
    doc.fontSize(10).fillColor("#334e60").text(order.customerName).text(order.customerEmail);
    if (order.customerPhone) doc.text(order.customerPhone);
    if (order.companyName) doc.text(order.companyName);

    doc.moveDown(1.4);
    const startY = doc.y;
    doc.rect(48, startY, 499, 26).fill("#e9f7fa");
    doc.fillColor("#0b2f47").fontSize(10).text("Item", 58, startY + 8).text("Qty", 365, startY + 8).text("Total", 455, startY + 8);
    doc.y = startY + 36;
    for (const item of order.items || []) {
      doc.fillColor("#243b4a").text(item.productName, 58, doc.y, { width: 290 });
      doc.text(String(item.quantity), 365, doc.y - 12, { width: 40 });
      doc.text(money(item.lineTotalMinor, order.currency), 455, doc.y - 12, { width: 90, align: "right" });
      doc.moveDown(.8);
    }
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#d6e2e8").stroke();
    doc.moveDown().fontSize(12).fillColor("#0b2f47").text(`Total paid: ${money(order.subtotalMinor, order.currency)}`, 350, doc.y, { width: 197, align: "right" });
    doc.moveDown(3).fontSize(9).fillColor("#6c7f8b")
      .text("Payment processed securely through Stripe. This receipt confirms payment for the products or services listed above.")
      .moveDown(.5).text("Stichting The V.O.I.C.E. NL · stichtingthevoice.nl");
    doc.end();
  });
}

function emailHtml(order, business, { hasOrgLogo, hasBusinessLogo } = {}) {
  const rows = (order.items || []).map((item) => `
    <tr><td style="padding:10px;border-bottom:1px solid #e5edf1">${escapeHtml(item.productName)}</td>
    <td style="padding:10px;border-bottom:1px solid #e5edf1;text-align:center">${item.quantity}</td>
    <td style="padding:10px;border-bottom:1px solid #e5edf1;text-align:right">${money(item.lineTotalMinor, order.currency)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f2f7f9;font-family:Arial,sans-serif;color:#15364a">
    <div style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #dbe8ee;border-radius:16px;overflow:hidden">
      <div style="padding:20px 26px;background:#fff;display:flex;align-items:center;justify-content:space-between">
        ${hasOrgLogo ? '<img src="cid:voiceLogo" alt="Stichting The V.O.I.C.E. NL" style="max-width:180px;max-height:58px">' : "<strong>Stichting The V.O.I.C.E. NL</strong>"}
        ${hasBusinessLogo ? `<img src="cid:businessLogo" alt="${escapeHtml(business.businessName)}" style="max-width:110px;max-height:58px">` : `<strong>${escapeHtml(business.businessName)}</strong>`}
      </div>
      <div style="padding:26px;background:linear-gradient(120deg,#048eb0,#1fc873);color:#fff">
        <div style="font-size:12px;letter-spacing:2px">STICHTING THE V.O.I.C.E. NL × ${escapeHtml(business.businessName)}</div>
        <h1 style="margin:10px 0 0">Payment confirmed</h1>
      </div>
      <div style="padding:28px"><p>Hello ${escapeHtml(order.customerName)},</p>
        <p>Thank you for your order from <strong>${escapeHtml(business.businessName)}</strong>. Your payment has been received.</p>
        <p><strong>Order ${escapeHtml(order.orderNumber)}</strong></p>
        <table style="width:100%;border-collapse:collapse">${rows}
          <tr><td colspan="2" style="padding:14px 10px;text-align:right"><strong>Total paid</strong></td>
          <td style="padding:14px 10px;text-align:right"><strong>${money(order.subtotalMinor, order.currency)}</strong></td></tr>
        </table>
        <p style="color:#607787;font-size:13px">Your PDF receipt is attached. The business will contact you regarding fulfilment.</p>
      </div>
    </div></body></html>`;
}

export async function sendBusinessOrderEmails(orderInput, { force = false } = {}) {
  const order = orderInput.toObject ? orderInput : await BusinessOrder.findById(orderInput._id || orderInput);
  if (!order) throw new Error("Order not found.");
  if (!force && order.receiptEmailStatus === "sent") return order;

  const business = await BusinessProfile.findById(order.businessId).lean();
  if (!business) throw new Error("Business not found.");
  if (!order.receiptNumber) order.receiptNumber = `VCR-${new Date().getUTCFullYear()}-${order._id.toString().slice(-8).toUpperCase()}`;
  const receipt = await renderBusinessOrderReceipt(order, business);
  order.receiptGeneratedAt = new Date();

  if (!isMailerConfigured()) {
    order.receiptEmailStatus = "failed";
    order.receiptEmailError = "SMTP is not configured.";
    await order.save();
    return order;
  }
  const transporter = getSmtpTransporter();
  const attachments = [{ filename: `${order.receiptNumber}.pdf`, content: receipt, contentType: "application/pdf" }];
  const orgLogo = voiceLogo();
  if (orgLogo) attachments.push({ filename: "voice-logo.png", content: orgLogo, cid: "voiceLogo" });
  const businessLogo = await loadRemoteImage(business.logoUrl);
  if (businessLogo) attachments.push({ filename: "business-logo.png", content: businessLogo, cid: "businessLogo" });

  try {
    await transporter.sendMail({
      from: getMailFromAddress(), to: order.customerEmail, replyTo: business.contactEmail || getMailReplyTo(),
      subject: `Order confirmed — ${business.businessName} (${order.orderNumber})`,
      html: emailHtml(order, business, { hasOrgLogo: Boolean(orgLogo), hasBusinessLogo: Boolean(businessLogo) }), attachments,
    });
    order.receiptEmailStatus = "sent";
    order.receiptEmailSentAt = new Date();
    order.receiptEmailError = "";
  } catch (error) {
    order.receiptEmailStatus = "failed";
    order.receiptEmailError = error.message;
  }

  if (business.contactEmail) {
    try {
      await transporter.sendMail({
        from: getMailFromAddress(), to: business.contactEmail, replyTo: order.customerEmail,
        subject: `New V.Commerce order ${order.orderNumber}`,
        html: `<p>A paid order has been received.</p><p><strong>${escapeHtml(order.customerName)}</strong> · ${escapeHtml(order.customerEmail)} · ${money(order.subtotalMinor, order.currency)}</p>`,
        attachments: [{ filename: `${order.receiptNumber}.pdf`, content: receipt, contentType: "application/pdf" }],
      });
      order.sellerEmailStatus = "sent";
    } catch {
      order.sellerEmailStatus = "failed";
    }
  }
  await order.save();
  return order;
}
