import mongoose from "mongoose";
import EmailBroadcast from "../models/EmailBroadcast.js";
import EmailBroadcastRecipient from "../models/EmailBroadcastRecipient.js";
import EmailBroadcastLink from "../models/EmailBroadcastLink.js";
import EmailTrackingEvent from "../models/EmailTrackingEvent.js";
import { getActiveEmailProvider } from "./emailProviders/providerRegistry.js";
import { exportReportCsv } from "./reportExportService.js";

// Model.aggregate() does NOT auto-cast query values the way find()/findOne() do — every
// $match on an ObjectId field below casts explicitly, matching the fix already established
// elsewhere in this codebase for the same aggregate-cast gap (membershipTicketCapService.js).
function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

/** null (not a number) means "not enough data" — the caller renders that instead of
 * dividing by zero or, worse, showing a fabricated percentage. */
function rate(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getBroadcastById(broadcastId) {
  const broadcast = await EmailBroadcast.findById(broadcastId)
    .populate("createdBy", "firstName lastName email")
    .lean();
  if (!broadcast) {
    const error = new Error("Broadcast not found.");
    error.status = 404;
    throw error;
  }
  return broadcast;
}

function formatBroadcastHeader(broadcast) {
  return {
    id: broadcast._id.toString(),
    campaignName: broadcast.campaignName || broadcast.templateName,
    templateName: broadcast.templateName,
    subject: broadcast.subject,
    audienceSegment: broadcast.audienceSegment,
    status: broadcast.status,
    recipientCount: broadcast.recipientCount,
    sentAt: broadcast.sentAt,
    createdAt: broadcast.createdAt,
    createdBy: broadcast.createdBy
      ? {
          id: broadcast.createdBy._id.toString(),
          name: `${broadcast.createdBy.firstName || ""} ${broadcast.createdBy.lastName || ""}`.trim(),
          email: broadcast.createdBy.email,
        }
      : null,
    pdfStatus: broadcast.pdfStatus,
  };
}

export async function getBroadcastReport(broadcastId) {
  const broadcast = await getBroadcastById(broadcastId);
  const provider = getActiveEmailProvider();
  const objectId = toObjectId(broadcastId);

  const statusRows = await EmailBroadcastRecipient.aggregate([
    { $match: { broadcastId: objectId } },
    { $group: { _id: "$status", count: { $sum: 1 }, totalOpens: { $sum: "$openCount" }, totalClicks: { $sum: "$clickCount" } } },
  ]);
  const byStatus = Object.fromEntries(statusRows.map((r) => [r._id, r]));
  const countFor = (...statuses) => statuses.reduce((sum, s) => sum + (byStatus[s]?.count || 0), 0);

  const sent = broadcast.sentCount;
  const failed = countFor("failed", "rejected");
  // Plain SMTP can only confirm a message was accepted for relay — it cannot confirm actual
  // mailbox delivery or a later async bounce. Both stay "not enough data" (null) rather than
  // a fabricated 0 or 100%, unless the active provider genuinely supports bounce tracking.
  const bounced = countFor("soft_bounced", "hard_bounced");
  const delivered = provider.capabilities.bounceTracking ? sent - bounced : null;
  const uniqueOpens = broadcast.openedCount;
  const uniqueClicks = broadcast.clickedCount;
  const totalOpens = statusRows.reduce((sum, r) => sum + (r.totalOpens || 0), 0);
  const totalClicks = statusRows.reduce((sum, r) => sum + (r.totalClicks || 0), 0);
  const unsubscribed = countFor("unsubscribed");

  const deliveredDenominator = provider.capabilities.bounceTracking ? delivered : sent;

  return {
    broadcast: formatBroadcastHeader(broadcast),
    tiles: {
      sent: { count: sent, percentage: rate(sent, broadcast.recipientCount) },
      delivered: {
        count: delivered,
        percentage: provider.capabilities.bounceTracking ? rate(delivered, sent) : null,
      },
      opened: { count: uniqueOpens, totalCount: totalOpens, percentage: rate(uniqueOpens, deliveredDenominator) },
      clicked: { count: uniqueClicks, totalCount: totalClicks, percentage: rate(uniqueClicks, deliveredDenominator) },
      bounced: {
        count: provider.capabilities.bounceTracking ? bounced : null,
        percentage: provider.capabilities.bounceTracking ? rate(bounced, sent) : null,
      },
      failed: { count: failed, percentage: rate(failed, broadcast.recipientCount) },
      unsubscribed: { count: unsubscribed, percentage: rate(unsubscribed, sent) },
    },
    funnel: [
      { stage: "recipients", count: broadcast.recipientCount },
      { stage: "sent", count: sent },
      { stage: "delivered", count: delivered },
      { stage: "opened", count: uniqueOpens },
      { stage: "clicked", count: uniqueClicks },
    ],
    rates: {
      deliveryRate: provider.capabilities.bounceTracking ? rate(delivered, sent) : null,
      uniqueOpenRate: rate(uniqueOpens, deliveredDenominator),
      uniqueClickThroughRate: rate(uniqueClicks, deliveredDenominator),
      clickToOpenRate: rate(uniqueClicks, uniqueOpens),
      bounceRate: provider.capabilities.bounceTracking ? rate(bounced, sent) : null,
    },
    providerCapabilities: provider.capabilities,
    openTrackingNote:
      "Open tracking is approximate — some email clients block remote images or pre-load them, which can under- or over-count opens.",
  };
}

export async function listBroadcastLinks(broadcastId) {
  const links = await EmailBroadcastLink.find({ broadcastId }).sort({ totalClicks: -1 }).lean();
  return links.map((link) => ({
    id: link._id.toString(),
    originalUrl: link.originalUrl,
    label: link.label,
    totalClicks: link.totalClicks,
    uniqueClicks: link.uniqueClicks,
    clickThroughRate: null, // computed client-side against the broadcast's sent count, avoids a redundant round trip
  }));
}

export async function listLinkClickers(broadcastId, linkId) {
  const events = await EmailTrackingEvent.aggregate([
    { $match: { broadcastId: toObjectId(broadcastId), linkId: toObjectId(linkId), eventType: "clicked" } },
    {
      $group: {
        _id: "$recipientId",
        firstClickedAt: { $min: "$createdAt" },
        lastClickedAt: { $max: "$createdAt" },
        totalClicks: { $sum: 1 },
        userAgent: { $first: "$userAgent" },
      },
    },
    { $sort: { lastClickedAt: -1 } },
  ]);

  const recipientIds = events.map((e) => e._id);
  const recipients = await EmailBroadcastRecipient.find({ _id: { $in: recipientIds } })
    .select("email")
    .lean();
  const emailById = new Map(recipients.map((r) => [r._id.toString(), r.email]));

  return events.map((e) => ({
    recipientId: e._id.toString(),
    email: emailById.get(e._id.toString()) || "",
    firstClickedAt: e.firstClickedAt,
    lastClickedAt: e.lastClickedAt,
    totalClicks: e.totalClicks,
    userAgent: e.userAgent || "",
  }));
}

const RECIPIENT_FILTERS = {
  opened: { firstOpenedAt: { $ne: null } },
  not_opened: { firstOpenedAt: null },
  clicked: { firstClickedAt: { $ne: null } },
  not_clicked: { firstClickedAt: null },
  bounced: { status: { $in: ["soft_bounced", "hard_bounced"] } },
  failed: { status: { $in: ["failed", "rejected"] } },
  unsubscribed: { status: "unsubscribed" },
};

function formatRecipient(r) {
  return {
    id: r._id.toString(),
    email: r.email,
    status: r.status,
    sentAt: r.sentAt,
    deliveredAt: r.deliveredAt,
    firstOpenedAt: r.firstOpenedAt,
    lastOpenedAt: r.lastOpenedAt,
    openCount: r.openCount,
    firstClickedAt: r.firstClickedAt,
    lastClickedAt: r.lastClickedAt,
    clickCount: r.clickCount,
    bounceReason: r.bounceReason,
    failureReason: r.failureReason,
  };
}

export async function listBroadcastRecipients(broadcastId, { page = 1, pageSize = 25, filter } = {}) {
  const query = { broadcastId, ...(RECIPIENT_FILTERS[filter] || {}) };
  const skip = (Math.max(1, page) - 1) * pageSize;
  const [rows, total] = await Promise.all([
    EmailBroadcastRecipient.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    EmailBroadcastRecipient.countDocuments(query),
  ]);
  return { recipients: rows.map(formatRecipient), total, page, pageSize };
}

export async function exportBroadcastRecipientsCsv(broadcastId, { filter } = {}) {
  const query = { broadcastId, ...(RECIPIENT_FILTERS[filter] || {}) };
  const rows = await EmailBroadcastRecipient.find(query).sort({ createdAt: -1 }).lean();
  const columns = [
    "email",
    "status",
    "sentAt",
    "deliveredAt",
    "firstOpenedAt",
    "lastOpenedAt",
    "openCount",
    "firstClickedAt",
    "lastClickedAt",
    "clickCount",
    "bounceReason",
    "failureReason",
  ];
  const csvRows = rows.map((r) => ({
    email: r.email,
    status: r.status,
    sentAt: r.sentAt ? r.sentAt.toISOString() : "",
    deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : "",
    firstOpenedAt: r.firstOpenedAt ? r.firstOpenedAt.toISOString() : "",
    lastOpenedAt: r.lastOpenedAt ? r.lastOpenedAt.toISOString() : "",
    openCount: r.openCount,
    firstClickedAt: r.firstClickedAt ? r.firstClickedAt.toISOString() : "",
    lastClickedAt: r.lastClickedAt ? r.lastClickedAt.toISOString() : "",
    clickCount: r.clickCount,
    bounceReason: r.bounceReason || "",
    failureReason: r.failureReason || "",
  }));
  return exportReportCsv({ columns, rows: csvRows });
}

export async function listBroadcastHistory({ page = 1, pageSize = 20, search, status, sender, sort = "newest" } = {}) {
  const filter = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ campaignName: regex }, { subject: regex }, { templateName: regex }];
  }
  if (status) filter.status = status;
  if (sender) filter.createdBy = toObjectId(sender);

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    recipients: { recipientCount: -1 },
    performance: { openedCount: -1 },
  };

  const skip = (Math.max(1, page) - 1) * pageSize;
  const [rows, total] = await Promise.all([
    EmailBroadcast.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    EmailBroadcast.countDocuments(filter),
  ]);

  return {
    broadcasts: rows.map((b) => ({
      id: b._id.toString(),
      campaignName: b.campaignName || b.templateName,
      subject: b.subject,
      audienceSegment: b.audienceSegment,
      recipientCount: b.recipientCount,
      status: b.status,
      sentAt: b.sentAt,
      createdAt: b.createdAt,
      createdBy: b.createdBy
        ? `${b.createdBy.firstName || ""} ${b.createdBy.lastName || ""}`.trim() || b.createdBy.email
        : "—",
      pdfStatus: b.pdfStatus,
    })),
    total,
    page,
    pageSize,
  };
}
