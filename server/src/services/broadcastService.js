import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.js";
import EmailTemplate from "../models/EmailTemplate.js";
import EmailBroadcast, { AUDIENCE_SEGMENTS } from "../models/EmailBroadcast.js";
import EmailBroadcastRecipient from "../models/EmailBroadcastRecipient.js";
import User from "../models/User.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import PastData from "../models/PastData.js";
import { generateTrackingToken } from "../utils/trackingToken.js";
import { injectTracking, getUnsubscribedEmailSet } from "./emailTrackingService.js";
import { getActiveEmailProvider } from "./emailProviders/providerRegistry.js";
import { notifyBroadcastOutcome } from "./adminNotificationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "..", "templates", "email");

const PREMIUM_PLAN_IDS = new Set(["premiumSingle", "premiumFamily"]);

export const DEFAULT_MERGE_VARIABLES = {
  featured_event_title: "Couples Night",
  featured_event_description:
    "A special evening of connection, entertainment and inspiration for couples.",
  featured_event_date: "Friday, 20 June 2026",
  featured_event_time: "8:00 PM",
  featured_event_location: "Den Haag",
  discount_code: "WELCOME10",
  site_url: env.clientUrl,
  account_url: `${env.clientUrl}/my-account`,
  tickets_url: "https://www.tickettailor.com/events/stichtingthevoicenl/2185529",
  membership_url: `${env.clientUrl}/membership`,
  org_name: "Stichting The V.O.I.C.E. NL",
  org_email: env.org.contactEmail,
  org_tagline: "The Vision Of International Cultural Exchange In The Netherlands",
};

const PLACEHOLDER_REGEX = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

