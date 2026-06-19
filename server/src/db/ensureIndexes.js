import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import PastData from "../models/PastData.js";
import EventTestimonial from "../models/EventTestimonial.js";
import ActivityLog from "../models/ActivityLog.js";
import EventRegistration from "../models/EventRegistration.js";
import SequenceCounter from "../models/SequenceCounter.js";
import Admin from "../models/Admin.js";
import EmailTemplate from "../models/EmailTemplate.js";
import EmailBroadcast from "../models/EmailBroadcast.js";
import DiscountCode from "../models/DiscountCode.js";
import DiscountRule from "../models/DiscountRule.js";
import DiscountUsage from "../models/DiscountUsage.js";
import ReferralReward from "../models/ReferralReward.js";
import Event from "../models/Event.js";
import TicketType from "../models/TicketType.js";
import TicketOrder from "../models/TicketOrder.js";
import Ticket from "../models/Ticket.js";
import Voucher from "../models/Voucher.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import Sponsorship from "../models/Sponsorship.js";
import Donation from "../models/Donation.js";
import ReminderLog from "../models/ReminderLog.js";
import ReceiptLog from "../models/ReceiptLog.js";
import Invoice from "../models/Invoice.js";
import EventBudget from "../models/EventBudget.js";
import FinanceTransaction from "../models/FinanceTransaction.js";
import AuditReport from "../models/AuditReport.js";
import FinanceAuditLog from "../models/FinanceAuditLog.js";
import FinanceSettings from "../models/FinanceSettings.js";

/**
 * Every model maps to exactly one explicitly-named collection in the active
 * database (voice_nl_26). Listing them here documents the structure and lets us
 * guarantee the integrity indexes (unique payment intent / member / email /
 * counter keys) actually exist — so no API or integration can duplicate or
 * overwrite a record, even if Mongoose autoIndex is disabled in production.
 */
const MODELS = [
  ["users", User],
  ["payment_transactions", PaymentTransaction],
  ["members", Member],
  ["memberships", Membership],
  ["past_data", PastData],
  ["reviews", EventTestimonial],
  ["activitylogs", ActivityLog],
  ["eventregistrations", EventRegistration],
  ["sequencecounters", SequenceCounter],
  ["admins", Admin],
  ["email_templates", EmailTemplate],
  ["email_broadcasts", EmailBroadcast],
  ["discount_codes", DiscountCode],
  ["discount_rules", DiscountRule],
  ["discount_usages", DiscountUsage],
  ["referral_rewards", ReferralReward],
  ["events", Event],
  ["ticket_types", TicketType],
  ["ticket_orders", TicketOrder],
  ["tickets", Ticket],
  ["vouchers", Voucher],
  ["tickettailor_bookings", TicketTailorBooking],
  ["admin_audit_logs", AdminAuditLog],
  ["sponsorships", Sponsorship],
  ["donations", Donation],
  ["reminder_logs", ReminderLog],
  ["receipt_logs", ReceiptLog],
  ["invoices", Invoice],
  ["event_budgets", EventBudget],
  ["finance_transactions", FinanceTransaction],
  ["audit_reports", AuditReport],
  ["finance_audit_logs", FinanceAuditLog],
  ["finance_settings", FinanceSettings],
];

export async function ensureIndexes() {
  const ensured = [];
  for (const [collection, Model] of MODELS) {
    try {
      // createIndexes() builds any missing schema indexes without dropping
      // existing ones, so it is safe to run on every startup.
      await Model.createIndexes();
      ensured.push(collection);
    } catch (error) {
      console.warn(`[indexes] Could not ensure indexes for "${collection}":`, error.message);
    }
  }
  console.log(`[indexes] Verified ${ensured.length}/${MODELS.length} collections: ${ensured.join(", ")}`);
}
