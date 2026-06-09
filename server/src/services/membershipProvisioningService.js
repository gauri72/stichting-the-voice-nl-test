import crypto from "crypto";
import mongoose from "mongoose";
import env from "../config/env.js";
import { getPlan } from "../config/membershipPlans.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import { buildMembershipId } from "../utils/membershipId.js";
import { buildMembershipReceiptNumber } from "../utils/membershipReceiptNumber.js";
import { buildMembershipQrImageUrl } from "./membershipQrService.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Member",
    lastName: parts.slice(1).join(" ")
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateGb(date) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatAmountMinor(amountMinor, currency = "eur") {
  const value = Number(amountMinor || 0) / 100;
  const isWhole = Math.abs(value - Math.round(value)) < 0.005;
  return value.toFixed(isWhole ? 0 : 2);
}

/**
 * Idempotent: creates or returns an existing member for a succeeded payment intent.
 * @param {import('stripe').Stripe.PaymentIntent} intent
 */
export async function provisionMembershipFromPayment(intent) {
  if (!intent?.id || intent.status !== "succeeded") {
    throw new Error("Payment intent has not succeeded.");
  }

  const existing = await Member.findOne({ paymentReference: intent.id });
  if (existing) {
    const plan = getPlan(existing.planId);
    return {
      member: existing.toObject(),
      created: false,
      emailPayload: buildMembershipEmailPayload({
        member: existing,
        plan: plan || { benefits: [] },
        intent,
        paymentMethod: intent.metadata?.payment_method_label || "Card via Stripe"
      })
    };
  }

  const meta = intent.metadata || {};
  const plan = getPlan(meta.tier_id);
  if (!plan) {
    throw new Error(`Unknown membership plan: ${meta.tier_id}`);
  }

  const email = normalizeEmail(meta.sponsor_email);
  if (!email) {
    throw new Error("Member email is required in payment metadata.");
  }

  const { firstName, lastName } = splitName(meta.sponsor_name);
  const startDate = intent.created ? new Date(intent.created * 1000) : new Date();
  const expiryDate = addDays(startDate, plan.durationDays || 365);
  const verificationToken = crypto.randomUUID();
  const qrCodeUrl = buildMembershipQrImageUrl(verificationToken);
  const membershipId = await buildMembershipId(plan.id, startDate);
  const receiptNumber = await buildMembershipReceiptNumber(startDate);
  const amountPaidMinor = intent.amount_received || intent.amount;

  // Attribute the membership to the account that owns the member email — NOT the
  // logged-in user from metadata. Otherwise a logged-in user who enters someone
  // else's email at checkout would have the membership linked to their account.
  let userId = null;
  const emailOwner = await User.findOne({ email }).select("_id").lean();
  if (emailOwner) {
    userId = emailOwner._id;
  } else if (meta.user_id && mongoose.isValidObjectId(meta.user_id)) {
    userId = new mongoose.Types.ObjectId(meta.user_id);
  }

  // The unique paymentReference index on Member is the SINGLE idempotency gate.
  // Create it first: if the Stripe webhook and the client confirmation race, only
  // one create wins. The loser returns the existing record without writing any
  // further state, so one payment can never produce duplicate members OR duplicate
  // active memberships — no overlap or override regardless of how many times the
  // intent is processed.
  let member;
  try {
    member = await Member.create({
      membershipId,
      firstName: meta.sponsor_first_name || firstName,
      lastName: meta.sponsor_last_name || lastName,
      email,
      membershipType: plan.name,
      planId: plan.id,
      amountPaidMinor,
      currency: String(intent.currency || "eur").toLowerCase(),
      startDate,
      expiryDate,
      membershipStatus: "active",
      qrCodeUrl,
      verificationToken,
      paymentReference: intent.id,
      receiptNumber,
      userId
    });
  } catch (error) {
    if (error?.code === 11000) {
      const winner = await Member.findOne({ paymentReference: intent.id });
      if (winner) {
        const winnerPlan = getPlan(winner.planId) || plan;
        return {
          member: winner.toObject(),
          created: false,
          emailPayload: buildMembershipEmailPayload({
            member: winner,
            plan: winnerPlan,
            intent,
            paymentMethod: meta.payment_method_label || "Card via Stripe"
          })
        };
      }
    }
    throw error;
  }

  // Only the winning run reaches here, so the user's single active membership is
  // updated exactly once per payment (keyed by userId + active).
  if (userId) {
    await Membership.findOneAndUpdate(
      { userId, active: true },
      {
        userId,
        active: true,
        planId: plan.id,
        planName: plan.name,
        feeMinor: amountPaidMinor,
        currency: String(intent.currency || "eur").toLowerCase(),
        startedAt: startDate,
        endsAt: expiryDate,
        membershipNumber: membershipId
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  return {
    member: member.toObject(),
    created: true,
    emailPayload: buildMembershipEmailPayload({
      member,
      plan,
      intent,
      paymentMethod: meta.payment_method_label || "Card via Stripe"
    })
  };
}

export function buildMembershipEmailPayload({ member, plan, intent, paymentMethod }) {
  const benefits = [...(plan.benefits || [])];
  while (benefits.length < 4) benefits.push("");

  const amountPaid = formatAmountMinor(member.amountPaidMinor, member.currency);

  return {
    member_name: `${member.firstName} ${member.lastName}`.trim(),
    member_email: member.email,
    membership_type: member.membershipType,
    membership_id: member.membershipId,
    valid_from: formatDateGb(member.startDate),
    valid_until: formatDateGb(member.expiryDate),
    payment_status: "Paid",
    qr_code_url: member.qrCodeUrl,
    verification_token: member.verificationToken,
    benefit_1: benefits[0],
    benefit_2: benefits[1],
    benefit_3: benefits[2],
    benefit_4: benefits[3],
    receipt_number: member.receiptNumber,
    amount_paid: amountPaid,
    payment_reference: member.paymentReference,
    payment_method: paymentMethod,
    subtotal: amountPaid,
    tax_amount: "0.00",
    total_paid: amountPaid,
    member_portal_url: `${env.clientUrl.replace(/\/$/, "")}/dashboard`
  };
}
