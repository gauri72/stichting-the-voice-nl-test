import EventNotificationSubscriber from "../models/EventNotificationSubscriber.js";
import Event from "../models/Event.js";
import TicketType from "../models/TicketType.js";
import { notifyEventBookingSubscriber, notifyEventBookingSummary } from "./booking/AdminNotificationService.js";

async function getBookedRemaining(eventId) {
  const capacityRows = await TicketType.aggregate([
    { $match: { eventId } },
    { $group: { _id: null, capacity: { $sum: "$capacity" }, sold: { $sum: "$soldCount" } } },
  ]);
  const ticketsBooked = capacityRows[0]?.sold || 0;
  const ticketsRemaining = Math.max(0, (capacityRows[0]?.capacity || 0) - ticketsBooked);
  return { ticketsBooked, ticketsRemaining };
}

export async function listSubscribers() {
  const subscribers = await EventNotificationSubscriber.find({})
    .populate("eventIds", "title")
    .sort({ createdAt: -1 })
    .lean();

  return subscribers.map((s) => ({
    id: s._id.toString(),
    email: s.email,
    events: (s.eventIds || [])
      .filter(Boolean)
      .map((e) => ({ id: e._id.toString(), title: e.title })),
  }));
}

export async function upsertSubscriber(email, eventIds) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    const err = new Error("Email is required.");
    err.status = 400;
    throw err;
  }

  const subscriber = await EventNotificationSubscriber.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { eventIds: eventIds || [] } },
    { upsert: true, new: true }
  );
  return { id: subscriber._id.toString(), email: subscriber.email, eventIds: subscriber.eventIds };
}

export async function deleteSubscriber(id) {
  await EventNotificationSubscriber.deleteOne({ _id: id });
}

export async function listEventsForPicker() {
  const events = await Event.find({ archived: { $ne: true } })
    .select("title")
    .sort({ date: -1 })
    .lean();
  return events.map((e) => ({ id: e._id.toString(), title: e.title }));
}

export async function notifySubscribersOfBooking(order, event, tickets) {
  if (!event?._id) return;

  const subscribers = await EventNotificationSubscriber.find({ eventIds: event._id }).lean();
  if (!subscribers.length) return;

  const { ticketsBooked, ticketsRemaining } = await getBookedRemaining(event._id);

  for (const subscriber of subscribers) {
    try {
      await notifyEventBookingSubscriber({
        to: subscriber.email,
        order,
        event,
        ticketsBooked,
        ticketsRemaining,
      });
    } catch (err) {
      console.warn(`[event-notifications] send to ${subscriber.email} failed:`, err.message);
    }
  }
}

// On-demand digest — one email per subscriber covering every event they're
// subscribed to, with just the current booked/remaining totals (no order-
// specific details, since this isn't tied to any one booking).
export async function sendCurrentSummaryToAllSubscribers() {
  const subscribers = await EventNotificationSubscriber.find({ "eventIds.0": { $exists: true } })
    .populate("eventIds", "title")
    .lean();

  const bookedRemainingCache = new Map();
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const events = (subscriber.eventIds || []).filter(Boolean);
    if (!events.length) continue;

    const eventSummaries = [];
    for (const event of events) {
      const key = event._id.toString();
      if (!bookedRemainingCache.has(key)) {
        bookedRemainingCache.set(key, await getBookedRemaining(event._id));
      }
      const { ticketsBooked, ticketsRemaining } = bookedRemainingCache.get(key);
      eventSummaries.push({ title: event.title, ticketsBooked, ticketsRemaining });
    }

    try {
      await notifyEventBookingSummary({ to: subscriber.email, eventSummaries });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.warn(`[event-notifications] summary send to ${subscriber.email} failed:`, err.message);
    }
  }

  return { sent, failed, totalSubscribers: subscribers.length };
}
