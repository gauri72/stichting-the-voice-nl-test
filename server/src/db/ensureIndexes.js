import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import PastData from "../models/PastData.js";
import EventTestimonial from "../models/EventTestimonial.js";
import ActivityLog from "../models/ActivityLog.js";
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
import CheckoutSession from "../models/CheckoutSession.js";
import CheckoutAuditLog from "../models/CheckoutAuditLog.js";
import MembershipCheckoutSettings from "../models/MembershipCheckoutSettings.js";
import Page from "../models/Page.js";
import PageVersion from "../models/PageVersion.js";
import SiteNavigation from "../models/SiteNavigation.js";
import SiteFooter from "../models/SiteFooter.js";
import AdminDashboardConfig from "../models/AdminDashboardConfig.js";
import CustomerDashboardConfig from "../models/CustomerDashboardConfig.js";
import CustomerDashboardVersion from "../models/CustomerDashboardVersion.js";
import AppSetting from "../models/AppSetting.js";
import SettingsAuditLog from "../models/SettingsAuditLog.js";
import SystemEmailTemplate from "../models/SystemEmailTemplate.js";
import DashboardCustomReport from "../models/DashboardCustomReport.js";
import SeatMap from "../models/SeatMap.js";
import Seat from "../models/Seat.js";
import SeatHold from "../models/SeatHold.js";
import Session from "../models/Session.js";
import SessionSlot from "../models/SessionSlot.js";
import SessionBooking from "../models/SessionBooking.js";
import Resource from "../models/Resource.js";
import RSVP from "../models/RSVP.js";
import CheckoutForm from "../models/CheckoutForm.js";
import CheckoutFormResponse from "../models/CheckoutFormResponse.js";
import WaitlistEntry from "../models/WaitlistEntry.js";
import EventHighlightMetric from "../models/EventHighlightMetric.js";
import TeamMember from "../models/TeamMember.js";
import ApiIntegration from "../models/ApiIntegration.js";
import ApiCredential from "../models/ApiCredential.js";
import ApiEndpoint from "../models/ApiEndpoint.js";
import ApiFieldMapping from "../models/ApiFieldMapping.js";
import ApiExecutionLog from "../models/ApiExecutionLog.js";
import ApiWebhookEvent from "../models/ApiWebhookEvent.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import AdminInvitation from "../models/AdminInvitation.js";
import EventInventoryItem from "../models/EventInventoryItem.js";
import GlobalInventoryItem from "../models/GlobalInventoryItem.js";
import TechnicalRiderItem from "../models/TechnicalRiderItem.js";
import StagePlan from "../models/StagePlan.js";
import StagePlanElement from "../models/StagePlanElement.js";
import EventDocument from "../models/EventDocument.js";
import DocumentVersion from "../models/DocumentVersion.js";
import EventChecklistItem from "../models/EventChecklistItem.js";
import EventVendor from "../models/EventVendor.js";
import StripeWebhookEvent from "../models/StripeWebhookEvent.js";

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
  ["checkout_sessions", CheckoutSession],
  ["checkout_audit_logs", CheckoutAuditLog],
  ["membership_checkout_settings", MembershipCheckoutSettings],
  ["cms_pages", Page],
  ["cms_page_versions", PageVersion],
  ["cms_site_navigation", SiteNavigation],
  ["cms_site_footer", SiteFooter],
  ["admin_dashboard_configs", AdminDashboardConfig],
  ["dashboard_custom_reports", DashboardCustomReport],
  ["customer_dashboard_configs", CustomerDashboardConfig],
  ["customer_dashboard_versions", CustomerDashboardVersion],
  ["app_settings", AppSetting],
  ["settings_audit_logs", SettingsAuditLog],
  ["system_email_templates", SystemEmailTemplate],
  ["seat_maps", SeatMap],
  ["seats", Seat],
  ["seat_holds", SeatHold],
  ["sessions", Session],
  ["session_slots", SessionSlot],
  ["session_bookings", SessionBooking],
  ["resources", Resource],
  ["rsvps", RSVP],
  ["checkout_forms", CheckoutForm],
  ["checkout_form_responses", CheckoutFormResponse],
  ["waitlist_entries", WaitlistEntry],
  ["event_highlight_metrics", EventHighlightMetric],
  ["team_members", TeamMember],
  ["api_integrations", ApiIntegration],
  ["api_credentials", ApiCredential],
  ["api_endpoints", ApiEndpoint],
  ["api_field_mappings", ApiFieldMapping],
  ["api_execution_logs", ApiExecutionLog],
  ["api_webhook_events", ApiWebhookEvent],
  ["admin_roles", Role],
  ["admin_permissions", Permission],
  ["admin_invitations", AdminInvitation],
  ["event_inventory_items", EventInventoryItem],
  ["global_inventory_items", GlobalInventoryItem],
  ["technical_rider_items", TechnicalRiderItem],
  ["stage_plans", StagePlan],
  ["stage_plan_elements", StagePlanElement],
  ["event_documents", EventDocument],
  ["document_versions", DocumentVersion],
  ["event_checklist_items", EventChecklistItem],
  ["event_vendors", EventVendor],
  ["stripe_webhook_events", StripeWebhookEvent],
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