export function extractPlaceholders(content) {
  const found = new Set();
  let match;
  const source = `${content || ""}`;
  PLACEHOLDER_REGEX.lastIndex = 0;
  while ((match = PLACEHOLDER_REGEX.exec(source)) !== null) {
    found.add(match[1].toLowerCase());
  }
  return [...found].sort();
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTemplateContent(content, variables = {}) {
  const merged = { ...DEFAULT_MERGE_VARIABLES, ...variables };
  return String(content || "").replace(PLACEHOLDER_REGEX, (_full, key) =>
    escapeHtml(merged[key.toLowerCase()] ?? merged[key] ?? "")
  );
}

function slugify(value) {
  return String(value || "template")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildUserVariables(user, extra = {}) {
  const idSuffix = user._id?.toString().slice(-6).toUpperCase() || "VOICE";
  const fallbackName = String(user.email || "member").split("@")[0] || "Member";
  return {
    first_name: user.firstName || fallbackName,
    last_name: user.lastName || "",
    email: user.email,
    discount_code: extra.discount_code || `WELCOME10-${idSuffix}`,
    ...extra,
  };
}

async function getActiveMemberUserIds() {
  const [fromMembers, fromMemberships] = await Promise.all([
    Member.find({ membershipStatus: "active" }).select("userId email").lean(),
    Membership.find({ active: true }).select("userId").lean(),
  ]);

  const ids = new Set();
  for (const row of fromMembers) {
    if (row.userId) ids.add(String(row.userId));
  }
  for (const row of fromMemberships) {
    if (row.userId) ids.add(String(row.userId));
  }
  return ids;
}

async function getPremiumUserIds() {
  const rows = await Membership.find({
    active: true,
    planId: { $in: [...PREMIUM_PLAN_IDS] },
  })
    .select("userId")
    .lean();
  return new Set(rows.map((row) => String(row.userId)).filter(Boolean));
}

async function getEventAttendeeEmails() {
  const rows = await PastData.find({ email: { $exists: true, $ne: "" } })
    .select("email")
    .lean();
  return new Set(rows.map((row) => String(row.email).toLowerCase().trim()).filter(Boolean));
}

export async function resolveAudience(segment, customEmails = []) {
  if (!AUDIENCE_SEGMENTS.includes(segment)) {
    const error = new Error("Invalid audience segment.");
    error.status = 400;
    throw error;
  }

  let users = [];

  if (segment === "test_users") {
    const emailList = Array.isArray(customEmails) ? customEmails : [];
    users = emailList.map((email) => {
      const emailStr = String(email || "").trim();
      return {
        _id: null,
        firstName: emailStr.split("@")[0] || "Test",
        lastName: "User",
        email: emailStr,
        isVerified: true,
      };
    });
  } else if (segment === "all_users") {
    users = await User.find({}).select("firstName lastName email isVerified").lean();
  } else if (segment === "all_members") {
    users = await User.find({ isVerified: true }).select("firstName lastName email isVerified").lean();
  } else if (segment === "active_members") {
    const activeIds = await getActiveMemberUserIds();
    if (activeIds.size > 0) {
      users = await User.find({ _id: { $in: [...activeIds] } })
        .select("firstName lastName email isVerified")
        .lean();
    } else {
      const memberEmails = await Member.find({ membershipStatus: "active" }).select("email firstName lastName").lean();
      users = memberEmails.map((member) => ({
        _id: null,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        isVerified: true,
      }));
    }
  } else if (segment === "premium_members") {
    const premiumIds = await getPremiumUserIds();
    users = await User.find({ _id: { $in: [...premiumIds] } })
      .select("firstName lastName email isVerified")
      .lean();
  } else if (segment === "event_attendees") {
    const emails = await getEventAttendeeEmails();
    users = await User.find({ email: { $in: [...emails] } })
      .select("firstName lastName email isVerified")
      .lean();
    const knownEmails = new Set(users.map((u) => u.email));
    for (const email of emails) {
      if (!knownEmails.has(email)) {
        users.push({
          _id: null,
          firstName: email.split("@")[0] || "Guest",
          lastName: "",
          email,
          isVerified: false,
        });
      }
    }
  }

  const deduped = new Map();
  for (const user of users) {
    const email = String(user.email || "")
      .trim()
      .toLowerCase();
    if (!email || deduped.has(email)) continue;
    deduped.set(email, user);
  }

  return [...deduped.values()];
}

export async function getAudienceOverview() {
  const [allUsers, verifiedUsers, activeMemberIds, premiumIds, attendeeEmails, broadcasts] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isVerified: true }),
      getActiveMemberUserIds(),
      getPremiumUserIds(),
      getEventAttendeeEmails(),
      EmailBroadcast.find({ status: { $in: ["sent", "partially_sent"] } })
        .select("recipientCount sentCount openedCount clickedCount")
        .lean(),
    ]);

  const segments = [
    { key: "all_members", label: "All Members", count: verifiedUsers, color: "#a855f7" },
    { key: "active_members", label: "Active Members", count: activeMemberIds.size, color: "#14b8a6" },
    { key: "premium_members", label: "Premium Members", count: premiumIds.size, color: "#f97316" },
    { key: "event_attendees", label: "Event Attendees", count: attendeeEmails.size, color: "#3b82f6" },
    { key: "all_users", label: "All Users", count: allUsers, color: "#ec4899" },
  ];

  const totalAudience = verifiedUsers;
  const enrichedSegments = segments.map((segment) => ({
    ...segment,
    percentage: totalAudience > 0 ? Math.round((segment.count / totalAudience) * 1000) / 10 : 0,
  }));

  const emailsSent = broadcasts.reduce((sum, row) => sum + (row.sentCount || 0), 0);
  const totalRecipients = broadcasts.reduce((sum, row) => sum + (row.recipientCount || 0), 0);
  const totalOpened = broadcasts.reduce((sum, row) => sum + (row.openedCount || 0), 0);
  const totalClicked = broadcasts.reduce((sum, row) => sum + (row.clickedCount || 0), 0);

  return {
    totalAudience,
    segments: enrichedSegments,
    stats: {
      emailsSent,
      // Real, self-hosted open/click tracking (see emailTrackingService.js) — no longer
      // the hardcoded 32.4/8.7 placeholders this used to return.
      openRate: emailsSent > 0 ? Math.round((totalOpened / emailsSent) * 1000) / 10 : 0,
      clickRate: emailsSent > 0 ? Math.round((totalClicked / emailsSent) * 1000) / 10 : 0,
      recipients: totalRecipients || totalAudience,
    },
  };
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(Boolean)
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 20);
}

