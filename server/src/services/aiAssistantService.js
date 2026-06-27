import Anthropic from "@anthropic-ai/sdk";
import env from "../config/env.js";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import Event from "../models/Event.js";
import TicketOrder from "../models/TicketOrder.js";
import ChatSession from "../models/ChatSession.js";
import SavedPrompt from "../models/SavedPrompt.js";
import ScheduledPrompt from "../models/ScheduledPrompt.js";
import AIResult from "../models/AIResult.js";
import AiUsageCounter from "../models/AiUsageCounter.js";
import AiAssistantSettings from "../models/AiAssistantSettings.js";
import AiAssistantCustomerOverride from "../models/AiAssistantCustomerOverride.js";
import PushSubscription from "../models/PushSubscription.js";
import { getSmtpTransporter } from "./smtpTransport.js";
import { sendPush } from "./webPushService.js";
import { getWalletSummary } from "./walletService.js";
import { findEvents, prepareWalletBooking, executeWalletBooking } from "./walletAiBookingService.js";

const MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// V.Wallet tools — client-executed (we run these ourselves, unlike the
// Anthropic-hosted web_search tool). Each handler independently re-validates
// permissions/limits server-side regardless of what the conversation decided.
// ---------------------------------------------------------------------------

const WALLET_TOOLS = [
  {
    name: "find_events",
    description:
      "Search published events on the V.O.I.C.E. NL platform, with ticket types, prices, and availability. Use this whenever the customer asks about events, or wants to book tickets, before booking anything.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text search against event title/venue, e.g. 'Summer Gala'. Leave empty to list all upcoming events." },
        dateFrom: { type: "string", description: "ISO date — only events on/after this date. Defaults to today." },
        dateTo: { type: "string", description: "ISO date — only events on/before this date." },
      },
    },
  },
  {
    name: "prepare_wallet_booking",
    description:
      "Validates pricing and availability for a specific ticket type/quantity and the customer's V.Wallet settings and balance, then returns a booking quote with a bookingIntentId. This does NOT charge anything yet — it must be followed by execute_wallet_booking to actually complete the purchase.",
    input_schema: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "The eventId from a prior find_events result." },
        ticketTypeId: { type: "string", description: "The ticketTypeId from a prior find_events result." },
        quantity: { type: "integer", minimum: 1, description: "Number of tickets to book." },
      },
      required: ["eventId", "ticketTypeId", "quantity"],
    },
  },
  {
    name: "execute_wallet_booking",
    description:
      "Actually completes a wallet-funded ticket purchase using a bookingIntentId from a prior prepare_wallet_booking call. Only call this once you have a quote AND either (a) the customer's wallet settings allow auto-confirm, or (b) the customer has explicitly replied yes/confirm to your confirmation question in this conversation.",
    input_schema: {
      type: "object",
      properties: {
        bookingIntentId: { type: "string", description: "The bookingIntentId returned by prepare_wallet_booking." },
      },
      required: ["bookingIntentId"],
    },
  },
];

async function dispatchWalletTool(customerId, toolUse) {
  switch (toolUse.name) {
    case "find_events":
      return findEvents(toolUse.input || {});
    case "prepare_wallet_booking":
      return prepareWalletBooking(customerId, toolUse.input || {});
    case "execute_wallet_booking":
      return executeWalletBooking(customerId, toolUse.input || {});
    default:
      return { error: `Unknown tool: ${toolUse.name}` };
  }
}

let cachedClient = null;
function getClient() {
  if (!env.anthropic.apiKey) {
    const err = new Error("The AI assistant is not configured (ANTHROPIC_API_KEY missing).");
    err.status = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: env.anthropic.apiKey });
  }
  return cachedClient;
}

export function isAiAssistantConfigured() {
  return Boolean(env.anthropic.apiKey);
}

// ---------------------------------------------------------------------------
// Settings, tiers and usage limits
// ---------------------------------------------------------------------------

