import { getDashboardPayloadForUser } from "./dashboardService.js";
import { getMembershipPageForUser } from "./membershipService.js";
import { getAvailableDiscountsForUser } from "./dashboardAvailableDiscountsService.js";
import { getDashboardEventsForUser } from "./dashboardEventService.js";
import { getUserReferralData } from "./adminDiscountRuleService.js";
import { getReferralProgramSettings } from "./referralProgramSettingsService.js";
import { getPublishedConfig } from "./customerDashboardBuilderService.js";
import { buildUserVisibilityContext, filterSectionsForUser } from "./customerDashboardVisibilityService.js";
import Ticket from "../models/Ticket.js";

async function countUserTickets(user) {
  const email = String(user?.email || "").toLowerCase().trim();
  if (!email) return 0;
  return Ticket.countDocuments({ attendeeEmail: email, status: "valid" }).catch(() => 0);
}

export async function getCustomerDashboardConfigForUser(user) {
  const published = await getPublishedConfig();
  if (!published) return null;

  const [dashboard, membership] = await Promise.all([
    getDashboardPayloadForUser(user),
    getMembershipPageForUser(user).catch(() => null),
  ]);

  const ticketCount = await countUserTickets(user);
  const context = buildUserVisibilityContext({ user, dashboardPayload: dashboard, membershipPayload: membership, ticketCount });

  const settings = { ...published.settings };
  if (settings.welcomeMessage) {
    const name = dashboard.profile?.fullName || user.firstName || "Member";
    settings.welcomeMessage = settings.welcomeMessage.replace(/\{\{name\}\}/g, name);
  }

  return {
    dashboardConfigId: published.dashboardConfigId,
    settings,
    sections: filterSectionsForUser(published.sections, context),
    publishedAt: published.publishedAt,
  };
}

export async function getCustomerDashboardDataForUser(user) {
  const referralSettings = await getReferralProgramSettings();
  const [dashboard, membership, discounts, events, referral] = await Promise.all([
    getDashboardPayloadForUser(user),
    getMembershipPageForUser(user).catch(() => null),
    getAvailableDiscountsForUser(user).catch(() => ({ discounts: [] })),
    getDashboardEventsForUser(user.id).catch(() => ({ events: [] })),
    referralSettings.enabled
      ? getUserReferralData(user.id, user.email).catch(() => null)
      : Promise.resolve(null),
  ]);

  const ticketCount = await countUserTickets(user);

  return {
    profile: dashboard.profile,
    overview: dashboard.overview,
    activity: dashboard.activity,
    membership,
    discounts: discounts?.discounts || [],
    events: events?.events || events || [],
    referral: referral ? { enabled: true, referral } : { enabled: false, referral: null },
    ticketTailor: dashboard.ticketTailor,
    visibilityContext: buildUserVisibilityContext({
      user,
      dashboardPayload: dashboard,
      membershipPayload: membership,
      ticketCount,
    }),
  };
}
