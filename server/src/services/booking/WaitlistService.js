import WaitlistEntry from "../../models/WaitlistEntry.js";
import { getNextSequence } from "../../utils/sequence.js";
import { sendSimpleEmail } from "./EmailNotificationService.js";
import { notifyAdminBooking } from "./AdminNotificationService.js";

async function nextWaitlistId() {
  const seq = await getNextSequence("waitlist");
  return `WL-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

export async function joinWaitlist(payload = {}) {
  const {
    resourceType,
    resourceId,
    eventId = null,
    ticketTypeId = null,
    sessionId = null,
    userId = null,
    email,
    firstName = "",
    lastName = "",
    phone = "",
    quantity = 1,
  } = payload;

  if (!resourceType || !resourceId || !email) {
    const err = new Error("resourceType, resourceId, and email are required.");
    err.status = 400;
    throw err;
  }

  const existing = await WaitlistEntry.findOne({
    resourceType,
    resourceId,
    email: String(email).toLowerCase(),
    status: { $in: ["waiting", "notified"] },
  }).lean();
  if (existing) {
    return { entry: existing, alreadyJoined: true };
  }

  const lastPosition = await WaitlistEntry.findOne({ resourceType, resourceId, status: "waiting" })
    .sort({ position: -1 })
    .lean();
  const position = (lastPosition?.position || 0) + 1;

  const entry = await WaitlistEntry.create({
    waitlistId: await nextWaitlistId(),
    resourceType,
    resourceId,
    eventId,
    ticketTypeId,
    sessionId,
    userId,
    email: String(email).toLowerCase(),
    firstName,
    lastName,
    phone,
    quantity: Number(quantity) || 1,
    position,
    status: "waiting",
  });

  await sendSimpleEmail({
    to: email,
    subject: "You joined the waitlist — Stichting The V.O.I.C.E. NL",
    html: `<p>Hi ${firstName || "there"},</p><p>You are #${position} on the waitlist. We will notify you when spots become available.</p>`,
    text: `You joined the waitlist at position #${position}.`,
  });

  await notifyAdminBooking({
    kind: "waitlist_joined",
    subject: `Waitlist: ${email} joined (#${position})`,
    summary: `${email} joined waitlist for ${resourceType}`,
    details: { resourceType, resourceId: String(resourceId), position },
  });

  return { entry: entry.toObject(), alreadyJoined: false };
}

export async function notifyWaitlistAvailability({ resourceType, resourceId, purchaseWindowHours = 48 }) {
  const next = await WaitlistEntry.findOne({ resourceType, resourceId, status: "waiting" })
    .sort({ position: 1 })
    .exec();
  if (!next) return { notified: false };

  const purchaseWindowEndsAt = new Date(Date.now() + purchaseWindowHours * 60 * 60 * 1000);
  next.status = "notified";
  next.notifiedAt = new Date();
  next.purchaseWindowEndsAt = purchaseWindowEndsAt;
  await next.save();

  await sendSimpleEmail({
    to: next.email,
    subject: "A spot is available — complete your booking",
    html: `<p>Hi ${next.firstName || "there"},</p><p>A spot is now available. Complete your booking before ${purchaseWindowEndsAt.toISOString()}.</p>`,
    text: "A spot is available. Complete your booking soon.",
  });

  return { notified: true, entry: next.toObject() };
}

export async function markWaitlistConverted(waitlistId, orderId) {
  const entry = await WaitlistEntry.findOneAndUpdate(
    { waitlistId },
    { status: "converted", convertedOrderId: orderId },
    { new: true }
  );
  return entry?.toObject() || null;
}

export async function listWaitlistEntries(filters = {}) {
  const query = {};
  if (filters.resourceType) query.resourceType = filters.resourceType;
  if (filters.resourceId) query.resourceId = filters.resourceId;
  if (filters.status) query.status = filters.status;
  return WaitlistEntry.find(query).sort({ position: 1 }).lean();
}