async function getGlobalSettings() {
  let settings = await AiAssistantSettings.findOne({ key: "default" });
  if (!settings) settings = await AiAssistantSettings.create({ key: "default" });
  return settings;
}

export async function getEffectiveAccess(customerId) {
  const [settings, override, membership] = await Promise.all([
    getGlobalSettings(),
    AiAssistantCustomerOverride.findOne({ customerId }).lean(),
    Membership.findOne({ userId: customerId, active: true }).sort({ startedAt: -1 }).lean(),
  ]);

  const enabled = override?.enabledOverride ?? settings.enabled;
  const planId = membership?.planId || "none";
  const tierLimit = settings.tierLimits.get(planId) ?? settings.tierLimits.get("none") ?? 10;
  const dailyLimit = override?.dailyLimitOverride ?? tierLimit;

  return { enabled, dailyLimit, planId, membership };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsageStats(customerId) {
  const { enabled, dailyLimit, planId } = await getEffectiveAccess(customerId);
  const date = todayKey();
  const monthPrefix = date.slice(0, 7);

  const [todayCounter, monthCounters] = await Promise.all([
    AiUsageCounter.findOne({ customerId, date }).lean(),
    AiUsageCounter.find({ customerId, date: { $regex: `^${monthPrefix}` } }).lean(),
  ]);

  const todayCount = todayCounter?.promptCount || 0;
  const monthCount = monthCounters.reduce((sum, c) => sum + c.promptCount, 0);

  return { enabled, dailyLimit, planId, todayCount, monthCount };
}

async function checkAndIncrementUsage(customerId) {
  const { enabled, dailyLimit } = await getEffectiveAccess(customerId);
  if (!enabled) {
    const err = new Error("The AI assistant is currently disabled for your account.");
    err.status = 403;
    throw err;
  }

  const date = todayKey();
  const counter = await AiUsageCounter.findOneAndUpdate(
    { customerId, date },
    {},
    { upsert: true, new: false }
  );
  const currentCount = counter?.promptCount || 0;

  if (dailyLimit >= 0 && currentCount >= dailyLimit) {
    const err = new Error("You've reached your daily AI assistant limit. Try again tomorrow.");
    err.status = 429;
    throw err;
  }

  await AiUsageCounter.updateOne({ customerId, date }, { $inc: { promptCount: 1 } }, { upsert: true });
}

// ---------------------------------------------------------------------------
// Personalization context + system prompt
// ---------------------------------------------------------------------------

const TIER_LABELS = {
  student: "Student member",
  privilegedSingle: "Privileged (Single) member",
  privilegedFamily: "Privileged (Family) member",
  premiumSingle: "Premium (Single) member",
  premiumFamily: "Premium (Family) member",
  single: "Single member",
  family: "Family member",
  privileged: "Privileged member",
  vownl: "V.O.I.C.E. NL member",
  none: "guest (no active membership)",
};

async function getUpcomingEventsForContext(customerId) {
  const orders = await TicketOrder.find({
    userId: customerId,
    paymentStatus: { $in: ["paid", "free"] },
  })
    .select("eventId")
    .lean();
  const eventIds = [...new Set(orders.map((o) => o.eventId?.toString()).filter(Boolean))];
  if (!eventIds.length) return [];

  const events = await Event.find({ _id: { $in: eventIds }, date: { $gte: new Date() } })
    .select("title date venueName")
    .sort({ date: 1 })
    .limit(5)
    .lean();
  return events.map((e) => ({ title: e.title, date: e.date, venue: e.venueName }));
}

async function buildWalletPromptBlock(customerId) {
  try {
    const wallet = await getWalletSummary(customerId);
    if (!wallet.enabled) return "V.Wallet is currently disabled platform-wide — do not offer wallet booking.";
    if (!wallet.settings.aiBookingEnabled) {
      return "This member has NOT enabled AI booking permission for their V.Wallet. If they ask you to book something with their wallet, tell them to turn on 'AI booking' in V.Wallet settings first — do not call any wallet booking tools.";
    }
    const confirmLine = wallet.settings.confirmationStepEnabled
      ? "This member requires a confirmation step: after prepare_wallet_booking, summarize the quote and explicitly ask 'Shall I confirm this booking?' — only call execute_wallet_booking after they reply with a clear yes/confirm in their NEXT message."
      : "This member has disabled the confirmation step: you may call execute_wallet_booking immediately after prepare_wallet_booking returns a quote, without asking first — but still briefly state what you booked.";
    return [
      `V.Wallet balance: €${(wallet.balanceMinor / 100).toFixed(2)}. Reward points: ${wallet.rewardPoints}.`,
      `Per-transaction AI spend limit: €${(wallet.settings.maxAISpendPerTransactionMinor / 100).toFixed(2)}. Daily AI spend limit: €${(wallet.settings.dailyAISpendLimitMinor / 100).toFixed(2)}.`,
      confirmLine,
      "If a booking fails because the wallet balance is insufficient, tell the member clearly and suggest topping up V.Wallet — never imply the purchase happened.",
    ].join("\n");
  } catch {
    return "V.Wallet context is currently unavailable — do not offer wallet booking.";
  }
}

async function buildSystemPrompt(customer, planId, upcomingEvents) {
  const tierLabel = TIER_LABELS[planId] || planId;
  const eventsBlock = upcomingEvents.length
    ? upcomingEvents
        .map((e) => `- ${e.title} on ${new Date(e.date).toLocaleDateString("en-GB")} at ${e.venue}`)
        .join("\n")
    : "No upcoming events on file.";
  const walletBlock = await buildWalletPromptBlock(customer.id || customer._id);

  return [
    "You are the Personal AI Assistant for Stichting The V.O.I.C.E. NL, a helpful assistant for members of the organization.",
    "Your scope: event reminders, news headlines, weather, ticket booking via V.Wallet, and general day-to-day questions for this member. Be warm, concise, and friendly — not corporate.",
    "Use web search whenever the question depends on current information (news, weather, today's date, recent events) — never answer time-sensitive questions from memory.",
    "For ticket booking requests: always call find_events first to get real eventId/ticketTypeId values — never invent them. Then prepare_wallet_booking for a quote, then execute_wallet_booking to complete it, following the confirmation rule below exactly.",
    "",
    `Member: ${customer.firstName} ${customer.lastName} (${tierLabel}).`,
    `Upcoming events for this member:\n${eventsBlock}`,
    "",
    walletBlock,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Chat (streaming)
// ---------------------------------------------------------------------------

export async function getChatHistory(customerId) {
  const sessions = await ChatSession.find({ customerId })
    .select("title lastMessageAt createdAt")
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .lean();
  return sessions.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    lastMessageAt: s.lastMessageAt,
    createdAt: s.createdAt,
  }));
}

