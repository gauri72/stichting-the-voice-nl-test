import CheckoutAuditLog from "../models/CheckoutAuditLog.js";

export async function logCheckoutAction({
  action,
  sessionId = "",
  orderId = "",
  userId = null,
  email = "",
  eventId = null,
  memberStatus = "",
  details = null,
  ipAddress = "",
}) {
  try {
    await CheckoutAuditLog.create({
      action,
      sessionId,
      orderId,
      userId,
      email: String(email || "").toLowerCase(),
      eventId,
      memberStatus,
      details,
      ipAddress,
    });
  } catch (error) {
    console.warn("[checkout-audit] Could not write log:", error.message);
  }
}

export const CHECKOUT_AUDIT_ACTIONS = {
  MEMBER_STATUS_DETECTED: "member_status_detected",
  LOGIN_PROMPTED: "login_prompted",
  MEMBER_DISCOUNT_APPLIED: "member_discount_applied",
  EXPIRED_RENEWAL_OFFERED: "expired_renewal_offered",
  MEMBERSHIP_ADDED: "membership_added_to_ticket_checkout",
  MEMBERSHIP_REMOVED: "membership_removed_from_ticket_checkout",
  PRICE_PREVIEW_GENERATED: "price_preview_generated",
  COMBINED_ORDER_CREATED: "combined_order_created",
  TICKET_GENERATED: "ticket_generated",
  MEMBERSHIP_GENERATED: "membership_generated",
  TICKET_EMAIL_SENT: "ticket_email_sent",
  MEMBERSHIP_EMAIL_SENT: "membership_email_sent",
  DISCOUNT_REJECTED: "discount_rejected",
  CHECKOUT_COMPLETED: "checkout_completed",
  CHECKOUT_MEMBER_DETECTION_STARTED: "checkout_member_detection_started",
  LOCAL_MEMBERSHIP_LOOKUP: "local_membership_lookup",
  TICKETTAILOR_MEMBERSHIP_LOOKUP: "tickettailor_membership_lookup",
  TICKETTAILOR_API_FAILED: "tickettailor_api_failed",
  CHECKOUT_PAYMENT_STARTED: "checkout_payment_started",
  ZERO_VALUE_ORDER_STARTED: "zero_value_order_started",
  ZERO_VALUE_ORDER_VALIDATED: "zero_value_order_validated",
  FREE_ORDER_COMPLETED: "free_order_completed",
  TICKET_CREATED: "ticket_created",
  QR_CODE_GENERATED: "qr_code_generated",
  TICKET_PDF_GENERATED: "ticket_pdf_generated",
  MEMBERSHIP_CREATED_OR_RENEWED: "membership_created_or_renewed",
  MEMBERSHIP_QR_GENERATED: "membership_qr_generated",
  MEMBERSHIP_PDF_GENERATED: "membership_pdf_generated",
};