function formatTemplateSummary(template) {
  return {
    id: template._id.toString(),
    name: template.name,
    slug: template.slug,
    description: template.description,
    subject: template.subject,
    placeholders: template.placeholders,
    thumbnailKey: template.thumbnailKey,
    isSystem: template.isSystem,
    type: template.type,
    tags: template.tags,
    status: template.status,
    aiGenerated: template.aiGenerated,
    colorScheme: template.colorScheme,
    usageCount: template.usageCount,
    lastUsedAt: template.lastUsedAt,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export async function listTemplates() {
  const templates = await EmailTemplate.find({}).sort({ createdAt: -1 }).lean();
  return templates.map(formatTemplateSummary);
}

export async function getTemplateById(templateId) {
  const template = await EmailTemplate.findById(templateId).lean();
  if (!template) {
    const error = new Error("Email template not found.");
    error.status = 404;
    throw error;
  }
  return template;
}

export async function createTemplate({
  name,
  description,
  subject,
  htmlBody,
  adminId,
  type,
  tags,
  status,
  aiGenerated,
  aiPrompt,
  colorScheme,
}) {
  if (!name?.trim() || !subject?.trim() || !htmlBody?.trim()) {
    const error = new Error("Name, subject, and HTML body are required.");
    error.status = 400;
    throw error;
  }

  let slug = slugify(name);
  const existing = await EmailTemplate.findOne({ slug }).select("_id").lean();
  if (existing) slug = `${slug}-${Date.now()}`;

  const placeholders = extractPlaceholders(`${subject}\n${htmlBody}`);
  const template = await EmailTemplate.create({
    name: name.trim(),
    slug,
    description: description?.trim() || "",
    subject: subject.trim(),
    htmlBody: htmlBody.trim(),
    placeholders,
    createdBy: adminId || null,
    type: type || "custom",
    tags: normalizeTags(tags),
    status: status || "active",
    aiGenerated: Boolean(aiGenerated),
    aiPrompt: aiPrompt?.trim().slice(0, 4000) || "",
    colorScheme: colorScheme || "default",
  });

  return formatTemplateSummary(template);
}

/**
 * Edits content/metadata are allowed even on isSystem templates (so an admin can fix a typo
 * in the seeded welcome template) — only deleteTemplate() blocks isSystem rows.
 */
export async function updateTemplate(templateId, updates = {}) {
  const template = await EmailTemplate.findById(templateId);
  if (!template) {
    const error = new Error("Email template not found.");
    error.status = 404;
    throw error;
  }

  if (updates.name !== undefined) template.name = updates.name.trim();
  if (updates.description !== undefined) template.description = updates.description.trim();
  if (updates.subject !== undefined) template.subject = updates.subject.trim();
  if (updates.htmlBody !== undefined) template.htmlBody = updates.htmlBody.trim();
  if (updates.type !== undefined) template.type = updates.type;
  if (updates.tags !== undefined) template.tags = normalizeTags(updates.tags);
  if (updates.status !== undefined) template.status = updates.status;
  if (updates.colorScheme !== undefined) template.colorScheme = updates.colorScheme;

  if (!template.name?.trim() || !template.subject?.trim() || !template.htmlBody?.trim()) {
    const error = new Error("Name, subject, and HTML body are required.");
    error.status = 400;
    throw error;
  }

  // Placeholders are derived data — re-extract whenever the source text changes so they
  // never go stale relative to the actual stored content.
  if (updates.subject !== undefined || updates.htmlBody !== undefined) {
    template.placeholders = extractPlaceholders(`${template.subject}\n${template.htmlBody}`);
  }

  await template.save();
  return formatTemplateSummary(template);
}

/** Duplicates always land as a draft, regardless of the source's status, so a copy never
 * silently looks "active" before the admin has reviewed it. isSystem is never copied. */
export async function duplicateTemplate(templateId, adminId) {
  const source = await getTemplateById(templateId);
  return createTemplate({
    name: `${source.name} (Copy)`,
    description: source.description,
    subject: source.subject,
    htmlBody: source.htmlBody,
    adminId,
    type: source.type,
    tags: source.tags,
    status: "draft",
    aiGenerated: source.aiGenerated,
    aiPrompt: source.aiPrompt,
    colorScheme: source.colorScheme,
  });
}

export async function deleteTemplate(templateId) {
  const template = await EmailTemplate.findById(templateId);
  if (!template) {
    const error = new Error("Email template not found.");
    error.status = 404;
    throw error;
  }
  if (template.isSystem) {
    const error = new Error("System templates cannot be deleted.");
    error.status = 400;
    throw error;
  }
  await template.deleteOne();
  return { ok: true };
}

export async function getSampleUsers(limit = 12) {
  const users = await User.find({ isVerified: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("firstName lastName email")
    .lean();

  return users.map((user) => ({
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  }));
}

export async function buildPreview({ templateId, audienceSegment, sampleUserId, mergeVariables = {}, customEmails }) {
  const template = await getTemplateById(templateId);
  let sampleUser = null;

  if (sampleUserId) {
    sampleUser = await User.findById(sampleUserId).select("firstName lastName email").lean();
  }
  if (!sampleUser) {
    sampleUser = await User.findOne({ isVerified: true })
      .sort({ createdAt: -1 })
      .select("firstName lastName email")
      .lean();
  }
  if (!sampleUser) {
    sampleUser = {
      firstName: "Alex",
      lastName: "Sample",
      email: "alex.sample@example.com",
    };
  }

  const audience = audienceSegment ? await resolveAudience(audienceSegment, customEmails) : [];
  const userVars = buildUserVariables(sampleUser, mergeVariables);
  const renderedSubject = renderTemplateContent(template.subject, userVars);
  const renderedHtml = renderTemplateContent(template.htmlBody, userVars);

  return {
    subject: renderedSubject,
    html: renderedHtml,
    sampleRecipient: {
      firstName: sampleUser.firstName,
      lastName: sampleUser.lastName,
      email: sampleUser.email,
    },
    recipientCount: audience.length,
    placeholders: template.placeholders,
    mergeVariables: { ...DEFAULT_MERGE_VARIABLES, ...userVars, ...mergeVariables },
  };
}

export async function listRecentCampaigns(limit = 6) {
  const campaigns = await EmailBroadcast.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return campaigns.map((campaign) => ({
    id: campaign._id.toString(),
    templateName: campaign.templateName,
    campaignName: campaign.campaignName || campaign.templateName,
    subject: campaign.subject,
    audienceSegment: campaign.audienceSegment,
    status: campaign.status,
    recipientCount: campaign.recipientCount,
    sentCount: campaign.sentCount,
    failedCount: campaign.failedCount,
    // null (not 0) when nothing has been sent yet — a real 0% open rate and "no data to
    // measure yet" are different facts, and the report page already draws this distinction
    // for the same reason (see broadcastReportService.js's rate() helper).
    openRate: campaign.sentCount > 0 ? Math.round((campaign.openedCount / campaign.sentCount) * 1000) / 10 : null,
    sentAt: campaign.sentAt || campaign.createdAt,
    createdAt: campaign.createdAt,
  }));
}

export async function sendBroadcast({ templateId, audienceSegment, mergeVariables = {}, adminId, customEmails, campaignName }) {
  const template = await getTemplateById(templateId);
  let audience = await resolveAudience(audienceSegment, customEmails);

  const unsubscribed = await getUnsubscribedEmailSet(audience.map((u) => u.email));
  audience = audience.filter((u) => !unsubscribed.has(String(u.email).toLowerCase()));

  if (audience.length === 0) {
    const error = new Error("No recipients found for the selected audience.");
    error.status = 400;
    throw error;
  }

  const broadcast = await EmailBroadcast.create({
    templateId: template._id,
    templateName: template.name,
    campaignName: campaignName?.trim() || template.name,
    subject: template.subject,
    audienceSegment,
    status: "sending",
    recipientCount: audience.length,
    mergeVariables: { ...DEFAULT_MERGE_VARIABLES, ...mergeVariables },
    customEmails: Array.isArray(customEmails) ? customEmails : [],
    createdBy: adminId || null,
    // Rendered with defaults only — never a real recipient's name/email — so this archival
    // copy (used later for the PII-free PDF export) never contains personal data by
    // construction, rather than needing PII stripped out of it after the fact.
    htmlSnapshot: renderTemplateContent(template.htmlBody, { ...DEFAULT_MERGE_VARIABLES, ...mergeVariables }),
  });

  const provider = getActiveEmailProvider();
  let sentCount = 0;
  let failedCount = 0;
  let lastError = "";
  // Resolved once per distinct URL across the whole broadcast, not once per recipient — most
  // links are identical for every recipient (a template's href rarely embeds a per-recipient
  // merge field), so caching here turns what would otherwise be N recipients × M links worth
  // of EmailBroadcastLink upserts into (at most) M for the entire send.
  const linkCache = new Map();

  for (const recipient of audience) {
    const userVars = buildUserVariables(recipient, mergeVariables);
    const subject = renderTemplateContent(template.subject, userVars);
    const html = renderTemplateContent(template.htmlBody, userVars);
    const trackingIdentifier = generateTrackingToken();

    // Recipient-row creation is inside the same try/catch as the send itself — a single bad
    // row (e.g. a validation error) must only fail that one recipient, never abort the whole
    // loop and leave the broadcast stuck at status "sending" with later recipients unsent.
    try {
      const recipientDoc = await EmailBroadcastRecipient.create({
        broadcastId: broadcast._id,
        email: recipient.email,
        userId: recipient._id || null,
        status: "queued",
        trackingIdentifier,
      });

      const trackedHtml = await injectTracking(html, {
        broadcastId: broadcast._id,
        publicApiUrl: env.publicApiUrl,
        trackingIdentifier,
        linkCache,
      });
      const result = await provider.send({ to: recipient.email, subject, html: trackedHtml });
      sentCount += 1;
      recipientDoc.status = "sent";
      recipientDoc.sentAt = new Date();
      recipientDoc.providerMessageId = result.providerMessageId || "";
      await recipientDoc.save();
    } catch (error) {
      failedCount += 1;
      lastError = error.message || "Send failed.";
      console.warn(`[broadcast] Failed to send to ${recipient.email}:`, error.message);
      await EmailBroadcastRecipient.updateOne(
        { broadcastId: broadcast._id, email: recipient.email },
        { $set: { status: "failed", failureReason: lastError.slice(0, 500) } }
      ).catch(() => {});
    }
  }

  broadcast.sentCount = sentCount;
  broadcast.failedCount = failedCount;
  broadcast.status = sentCount > 0 ? (failedCount > 0 ? "partially_sent" : "sent") : "failed";
  broadcast.sentAt = new Date();
  broadcast.errorMessage = failedCount > 0 ? lastError : "";
  await broadcast.save();

  // Atomic increment, not a fetch-mutate-save round trip — `template` here is already a
  // lean object (from getTemplateById), and this must stay race-safe under concurrent
  // broadcasts. Counts once per campaign sent, not once per recipient email.
  await EmailTemplate.updateOne(
    { _id: template._id },
    { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
  );

  // Best-effort — a notification failing to write must never fail the broadcast itself,
  // the send already completed successfully by this point.
  await notifyBroadcastOutcome(broadcast).catch((err) => console.error("[broadcast] notification failed:", err));

  return {
    id: broadcast._id.toString(),
    status: broadcast.status,
    recipientCount: broadcast.recipientCount,
    sentCount,
    failedCount,
    sentAt: broadcast.sentAt,
  };
}

export async function ensureDefaultTemplate() {
  const existing = await EmailTemplate.findOne({ slug: "welcome-voucher-10" }).select("_id").lean();
  if (existing) return existing._id.toString();

  const filePath = path.join(TEMPLATES_DIR, "welcome-voucher-10.html");
  if (!fs.existsSync(filePath)) {
    console.warn("[broadcast] Default template file missing:", filePath);
    return null;
  }

  const htmlBody = fs.readFileSync(filePath, "utf8");
  const subject = "Your 10% discount voucher is waiting — create your V.O.I.C.E. NL account";
  const placeholders = extractPlaceholders(`${subject}\n${htmlBody}`);

  const template = await EmailTemplate.create({
    name: "10% Welcome Voucher",
    slug: "welcome-voucher-10",
    description: "Welcome email with personal 10% discount voucher and featured event.",
    subject,
    htmlBody,
    placeholders,
    thumbnailKey: "welcome-voucher",
    isSystem: true,
  });

  console.log("[broadcast] Seeded default email template:", template.slug);
  return template._id.toString();
}

export async function getBroadcastOverview() {
  await ensureDefaultTemplate();
  const [overview, templates, campaigns] = await Promise.all([
    getAudienceOverview(),
    listTemplates(),
    listRecentCampaigns(3),
  ]);

  return {
    stats: overview.stats,
    audience: {
      total: overview.totalAudience,
      segments: overview.segments,
    },
    templates,
    recentCampaigns: campaigns,
  };
}