export async function getChatSession(customerId, sessionId) {
  const session = await ChatSession.findOne({ _id: sessionId, customerId }).lean();
  if (!session) return null;
  return { id: session._id.toString(), title: session.title, messages: session.messages };
}

/**
 * Streams the assistant's reply to `res` as newline-delimited JSON chunks
 * (not native SSE/EventSource — EventSource can't carry the customer's auth
 * header, so the frontend reads this with a manual fetch + stream reader).
 */
export async function streamChatReply(customer, sessionId, userMessage, res) {
  await checkAndIncrementUsage(customer.id);

  let session = sessionId ? await ChatSession.findOne({ _id: sessionId, customerId: customer.id }) : null;
  if (!session) {
    session = new ChatSession({
      customerId: customer.id,
      title: userMessage.slice(0, 60),
      messages: [],
    });
  }
  session.messages.push({ role: "user", content: userMessage, timestamp: new Date() });

  const [access, upcomingEvents] = await Promise.all([
    getEffectiveAccess(customer.id),
    getUpcomingEventsForContext(customer.id),
  ]);
  const systemPrompt = await buildSystemPrompt(customer, access.planId, upcomingEvents);

  const claudeMessages = session.messages
    .slice(-20) // keep the request small — last 20 turns of this session
    .map((m) => ({ role: m.role, content: m.content }));

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.write(JSON.stringify({ type: "session", sessionId: session._id.toString() }) + "\n");

  const client = getClient();
  const tools = [{ type: "web_search_20260209", name: "web_search" }, ...WALLET_TOOLS];
  // Local working copy of the conversation for THIS turn's tool-use loop —
  // tool_use/tool_result blocks live here only; the persisted ChatSession
  // keeps storing plain text turns, same as before the agentic loop existed.
  let messages = [...claudeMessages];
  let fullText = "";
  let refused = false;
  let walletBooking = null;

  try {
    // A single chat turn can take several round-trips when tools are
    // involved: stream, see stop_reason "tool_use", execute the tool(s),
    // feed results back, stream again — until Claude reaches "end_turn".
    for (let iteration = 0; iteration < 6; iteration += 1) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        tools,
        system: systemPrompt,
        messages,
      });

      stream.on("text", (delta) => {
        fullText += delta;
        res.write(JSON.stringify({ type: "delta", text: delta }) + "\n");
      });

      const finalMessage = await stream.finalMessage();

      if (finalMessage.stop_reason === "refusal") {
        refused = true;
        fullText = "I'm not able to help with that request.";
        res.write(JSON.stringify({ type: "delta", text: fullText }) + "\n");
        break;
      }

      if (finalMessage.stop_reason === "pause_turn") {
        // Anthropic-hosted tool (web_search) hit its own iteration limit —
        // just continue the turn, nothing for us to execute.
        messages.push({ role: "assistant", content: finalMessage.content });
        continue;
      }

      if (finalMessage.stop_reason !== "tool_use") break;

      const toolUseBlocks = finalMessage.content.filter((b) => b.type === "tool_use");
      messages.push({ role: "assistant", content: finalMessage.content });

      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        res.write(JSON.stringify({ type: "tool_call", tool: toolUse.name }) + "\n");
        const result = await dispatchWalletTool(customer.id, toolUse);
        if (toolUse.name === "execute_wallet_booking" && result?.success) {
          walletBooking = result;
        }
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) });
      }
      messages.push({ role: "user", content: toolResults });
    }
  } catch (error) {
    res.write(JSON.stringify({ type: "error", message: error.message || "AI request failed." }) + "\n");
    res.end();
    return;
  }

  session.messages.push({ role: "assistant", content: fullText, timestamp: new Date() });
  session.lastMessageAt = new Date();
  await session.save();

  if (walletBooking) {
    res.write(JSON.stringify({ type: "wallet_booking", booking: walletBooking }) + "\n");
  }
  res.write(JSON.stringify({ type: "done", sessionId: session._id.toString(), refused }) + "\n");
  res.end();
}

