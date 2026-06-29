import { getDashboardPayloadForUser } from "../services/dashboardService.js";
import {
  getDashboardEventsForUser,
  getUpcomingBookingsForUser,
  getEventTicketsForUser,
  getEventBookingStatusForUser,
} from "../services/dashboardEventService.js";
import { getAvailableDiscountsForUser } from "../services/dashboardAvailableDiscountsService.js";
import { getDashboardGivingForUser } from "../services/dashboardGivingService.js";
import { getUserReferralData } from "../services/adminDiscountRuleService.js";
import { REFERRAL_SYSTEM_ENABLED } from "../config/discountConfig.js";
import env from "../config/env.js";
import { getMembershipPageForUser, ensureDemoMembership } from "../services/membershipService.js";
import {
  createAppleWalletPass,
  createGoogleWalletSaveUrl,
  resolveWalletContext,
} from "../services/membershipWalletService.js";

export async function getDashboard(req, res) {
  try {
    const data = await getDashboardPayloadForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Dashboard unavailable.";
    if (status >= 500) {
      console.error("[dashboard]", error);
    }
    return res.status(status).json({ error: message });
  }
}

export async function getMemberships(req, res) {
  try {
    const data = await getMembershipPageForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Membership data unavailable.";
    if (status >= 500) {
      console.error("[dashboard/memberships]", error);
    }
    return res.status(status).json({ error: message });
  }
}

/** Dev helper: create a sample membership for the logged-in user if none exists. */
export async function seedMembership(req, res) {
  if (env.nodeEnv === "production") {
    return res.status(404).json({ error: "Not found." });
  }
  try {
    await ensureDemoMembership(req.user.id);
    const data = await getMembershipPageForUser(req.user);
    return res.status(201).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Could not create membership.";
    return res.status(status).json({ error: message });
  }
}

export async function getAppleWalletPass(req, res) {
  try {
    const context = await resolveWalletContext(req.user);
    const buffer = await createAppleWalletPass(context);
    const filename = `voice-membership-${context.membershipCode || "card"}.pkpass`;
    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Could not create Apple Wallet pass.";
    if (status >= 500) {
      console.error("[dashboard/wallet/apple]", error);
    }
    return res.status(status).json({ error: message });
  }
}

export async function getGoogleWalletPass(req, res) {
  try {
    const context = await resolveWalletContext(req.user);
    const saveUrl = await createGoogleWalletSaveUrl(context);
    return res.status(200).json({ saveUrl });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Could not create Google Wallet pass.";
    if (status >= 500) {
      console.error("[dashboard/wallet/google]", error);
    }
    return res.status(status).json({ error: message });
  }
}

export async function getReferrals(req, res) {
  if (!REFERRAL_SYSTEM_ENABLED) {
    return res.status(200).json({ enabled: false, referral: null });
  }
  try {
    const referral = await getUserReferralData(req.user.id, req.user.email);
    return res.status(200).json({ enabled: true, referral });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Referral data unavailable.";
    if (status >= 500) console.error("[dashboard/referrals]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getAvailableDiscounts(req, res) {
  try {
    const data = await getAvailableDiscountsForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Discounts unavailable.";
    if (status >= 500) console.error("[dashboard/available-discounts]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardEvents(req, res) {
  try {
    const data = await getDashboardEventsForUser(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Events unavailable.";
    if (status >= 500) console.error("[dashboard/events]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardGiving(req, res) {
  try {
    const data = await getDashboardGivingForUser(req.user);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Giving history unavailable.";
    if (status >= 500) console.error("[dashboard/giving]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardBookings(req, res) {
  try {
    const data = await getUpcomingBookingsForUser(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Bookings unavailable.";
    if (status >= 500) console.error("[dashboard/bookings]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardEventTickets(req, res) {
  try {
    const data = await getEventTicketsForUser(req.user.id, req.params.eventId);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Tickets unavailable.";
    if (status >= 500) console.error("[dashboard/events/tickets]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardEventBookingStatus(req, res) {
  try {
    const data = await getEventBookingStatusForUser(req.user.id, req.params.eventId);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Booking status unavailable.";
    if (status >= 500) console.error("[dashboard/events/booking-status]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardSessions(req, res) {
  try {
    const SessionBooking = (await import("../models/SessionBooking.js")).default;
    const bookings = await SessionBooking.find({
      $or: [{ userId: req.user.id }, { customerEmail: String(req.user.email || "").toLowerCase() }],
    })
      .sort({ startsAt: 1 })
      .lean();
    const upcoming = bookings.filter((b) => new Date(b.startsAt) >= new Date());
    const past = bookings.filter((b) => new Date(b.startsAt) < new Date());
    return res.status(200).json({ upcoming, past });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Sessions unavailable.";
    if (status >= 500) console.error("[dashboard/sessions]", error);
    return res.status(status).json({ error: message });
  }
}

export async function getDashboardRsvps(req, res) {
  try {
    const RSVP = (await import("../models/RSVP.js")).default;
    const email = String(req.user.email || "").toLowerCase();
    const events = await RSVP.find({ "responses.email": email }).lean();
    const responses = [];
    for (const event of events) {
      for (const response of event.responses || []) {
        if (String(response.email || "").toLowerCase() !== email) continue;
        responses.push({
          eventSlug: event.eventSlug,
          eventName: event.eventName,
          eventDate: event.eventDate,
          status: response.status,
          guestCount: response.guestCount || 0,
          attended: Boolean(response.attended),
          submittedAt: response.createdAt || null,
        });
      }
    }
    responses.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    return res.status(200).json({ responses });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "RSVPs unavailable.";
    if (status >= 500) console.error("[dashboard/rsvps]", error);
    return res.status(status).json({ error: message });
  }
}
