import crypto from "crypto";
import Session from "../models/Session.js";
import SessionSlot from "../models/SessionSlot.js";
import SessionBooking from "../models/SessionBooking.js";
import Resource from "../models/Resource.js";
import Membership from "../models/Membership.js";
import RSVP from "../models/RSVP.js";
import { getNextSequence } from "../utils/sequence.js";
import { buildTicketQrPath } from "./ticketQrService.js";
import { createTicketPaymentIntent, confirmTicketPayment } from "./ticketPaymentService.js";
import { getMailFromAddress, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";
import { validateDiscountCode, calculateDiscountAmount } from "./discountService.js";
import { generateSessionBookingPdf, generateRsvpPdf } from "./sessionPdfService.js";
import { notifyAdminSessionBooking } from "./booking/AdminNotificationService.js";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function throwError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function normalizeDateOnly(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseTimeToMinutes(value) {
  const [h, m] = String(value || "").split(":").map((n) => Number(n || 0));
  return h * 60 + m;
}

function combineDateAndTime(date, hhmm) {
  const base = new Date(date);
  const mins = parseTimeToMinutes(hhmm);
  base.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return base;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

async function nextId(prefix, seqKey) {
  const seq = await getNextSequence(seqKey);
  return `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

function formatSession(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    sessionId: doc.sessionId,
    slug: doc.slug,
    name: doc.name,
    description: doc.description || "",
    category: doc.category || "",
    bookingType: doc.bookingType,
    mode: doc.mode,
    location: doc.location || "",
    onlineMeetingUrl: doc.onlineMeetingUrl || "",
    imageUrl: doc.imageUrl || "",
    capacity: doc.capacity,
    priceMinor: doc.priceMinor,
    price: `€${((doc.priceMinor || 0) / 100).toFixed(2)}`,
    durationMinutes: doc.durationMinutes,
    bufferMinutes: doc.bufferMinutes,
    status: doc.status,
    resourceIds: doc.resourceIds || [],
    staffAssignment: doc.staffAssignment || "",
    bookingRules: doc.bookingRules || {},
    membershipSettings: doc.membershipSettings || {},
    paymentMode: doc.paymentMode || "full",
    depositMinor: doc.depositMinor || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function formatSlot(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    slotId: doc.slotId,
    sessionId: doc.sessionId,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    capacity: doc.capacity,
    remainingCapacity: doc.remainingCapacity,
    priceMinor: doc.priceMinor,
    resourceIds: doc.resourceIds || [],
    isBlocked: doc.isBlocked,
    blockReason: doc.blockReason || "",
    recurrenceRule: doc.recurrenceRule || "",
  };
}

function formatSessionBooking(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    bookingId: doc.bookingId,
    sessionId: doc.sessionId,
    slotId: doc.slotId,
    userId: doc.userId?.toString?.() || doc.userId || null,
    customerName: doc.customerName,
    customerEmail: doc.customerEmail,
    customerPhone: doc.customerPhone || "",
    participants: doc.participants || 1,
    amountMinor: doc.amountMinor || 0,
    discountMinor: doc.discountMinor || 0,
    totalMinor: doc.totalMinor || 0,
    total: `€${((doc.totalMinor || 0) / 100).toFixed(2)}`,
    paymentStatus: doc.paymentStatus || "pending",
    bookingStatus: doc.bookingStatus || "pending",
    discountCode: doc.discountCode || "",
    membershipDiscountApplied: Boolean(doc.membershipDiscountApplied),
    checkInToken: doc.checkInToken,
    qrCodeUrl: doc.qrCodeUrl,
    pdfUrl: doc.pdfUrl,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    checkedInAt: doc.checkedInAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function formatResource(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    resourceId: doc.resourceId,
    name: doc.name,
    type: doc.type,
    description: doc.description || "",
    location: doc.location || "",
    status: doc.status || "active",
    metadata: doc.metadata || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function formatRsvpPublic(r) {
  if (!r) return null;
  const used = (r.responses || [])
    .filter((x) => x.status === "yes")
    .reduce((sum, x) => sum + 1 + Number(x.guestCount || 0), 0);
  return {
    eventSlug: r.eventSlug,
    eventName: r.eventName,
    eventDescription: r.eventDescription || "",
    hostName: r.hostName || "",
    imageUrl: r.imageUrl || "",
    eventDate: r.eventDate,
    startTime: r.startTime || "",
    endTime: r.endTime || "",
    venue: r.venue || "",
    capacity: r.capacity || 0,
    capacityRemaining: r.capacity > 0 ? Math.max(0, r.capacity - used) : null,
    rsvpDeadline: r.rsvpDeadline,
    allowGuests: Boolean(r.allowGuests),
    maxGuests: r.maxGuests || 0,
    rsvpQuestions: r.rsvpQuestions || [],
    qrEnabled: Boolean(r.qrEnabled),
    pdfEnabled: Boolean(r.pdfEnabled),
    waitlistEnabled: Boolean(r.waitlistEnabled),
    status: r.status,
  };
}

async function sendSimpleEmail({ to, subject, html, text }) {
  if (!isMailerConfigured()) return;
  const tx = getSmtpTransporter();
  if (!tx) return;
  await tx.sendMail({ from: getMailFromAddress(), to, subject, html, text });
}

async function assertNoResourceConflicts({
  sessionId,
  startsAt,
  endsAt,
  resourceIds = [],
  ignoreSlotId = null,
}) {
  if (!resourceIds.length) return;
  const candidates = await SessionSlot.find({
    isBlocked: false,
    resourceIds: { $in: resourceIds },
    ...(ignoreSlotId ? { slotId: { $ne: ignoreSlotId } } : {}),
  })
    .select("slotId sessionId startsAt endsAt resourceIds")
    .lean();
  const conflicts = candidates.filter((slot) => overlaps(startsAt, endsAt, slot.startsAt, slot.endsAt));
  if (!conflicts.length) return;
  const conflictResources = new Set();
  for (const c of conflicts) {
    for (const rid of c.resourceIds || []) {
      if (resourceIds.includes(rid)) conflictResources.add(rid);
    }
  }
  throwError(
    `Resource conflict detected for ${[...conflictResources].join(", ")}. Slot overlaps with existing bookings.`,
    409
  );
}

export async function listPublicSessions() {
  const sessions = await Session.find({ status: "published" }).sort({ createdAt: -1 }).lean();
  return sessions.map(formatSession);
}

export async function getPublicSessionBySlug(slug) {
  const session = await Session.findOne({ slug, status: { $in: ["published", "fully_booked"] } }).lean();
  if (!session) throwError("Session not found.", 404);
  const slots = await SessionSlot.find({
    sessionId: session.sessionId,
    startsAt: { $gte: new Date() },
    isBlocked: false,
  })
    .sort({ startsAt: 1 })
    .limit(200)
    .lean();
  return { session: formatSession(session), slots: slots.map(formatSlot) };
}

export async function createSession(payload, adminId) {
  const sessionId = await nextId("SES", "session");
  const slug = slugify(payload.slug || payload.name || sessionId);
  const exists = await Session.findOne({ slug }).lean();
  if (exists) throwError("Session slug already exists.");
  const doc = await Session.create({
    sessionId,
    slug,
    name: payload.name,
    description: payload.description || "",
    category: payload.category || "",
    bookingType: payload.bookingType || "class_booking",
    mode: payload.mode || "offline",
    location: payload.location || "",
    onlineMeetingUrl: payload.onlineMeetingUrl || "",
    imageUrl: payload.imageUrl || "",
    capacity: Number(payload.capacity || 1),
    priceMinor: Number(payload.priceMinor || 0),
    durationMinutes: Number(payload.durationMinutes || 60),
    bufferMinutes: Number(payload.bufferMinutes || 0),
    status: payload.status || "draft",
    resourceIds: payload.resourceIds || [],
    staffAssignment: payload.staffAssignment || "",
    bookingRules: payload.bookingRules || {},
    membershipSettings: payload.membershipSettings || {},
    paymentMode: payload.paymentMode || "full",
    depositMinor: Number(payload.depositMinor || 0),
    createdBy: adminId || null,
    updatedBy: adminId || null,
  });
  return formatSession(doc.toObject());
}

export async function updateSession(id, payload, adminId) {
  const doc = await Session.findById(id);
  if (!doc) throwError("Session not found.", 404);
  const keys = [
    "name", "description", "category", "bookingType", "mode", "location",
    "onlineMeetingUrl", "imageUrl", "capacity", "priceMinor", "durationMinutes",
    "bufferMinutes", "status", "resourceIds", "staffAssignment", "bookingRules",
    "membershipSettings", "paymentMode", "depositMinor",
  ];
  for (const key of keys) if (payload[key] !== undefined) doc[key] = payload[key];
  if (payload.slug && payload.slug !== doc.slug) doc.slug = slugify(payload.slug);
  doc.updatedBy = adminId || null;
  await doc.save();
  return formatSession(doc.toObject());
}

export async function listAdminSessions(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  const sessions = await Session.find(filter).sort({ createdAt: -1 }).lean();
  return sessions.map(formatSession);
}

export async function createSessionSlot(sessionId, payload) {
  const session = await Session.findOne({ sessionId }).lean();
  if (!session) throwError("Session not found.", 404);
  const startsAt = new Date(payload.startsAt);
  const endsAt = new Date(payload.endsAt || startsAt.getTime() + (session.durationMinutes || 60) * 60000);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) throwError("Invalid slot dates.");
  const slotId = await nextId("SLT", "session_slot");
  const chosenResources = payload.resourceIds || session.resourceIds || [];
  await assertNoResourceConflicts({
    sessionId: session.sessionId,
    startsAt,
    endsAt,
    resourceIds: chosenResources,
  });
  const doc = await SessionSlot.create({
    slotId,
    sessionId: session.sessionId,
    eventId: session._id,
    startsAt,
    endsAt,
    capacity: Number(payload.capacity || session.capacity || 1),
    remainingCapacity: Number(payload.capacity || session.capacity || 1),
    priceMinor: Number(payload.priceMinor ?? session.priceMinor ?? 0),
    resourceIds: chosenResources,
    isBlocked: Boolean(payload.isBlocked),
    blockReason: payload.blockReason || "",
    recurrenceRule: payload.recurrenceRule || "",
  });
  return formatSlot(doc.toObject());
}

export async function createRecurringSessionSlots(sessionId, payload = {}) {
  const session = await Session.findOne({ sessionId }).lean();
  if (!session) throwError("Session not found.", 404);

  const startDate = normalizeDateOnly(payload.startDate || new Date());
  const endDate = normalizeDateOnly(payload.endDate || startDate);
  if (endDate < startDate) throwError("End date must be on or after start date.");
  const startTime = payload.startTime || "09:00";
  const endTime = payload.endTime || "10:00";
  const frequency = payload.frequency || "weekly";
  const every = Math.max(1, Number(payload.every || 1));
  const weekdays = (payload.weekdays || [1, 3, 5]).map((n) => Number(n));
  const blockedDates = new Set((payload.blockedDates || []).map((d) => normalizeDateOnly(d).toISOString()));
  const created = [];

  for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    const c = new Date(cursor);
    const day = c.getDay();
    const dayIndex = Math.floor((c - startDate) / 86400000);
    let include = false;
    if (frequency === "daily") include = dayIndex % every === 0;
    else if (frequency === "weekly") include = weekdays.includes(day) && Math.floor(dayIndex / 7) % every === 0;
    else if (frequency === "monthly") include = c.getDate() === startDate.getDate();
    else include = weekdays.includes(day);
    if (!include) continue;
    if (blockedDates.has(normalizeDateOnly(c).toISOString())) continue;

    const startsAt = combineDateAndTime(c, startTime);
    const endsAt = combineDateAndTime(c, endTime);
    if (endsAt <= startsAt) continue;
    try {
      const slot = await createSessionSlot(sessionId, {
        startsAt,
        endsAt,
        capacity: payload.capacity || session.capacity,
        priceMinor: payload.priceMinor ?? session.priceMinor,
        resourceIds: payload.resourceIds || session.resourceIds || [],
        recurrenceRule: `${frequency}:${every}:${weekdays.join(",")}`,
      });
      created.push(slot);
    } catch (err) {
      if ((err.status || 500) === 409) continue;
      throw err;
    }
  }
  return created;
}

export async function blockSessionDate(sessionId, payload = {}) {
  const start = combineDateAndTime(payload.date, "00:00");
  const end = combineDateAndTime(payload.date, "23:59");
  const result = await SessionSlot.updateMany(
    {
      sessionId,
      startsAt: { $gte: start, $lte: end },
    },
    { $set: { isBlocked: true, blockReason: payload.reason || "Blocked date" } }
  );
  return { blocked: result.modifiedCount };
}

export async function listSessionSlots(sessionId) {
  const slots = await SessionSlot.find({ sessionId }).sort({ startsAt: 1 }).lean();
  return slots.map(formatSlot);
}

async function hasMembershipDiscount(session, userId) {
  if (!userId) return { discountPercent: 0, free: false };
  const active = await Membership.findOne({ userId, active: true, endsAt: { $gte: new Date() } }).lean();
  if (!active) return { discountPercent: 0, free: false };
  const settings = session.membershipSettings || {};
  const isPremiumPlan = String(active.planId || "").toLowerCase().includes("premium");
  return {
    discountPercent: Number(settings.memberDiscountPercent || 0),
    free: Boolean(settings.freeForPremium && isPremiumPlan),
  };
}

export async function createPublicSessionBooking(payload, userId) {
  const session = await Session.findOne({ slug: payload.sessionSlug }).lean();
  if (!session || session.status !== "published") throwError("Session unavailable.", 404);
  if (session.membershipSettings?.memberOnly && !userId) throwError("This session is for members only.", 403);
  const slot = await SessionSlot.findOne({ slotId: payload.slotId, sessionId: session.sessionId });
  if (!slot) throwError("Selected slot not found.", 404);
  if (slot.isBlocked) throwError("Selected slot is blocked.");
  const participants = Math.max(1, Number(payload.participants || 1));
  if (slot.remainingCapacity < participants) throwError("Not enough capacity in this slot.");
  const discountInfo = await hasMembershipDiscount(session, userId);
  const baseMinor = Number(slot.priceMinor || session.priceMinor || 0) * participants;
  let discountMinor = discountInfo.free
    ? baseMinor
    : Math.round((baseMinor * Number(discountInfo.discountPercent || 0)) / 100);
  let discountLabel = discountMinor > 0 ? "Membership discount" : "";
  if (payload.discountCode) {
    const codeRule = await validateDiscountCode(
      payload.discountCode,
      userId || null,
      String(payload.customerEmail || "").trim().toLowerCase(),
      null,
      "tickets",
      baseMinor
    );
    const codeDiscount = calculateDiscountAmount(baseMinor - discountMinor, codeRule);
    if (codeDiscount > 0) {
      discountMinor += codeDiscount;
      discountLabel = codeRule.label || "Discount code";
    }
  }
  discountMinor = Math.min(discountMinor, baseMinor);
  const totalMinor = Math.max(0, baseMinor - discountMinor);
  const bookingId = await nextId("SBK", "session_booking");
  const checkInToken = crypto.randomUUID();
  const qrCodeUrl = buildTicketQrPath(checkInToken);

  const booking = await SessionBooking.create({
    bookingId,
    sessionId: session.sessionId,
    slotId: slot.slotId,
    userId: userId || null,
    customerName: payload.customerName,
    customerEmail: String(payload.customerEmail || "").trim().toLowerCase(),
    customerPhone: payload.customerPhone || "",
    participants,
    resourceIds: slot.resourceIds || [],
    amountMinor: baseMinor,
    discountMinor,
    totalMinor,
    paymentStatus: totalMinor <= 0 ? "free" : payload.payLater ? "pay_later" : "pending",
    bookingStatus: totalMinor <= 0 || payload.payLater ? "confirmed" : "pending",
    discountCode: payload.discountCode || "",
    membershipDiscountApplied: discountMinor > 0,
    checkInToken,
    qrCodeUrl,
    pdfUrl: `/api/public/session-bookings/${bookingId}/pdf?token=${checkInToken}`,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    notes: payload.notes || "",
  });

  let payment = null;
  if (totalMinor > 0 && !payload.payLater) {
    payment = await createTicketPaymentIntent({
      orderId: booking._id.toString(),
      orderNumber: booking.bookingId,
      amountMinor: totalMinor,
      eventTitle: session.name,
      orderType: "TICKET_ONLY",
      includeMembership: false,
    });
    booking.paymentIntentId = payment.paymentIntentId || "";
    await booking.save();
  } else {
    slot.remainingCapacity -= participants;
    await slot.save();
    await sendSimpleEmail({
      to: booking.customerEmail,
      subject: `Session booking confirmed: ${session.name}`,
      text: `Booking ${booking.bookingId} confirmed for ${session.name} on ${booking.startsAt.toISOString()}.`,
      html: `<div style="font-family:Arial,sans-serif">
        <h2>Session Booking Confirmed</h2>
        <p><strong>Booking:</strong> ${booking.bookingId}</p>
        <p><strong>Session:</strong> ${session.name}</p>
        <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleString("en-GB")}</p>
        <p><strong>Location:</strong> ${session.location || "Online"}</p>
        <p><strong>Participants:</strong> ${booking.participants}</p>
        <p><strong>Discount:</strong> ${discountLabel || "None"}</p>
        <p><strong>Total:</strong> €${(booking.totalMinor / 100).toFixed(2)}</p>
        <p><a href="${booking.pdfUrl}">Download PDF</a></p>
      </div>`,
    });
  }
  return { booking: formatSessionBooking(booking.toObject()), payment };
}

export async function confirmSessionBookingPayment(bookingId, paymentIntentId) {
  const booking = await SessionBooking.findOne({ bookingId });
  if (!booking) throwError("Booking not found.", 404);
  if (booking.paymentStatus === "paid" || booking.paymentStatus === "free") {
    return { booking: formatSessionBooking(booking.toObject()), alreadyConfirmed: true };
  }
  const confirmed = await confirmTicketPayment(paymentIntentId || booking.paymentIntentId);
  if (!confirmed.success) throwError(confirmed.error || "Payment not confirmed.");
  const slot = await SessionSlot.findOne({ slotId: booking.slotId, sessionId: booking.sessionId });
  if (!slot || slot.remainingCapacity < booking.participants) throwError("Session slot is no longer available.", 409);
  slot.remainingCapacity -= booking.participants;
  booking.paymentStatus = "paid";
  booking.bookingStatus = "confirmed";
  await Promise.all([slot.save(), booking.save()]);
  const session = await Session.findOne({ sessionId: booking.sessionId }).lean();
  await sendSimpleEmail({
    to: booking.customerEmail,
    subject: `Payment confirmed: ${session?.name || "Session"}`,
    text: `Your booking ${booking.bookingId} is now fully confirmed.`,
    html: `<div style="font-family:Arial,sans-serif">
      <h2>Payment Confirmed</h2>
      <p>Your booking <strong>${booking.bookingId}</strong> is confirmed.</p>
      <p><strong>Session:</strong> ${session?.name || booking.sessionId}</p>
      <p><strong>Date:</strong> ${new Date(booking.startsAt).toLocaleString("en-GB")}</p>
      <p><a href="${booking.pdfUrl}">Download Booking PDF</a></p>
    </div>`,
  });
  await notifyAdminSessionBooking({
    session,
    booking: { email: booking.customerEmail, slotLabel: slot.slotId, totalMinor: booking.totalMinor },
  }).catch((err) => console.error("[sessions] admin notification failed:", err.message));
  return { booking: formatSessionBooking(booking.toObject()) };
}

export async function listAdminSessionBookings(query = {}) {
  const filter = {};
  if (query.sessionId) filter.sessionId = query.sessionId;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.bookingStatus) filter.bookingStatus = query.bookingStatus;
  const bookings = await SessionBooking.find(filter).sort({ startsAt: 1 }).lean();
  return bookings.map(formatSessionBooking);
}

export async function updateSessionBooking(id, payload) {
  const booking = await SessionBooking.findById(id);
  if (!booking) throwError("Booking not found.", 404);
  if (payload.bookingStatus && payload.bookingStatus !== booking.bookingStatus) {
    if (payload.bookingStatus === "cancelled" && booking.bookingStatus !== "cancelled") {
      const slot = await SessionSlot.findOne({ slotId: booking.slotId, sessionId: booking.sessionId });
      if (slot) {
        slot.remainingCapacity = Math.min(slot.capacity, slot.remainingCapacity + booking.participants);
        await slot.save();
      }
      booking.cancelledAt = new Date();
    }
    booking.bookingStatus = payload.bookingStatus;
  }
  if (payload.paymentStatus) booking.paymentStatus = payload.paymentStatus;
  if (payload.slotId && payload.slotId !== booking.slotId) {
    const oldSlot = await SessionSlot.findOne({ slotId: booking.slotId, sessionId: booking.sessionId });
    const newSlot = await SessionSlot.findOne({ slotId: payload.slotId, sessionId: booking.sessionId });
    if (!newSlot) throwError("Target slot not found.", 404);
    if (newSlot.remainingCapacity < booking.participants) throwError("Target slot is full.");
    if (oldSlot) {
      oldSlot.remainingCapacity = Math.min(oldSlot.capacity, oldSlot.remainingCapacity + booking.participants);
      await oldSlot.save();
    }
    newSlot.remainingCapacity -= booking.participants;
    await newSlot.save();
    booking.slotId = newSlot.slotId;
    booking.startsAt = newSlot.startsAt;
    booking.endsAt = newSlot.endsAt;
    booking.bookingStatus = "rescheduled";
    await sendSimpleEmail({
      to: booking.customerEmail,
      subject: `Booking rescheduled: ${booking.bookingId}`,
      text: `Your booking has been rescheduled to ${new Date(booking.startsAt).toISOString()}.`,
      html: `<p>Your booking <strong>${booking.bookingId}</strong> has been rescheduled to ${new Date(
        booking.startsAt
      ).toLocaleString("en-GB")}.</p>`,
    });
  }
  if (payload.bookingStatus === "cancelled") {
    await sendSimpleEmail({
      to: booking.customerEmail,
      subject: `Booking cancelled: ${booking.bookingId}`,
      text: `Your booking ${booking.bookingId} has been cancelled.`,
      html: `<p>Your booking <strong>${booking.bookingId}</strong> has been cancelled.</p>`,
    });
  }
  await booking.save();
  return formatSessionBooking(booking.toObject());
}

export async function listResources(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  const docs = await Resource.find(filter).sort({ createdAt: -1 }).lean();
  return docs.map(formatResource);
}

export async function createResource(payload) {
  const resourceId = await nextId("RES", "resource");
  const doc = await Resource.create({
    resourceId,
    name: payload.name,
    type: payload.type || "other",
    description: payload.description || "",
    location: payload.location || "",
    status: payload.status || "active",
    metadata: payload.metadata || {},
  });
  return formatResource(doc.toObject());
}

export async function createRsvpEvent(payload, adminId) {
  const rsvpId = await nextId("RSVPE", "rsvp_event");
  const eventSlug = slugify(payload.eventSlug || payload.eventName || rsvpId);
  const exists = await RSVP.findOne({ eventSlug }).lean();
  if (exists) throwError("RSVP slug already exists.");
  const doc = await RSVP.create({
    rsvpId,
    eventSlug,
    eventName: payload.eventName,
    eventDescription: payload.eventDescription || "",
    hostName: payload.hostName || "",
    imageUrl: payload.imageUrl || "",
    eventDate: payload.eventDate,
    startTime: payload.startTime || "",
    endTime: payload.endTime || "",
    venue: payload.venue || "",
    capacity: Number(payload.capacity || 0),
    rsvpDeadline: payload.rsvpDeadline || null,
    allowGuests: Boolean(payload.allowGuests),
    maxGuests: Number(payload.maxGuests || 0),
    rsvpQuestions: payload.rsvpQuestions || [],
    qrEnabled: payload.qrEnabled !== false,
    pdfEnabled: Boolean(payload.pdfEnabled),
    waitlistEnabled: Boolean(payload.waitlistEnabled),
    status: payload.status || "draft",
    createdBy: adminId || null,
    updatedBy: adminId || null,
  });
  return formatRsvpPublic(doc.toObject());
}

export async function listAdminRsvpEvents() {
  const events = await RSVP.find({}).sort({ eventDate: -1 }).lean();
  return events.map((e) => ({ ...formatRsvpPublic(e), responseCount: (e.responses || []).length }));
}

export async function getPublicRsvpEvent(slug) {
  const event = await RSVP.findOne({ eventSlug: slug, status: { $in: ["published", "closed"] } }).lean();
  if (!event) throwError("RSVP event not found.", 404);
  return formatRsvpPublic(event);
}

export async function submitRsvpResponse(slug, payload) {
  const event = await RSVP.findOne({ eventSlug: slug });
  if (!event || event.status !== "published") throwError("RSVP event unavailable.", 404);
  if (event.rsvpDeadline && new Date(event.rsvpDeadline) < new Date()) throwError("RSVP deadline passed.");
  const status = payload.status;
  if (!["yes", "maybe", "no"].includes(status)) throwError("Invalid RSVP response.");
  const guestCount = event.allowGuests ? Math.min(Number(payload.guestCount || 0), Number(event.maxGuests || 0)) : 0;
  if (event.capacity > 0 && status === "yes") {
    const used = (event.responses || [])
      .filter((x) => x.status === "yes")
      .reduce((sum, x) => sum + 1 + Number(x.guestCount || 0), 0);
    const proposed = used + 1 + guestCount;
    if (proposed > event.capacity) {
      if (!event.waitlistEnabled) throwError("This event is fully booked.", 409);
    }
  }
  const responseId = await nextId("RSVP", "rsvp_response");
  const checkInToken = crypto.randomUUID();
  const response = {
    responseId,
    eventSlug: slug,
    name: payload.name,
    email: String(payload.email || "").trim().toLowerCase(),
    status,
    guestCount,
    guestNames: payload.guestNames || [],
    foodPreference: payload.foodPreference || "",
    messageToHost: payload.messageToHost || "",
    attended: false,
    checkInToken,
    qrCodeUrl: event.qrEnabled ? buildTicketQrPath(checkInToken) : "",
    pdfUrl: event.pdfEnabled
      ? `/api/public/rsvp/${slug}/responses/${responseId}/pdf?token=${checkInToken}`
      : "",
  };
  event.responses.push(response);
  await event.save();
  await sendSimpleEmail({
    to: response.email,
    subject: `RSVP received: ${event.eventName}`,
    text: `Your RSVP status is "${status}" for ${event.eventName}.`,
    html: `<div style="font-family:Arial,sans-serif">
      <h2>RSVP Confirmation</h2>
      <p>Event: <strong>${event.eventName}</strong></p>
      <p>Status: <strong>${status}</strong></p>
      <p>Date: ${new Date(event.eventDate).toLocaleDateString("en-GB")} ${event.startTime || ""}</p>
      <p>Venue: ${event.venue || "—"}</p>
      ${
        response.pdfUrl
          ? `<p><a href="${response.pdfUrl}">Download RSVP PDF</a></p>`
          : ""
      }
    </div>`,
  });
  const adminNotice = event.createdBy ? await (await import("../models/Admin.js")).default.findById(event.createdBy).lean() : null;
  if (adminNotice?.email) {
    await sendSimpleEmail({
      to: adminNotice.email,
      subject: `New RSVP response: ${event.eventName}`,
      text: `${response.name} responded "${status}"`,
      html: `<p><strong>${response.name}</strong> (${response.email}) responded <strong>${status}</strong> with ${response.guestCount} guests.</p>`,
    });
  }
  return response;
}

export async function listAdminRsvpResponses(query = {}) {
  const filter = {};
  if (query.eventSlug) filter.eventSlug = query.eventSlug;
  const events = await RSVP.find(filter).lean();
  const rows = [];
  for (const event of events) {
    for (const response of event.responses || []) {
      if (query.status && response.status !== query.status) continue;
      rows.push({
        id: response._id?.toString?.() || response.responseId,
        responseId: response.responseId,
        eventSlug: event.eventSlug,
        eventName: event.eventName,
        name: response.name,
        email: response.email,
        status: response.status,
        guestCount: response.guestCount || 0,
        notes: response.messageToHost || "",
        submittedAt: response.createdAt || null,
        attended: Boolean(response.attended),
      });
    }
  }
  rows.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  return rows;
}

function verifyCheckInTokenAccess(record, token, notFoundMessage) {
  if (!record?.checkInToken) {
    const err = new Error(notFoundMessage || "Verification is not available for this record.");
    err.status = 403;
    throw err;
  }
  if (!token || token !== record.checkInToken) {
    const err = new Error("Invalid or missing verification token.");
    err.status = 403;
    throw err;
  }
}

export async function getSessionBookingPdfBuffer(bookingId, token) {
  const booking = await SessionBooking.findOne({ bookingId }).lean();
  if (!booking) throwError("Session booking not found.", 404);
  verifyCheckInTokenAccess(booking, token);
  const session = await Session.findOne({ sessionId: booking.sessionId }).lean();
  return generateSessionBookingPdf({ booking, session });
}

export async function getRsvpResponsePdfBuffer(eventSlug, responseId, token) {
  const event = await RSVP.findOne({ eventSlug }).lean();
  if (!event) throwError("RSVP event not found.", 404);
  const response = (event.responses || []).find(
    (r) => r.responseId === responseId || r._id?.toString?.() === responseId
  );
  if (!response) throwError("RSVP response not found.", 404);
  verifyCheckInTokenAccess(response, token);
  return generateRsvpPdf({ event, response });
}

export async function getSessionAnalytics() {
  const [bookings, sessions] = await Promise.all([
    SessionBooking.find({}).lean(),
    Session.find({}).lean(),
  ]);
  const revenueMinor = bookings
    .filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "free")
    .reduce((sum, b) => sum + Number(b.totalMinor || 0), 0);
  const cancellations = bookings.filter((b) => b.bookingStatus === "cancelled").length;
  const attended = bookings.filter((b) => b.bookingStatus === "attended").length;
  const noShows = bookings.filter((b) => b.bookingStatus === "no_show").length;

  const bySession = new Map();
  for (const b of bookings) {
    bySession.set(b.sessionId, (bySession.get(b.sessionId) || 0) + Number(b.participants || 1));
  }
  const popularSessions = [...bySession.entries()]
    .map(([sessionId, participants]) => ({
      sessionId,
      participants,
      sessionName: sessions.find((s) => s.sessionId === sessionId)?.name || sessionId,
    }))
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 8);

  const slotCapacity = await SessionSlot.aggregate([
    { $group: { _id: null, capacity: { $sum: "$capacity" }, remaining: { $sum: "$remainingCapacity" } } },
  ]);
  const cap = slotCapacity[0] || { capacity: 0, remaining: 0 };
  const utilized = Math.max(0, cap.capacity - cap.remaining);
  const utilizationPct = cap.capacity > 0 ? Number(((utilized / cap.capacity) * 100).toFixed(2)) : 0;

  return {
    totals: {
      bookings: bookings.length,
      sessions: sessions.length,
      revenueMinor,
      revenue: `€${(revenueMinor / 100).toFixed(2)}`,
      attendance: attended,
      noShows,
      cancellations,
      utilizationPct,
    },
    popularSessions,
  };
}

export async function updateAdminRsvpResponse(eventSlug, responseId, payload) {
  const event = await RSVP.findOne({ eventSlug });
  if (!event) throwError("RSVP event not found.", 404);
  const response = event.responses.find((r) => r.responseId === responseId || r._id?.toString() === responseId);
  if (!response) throwError("RSVP response not found.", 404);
  if (payload.status) response.status = payload.status;
  if (payload.guestCount !== undefined) response.guestCount = Number(payload.guestCount || 0);
  if (payload.attended !== undefined) response.attended = Boolean(payload.attended);
  await event.save();
  return response;
}

export async function deleteAdminRsvpResponse(eventSlug, responseId) {
  const event = await RSVP.findOne({ eventSlug });
  if (!event) throwError("RSVP event not found.", 404);
  const before = event.responses.length;
  event.responses = event.responses.filter(
    (r) => !(r.responseId === responseId || r._id?.toString() === responseId)
  );
  if (event.responses.length === before) throwError("RSVP response not found.", 404);
  await event.save();
  return { deleted: true };
}

export async function resolveSessionOrRsvpCheckIn(token, adminId) {
  const booking = await SessionBooking.findOne({ checkInToken: token });
  if (booking) {
    if (booking.checkedInAt) {
      const err = new Error("Session booking already checked in.");
      err.status = 409;
      throw err;
    }
    booking.checkedInAt = new Date();
    booking.bookingStatus = booking.bookingStatus === "cancelled" ? booking.bookingStatus : "attended";
    await booking.save();
    const session = await Session.findOne({ sessionId: booking.sessionId }).lean();
    return {
      kind: "session_booking",
      success: true,
      ticket: {
        ticketNumber: booking.bookingId,
        attendeeName: booking.customerName,
        ticketTypeName: session?.name || "Session booking",
        section: "",
        row: "",
        seatNumber: "",
      },
      event: {
        title: session?.name || "Session",
        date: booking.startsAt,
        startTime: booking.startsAt?.toISOString?.() || "",
        venueName: session?.location || "",
      },
      booking: formatSessionBooking(booking.toObject()),
      checkedInBy: adminId || null,
    };
  }

  const event = await RSVP.findOne({ "responses.checkInToken": token });
  if (event) {
    const response = event.responses.find((r) => r.checkInToken === token);
    if (!response) throwError("RSVP not found.", 404);
    if (response.attended) {
      const err = new Error("RSVP guest already checked in.");
      err.status = 409;
      throw err;
    }
    response.attended = true;
    await event.save();
    return {
      kind: "rsvp",
      success: true,
      ticket: {
        ticketNumber: response.responseId,
        attendeeName: response.name,
        ticketTypeName: "RSVP",
        section: "",
        row: "",
        seatNumber: "",
      },
      event: {
        title: event.eventName,
        date: event.eventDate,
        startTime: event.startTime || "",
        venueName: event.venue || "",
      },
      rsvp: response,
      checkedInBy: adminId || null,
    };
  }

  throwError("Invalid QR token.", 404);
}