// ---------------------------------------------------------------------------
// Saved prompts
// ---------------------------------------------------------------------------

export async function listSavedPrompts(customerId) {
  const [prompts, settings] = await Promise.all([
    SavedPrompt.find({ customerId }).sort({ isFavourite: -1, createdAt: -1 }).lean(),
    getGlobalSettings(),
  ]);
  return {
    prompts: prompts.map((p) => ({
      id: p._id.toString(),
      promptText: p.promptText,
      category: p.category,
      isFavourite: p.isFavourite,
      createdAt: p.createdAt,
    })),
    prebuiltPrompts: settings.prebuiltPrompts.map((p) => ({ id: p._id.toString(), text: p.text, category: p.category })),
  };
}

export async function createSavedPrompt(customerId, { promptText, category }) {
  const doc = await SavedPrompt.create({ customerId, promptText, category: category || "general" });
  return { id: doc._id.toString(), promptText: doc.promptText, category: doc.category, isFavourite: doc.isFavourite };
}

export async function updateSavedPrompt(customerId, id, updates) {
  const doc = await SavedPrompt.findOneAndUpdate(
    { _id: id, customerId },
    { $set: updates },
    { new: true }
  );
  if (!doc) {
    const err = new Error("Prompt not found.");
    err.status = 404;
    throw err;
  }
  return { id: doc._id.toString(), promptText: doc.promptText, category: doc.category, isFavourite: doc.isFavourite };
}

export async function deleteSavedPrompt(customerId, id) {
  await SavedPrompt.deleteOne({ _id: id, customerId });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Scheduled prompts
// ---------------------------------------------------------------------------

function getZonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) === 24 ? 0 : Number(map.hour),
    minute: Number(map.minute),
    weekday: weekdayMap[map.weekday],
  };
}

// Builds the UTC instant for a wall-clock time in an IANA zone, with no date
// library: guess UTC == the wall clock, render that guess back in the target
// zone, then correct by however far the render drifted from the guess.
function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const rendered = getZonedParts(guess, timeZone);
  const renderedAsUtc = Date.UTC(rendered.year, rendered.month - 1, rendered.day, rendered.hour, rendered.minute, 0);
  const offset = renderedAsUtc - guess.getTime();
  return new Date(guess.getTime() - offset);
}

export function computeNextRunAt(schedule, from = new Date()) {
  const tz = schedule.timezone || "Europe/Amsterdam";
  if (schedule.type === "once") {
    return schedule.runAt ? new Date(schedule.runAt) : null;
  }

  const [hh, mm] = (schedule.time || "08:00").split(":").map(Number);

  if (schedule.type === "daily") {
    const today = getZonedParts(from, tz);
    let candidate = zonedTimeToUtc(today.year, today.month, today.day, hh, mm, tz);
    if (candidate <= from) {
      const tomorrow = getZonedParts(new Date(candidate.getTime() + 24 * 3600 * 1000), tz);
      candidate = zonedTimeToUtc(tomorrow.year, tomorrow.month, tomorrow.day, hh, mm, tz);
    }
    return candidate;
  }

  if (schedule.type === "weekly") {
    const days = schedule.daysOfWeek || [];
    if (!days.length) return null;
    for (let offset = 0; offset <= 7; offset++) {
      const probe = getZonedParts(new Date(from.getTime() + offset * 86400000), tz);
      if (days.includes(probe.weekday)) {
        const candidate = zonedTimeToUtc(probe.year, probe.month, probe.day, hh, mm, tz);
        if (candidate > from) return candidate;
      }
    }
    return null;
  }

  return null;
}

export async function listScheduledPrompts(customerId) {
  const docs = await ScheduledPrompt.find({ customerId }).sort({ nextRunAt: 1 }).lean();
  return docs.map(formatScheduledPrompt);
}

function formatScheduledPrompt(doc) {
  return {
    id: doc._id.toString(),
    promptText: doc.promptText,
    schedule: doc.schedule,
    deliveryMethod: doc.deliveryMethod,
    status: doc.status,
    lastRunAt: doc.lastRunAt,
    nextRunAt: doc.nextRunAt,
  };
}

export async function createScheduledPrompt(customerId, { promptText, schedule, deliveryMethod }) {
  const nextRunAt = computeNextRunAt(schedule);
  const doc = await ScheduledPrompt.create({
    customerId,
    promptText,
    schedule,
    deliveryMethod: deliveryMethod || "dashboard",
    nextRunAt,
  });
  return formatScheduledPrompt(doc);
}

export async function updateScheduledPrompt(customerId, id, updates) {
  const doc = await ScheduledPrompt.findOne({ _id: id, customerId });
  if (!doc) {
    const err = new Error("Scheduled prompt not found.");
    err.status = 404;
    throw err;
  }
  if (updates.promptText !== undefined) doc.promptText = updates.promptText;
  if (updates.deliveryMethod !== undefined) doc.deliveryMethod = updates.deliveryMethod;
  if (updates.status !== undefined) doc.status = updates.status;
  if (updates.schedule !== undefined) {
    doc.schedule = updates.schedule;
    doc.nextRunAt = computeNextRunAt(updates.schedule);
  }
  await doc.save();
  return formatScheduledPrompt(doc);
}

export async function deleteScheduledPrompt(customerId, id) {
  await ScheduledPrompt.deleteOne({ _id: id, customerId });
  return { success: true };
}

// ---------------------------------------------------------------------------
// Scheduled prompt execution (called by aiSchedulerService) + delivery
// ---------------------------------------------------------------------------

export async function runScheduledPrompt(scheduledPromptDoc) {
  const customer = await User.findById(scheduledPromptDoc.customerId).lean();
  if (!customer) return;

  const [access, upcomingEvents] = await Promise.all([
    getEffectiveAccess(scheduledPromptDoc.customerId),
    getUpcomingEventsForContext(scheduledPromptDoc.customerId),
  ]);

  let resultText = "";
  let deliveryStatus = "delivered";

  if (!access.enabled) {
    resultText = "The AI assistant is currently disabled for this account.";
    deliveryStatus = "failed";
  } else {
    try {
      const client = getClient();
      const systemPrompt = await buildSystemPrompt(customer, access.planId, upcomingEvents);
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        system: systemPrompt,
        messages: [{ role: "user", content: scheduledPromptDoc.promptText }],
      });
      if (message.stop_reason === "refusal") {
        resultText = "The assistant was unable to respond to this scheduled prompt.";
        deliveryStatus = "failed";
      } else {
        resultText = message.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      }
    } catch (error) {
      resultText = `Could not generate a result: ${error.message}`;
      deliveryStatus = "failed";
    }
  }

  const aiResult = await AIResult.create({
    customerId: scheduledPromptDoc.customerId,
    scheduledPromptId: scheduledPromptDoc._id,
    resultText,
    deliveredAt: new Date(),
    deliveryMethod: scheduledPromptDoc.deliveryMethod,
    deliveryStatus,
  });

  if (deliveryStatus === "delivered") {
    await deliverResult(customer, scheduledPromptDoc, aiResult);
  }

  return aiResult;
}

async function deliverResult(customer, scheduledPrompt, aiResult) {
  if (scheduledPrompt.deliveryMethod === "email") {
    const tx = getSmtpTransporter();
    if (tx && customer.email) {
      await tx.sendMail({
        from: env.email.from,
        to: customer.email,
        subject: "Your scheduled AI Assistant update",
        text: `${scheduledPrompt.promptText}\n\n${aiResult.resultText}`,
        html: `<p><strong>${escapeHtml(scheduledPrompt.promptText)}</strong></p><p>${escapeHtml(aiResult.resultText).replace(/\n/g, "<br/>")}</p>`,
      }).catch(() => {});
    }
  } else if (scheduledPrompt.deliveryMethod === "push") {
    const subscriptions = await PushSubscription.find({ customerId: customer._id || customer.id }).lean();
    for (const sub of subscriptions) {
      try {
        const result = await sendPush(sub, {
          title: "V.O.I.C.E. NL Assistant",
          body: aiResult.resultText.slice(0, 140),
        });
        if (result.expired) await PushSubscription.deleteOne({ _id: sub._id });
      } catch {
        // best-effort delivery — failure is recorded on the AIResult already
      }
    }
  }
  // "dashboard" delivery has no extra step — the AIResult itself is what the
  // dashboard reads.
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export async function listResultsForCustomer(customerId, limit = 20) {
  const docs = await AIResult.find({ customerId }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((d) => ({
    id: d._id.toString(),
    scheduledPromptId: d.scheduledPromptId.toString(),
    resultText: d.resultText,
    deliveredAt: d.deliveredAt,
    deliveryMethod: d.deliveryMethod,
    deliveryStatus: d.deliveryStatus,
    readAt: d.readAt,
  }));
}

// ---------------------------------------------------------------------------
// Push subscriptions
// ---------------------------------------------------------------------------

export async function savePushSubscription(customerId, subscription) {
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { customerId, endpoint: subscription.endpoint, keys: subscription.keys },
    { upsert: true }
  );
  return { success: true };
}
