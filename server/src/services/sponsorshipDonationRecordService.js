import Sponsorship from "../models/Sponsorship.js";
import Donation from "../models/Donation.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { getNextSequence } from "../utils/sequence.js";
import { buildReceiptNumber } from "../utils/receiptNumber.js";

function logRecord(tag, payload = {}) {
  const parts = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${tag}]${parts ? ` ${parts}` : ""}`);
}

async function nextPublicId(prefix) {
  const seq = await getNextSequence(prefix);
  const year = new Date().getFullYear();
  return `${prefix.toUpperCase()}-${year}-${String(seq).padStart(6, "0")}`;
}

function resolvePaidAt(intent) {
  if (intent.created) return new Date(intent.created * 1000);
  if (intent.paidAt) return new Date(intent.paidAt);
  return new Date();
}

function resolveAmountMinor(intent) {
  return intent.amount_received || intent.amount || intent.amountMinor || 0;
}

function resolveCurrency(intent) {
  return String(intent.currency || "eur").toUpperCase();
}

function buildMetaFromIntent(intent) {
  return intent.metadata || intent.meta || {};
}

export async function upsertSponsorshipFromPaymentIntent(intent, paymentMethod = "Card via Stripe") {
  const meta = buildMetaFromIntent(intent);
  const kind = meta.payment_kind;
  if (kind === "donation" || kind === "membership" || kind === "event_ticket" || kind === "ticket_and_membership") {
    return null;
  }

  const paymentReference = intent.id || intent.paymentIntentId;
  if (!paymentReference) return null;

  const email = String(meta.sponsor_email || "").trim().toLowerCase();
  if (!email) {
    logRecord("PAYMENT_WITHOUT_SPONSORSHIP_OR_DONATION_RECORD", {
      reason: "missing_email",
      paymentReference,
      kind: kind || "sponsorship",
    });
    return null;
  }

  const existing = await Sponsorship.findOne({ paymentReference });
  if (existing) {
    if (existing.paymentStatus !== "paid") {
      const paidAt = resolvePaidAt(intent);
      await Sponsorship.updateOne(
        { _id: existing._id },
        {
          $set: {
            paymentStatus: "paid",
            sponsorshipStatus: "paid",
            paymentMethod,
            paymentDate: paidAt,
          },
        }
      );
    }
    logRecord("PAYMENT_LINKED_TO_SPONSORSHIP", {
      paymentReference,
      sponsorshipId: existing.sponsorshipId,
      existing: true,
      paymentStatus: "paid",
    });
    return existing;
  }

  const paidAt = resolvePaidAt(intent);
  const amountMinor = resolveAmountMinor(intent);
  const receiptNumber = meta.receipt_number || buildReceiptNumber(paymentReference, intent.created);
  const sponsorName = String(meta.sponsor_name || email.split("@")[0] || "Sponsor").trim();
  const organization = String(meta.sponsor_organization || "").trim();

  const doc = await Sponsorship.create({
    sponsorshipId: await nextPublicId("SPN"),
    sponsorType: organization ? "company" : "individual",
    sponsorName,
    companyName: organization,
    contactPerson: sponsorName,
    email,
    phone: String(meta.sponsor_phone || "").trim(),
    address: "",
    packageName: String(meta.tier_name || meta.tier_id || "Website").trim(),
    amount: amountMinor,
    currency: resolveCurrency(intent),
    campaignName: String(meta.tier_name || "Website Sponsorship").trim(),
    sponsorshipStatus: "paid",
    paymentStatus: "paid",
    paymentReference,
    paymentMethod,
    paymentDate: paidAt,
    receiptNumber,
    receiptStatus: "sent",
    receiptSentAt: paidAt,
    followUpStatus: "completed",
    notes: String(meta.sponsor_message || "").trim(),
    source: meta.source || "website_payment",
  });

  logRecord("SPONSORSHIP_RECORD_CREATED", {
    sponsorshipId: doc.sponsorshipId,
    paymentReference,
    email,
    amountMinor,
  });
  logRecord("PAYMENT_LINKED_TO_SPONSORSHIP", {
    paymentReference,
    sponsorshipId: doc.sponsorshipId,
  });

  return doc;
}

export async function upsertDonationFromPaymentIntent(intent, paymentMethod = "Card via Stripe") {
  const meta = buildMetaFromIntent(intent);
  if (meta.payment_kind !== "donation") return null;

  const paymentReference = intent.id || intent.paymentIntentId;
  if (!paymentReference) return null;

  const email = String(meta.sponsor_email || "").trim().toLowerCase();
  if (!email) {
    logRecord("PAYMENT_WITHOUT_SPONSORSHIP_OR_DONATION_RECORD", {
      reason: "missing_email",
      paymentReference,
      kind: "donation",
    });
    return null;
  }

  const existing = await Donation.findOne({ paymentReference });
  if (existing) {
    if (existing.paymentStatus !== "paid") {
      const paidAt = resolvePaidAt(intent);
      await Donation.updateOne(
        { _id: existing._id },
        {
          $set: {
            paymentStatus: "paid",
            paymentMethod,
            paymentDate: paidAt,
            donationDate: paidAt,
          },
        }
      );
    }
    logRecord("PAYMENT_LINKED_TO_DONATION", {
      paymentReference,
      donationId: existing.donationId,
      existing: true,
      paymentStatus: "paid",
    });
    return existing;
  }

  const paidAt = resolvePaidAt(intent);
  const amountMinor = resolveAmountMinor(intent);
  const receiptNumber = meta.receipt_number || buildReceiptNumber(paymentReference, intent.created);
  const donorName = String(meta.sponsor_name || email.split("@")[0] || "Donor").trim();

  const doc = await Donation.create({
    donationId: await nextPublicId("DON"),
    donorType: "individual",
    donorName,
    email,
    phone: String(meta.sponsor_phone || "").trim(),
    country: String(meta.sponsor_country || "").trim(),
    donationType: "one_time",
    amount: amountMinor,
    currency: resolveCurrency(intent),
    campaignName: String(meta.tier_name || "General Donation").trim(),
    paymentMethod,
    paymentStatus: "paid",
    paymentReference,
    paymentDate: paidAt,
    donationDate: paidAt,
    receiptNumber,
    receiptStatus: "sent",
    receiptSentAt: paidAt,
    recurringStatus: "not_recurring",
    notes: String(meta.sponsor_message || "").trim(),
    source: meta.source || "website_payment",
  });

  logRecord("DONATION_RECORD_CREATED", {
    donationId: doc.donationId,
    paymentReference,
    email,
    amountMinor,
  });
  logRecord("PAYMENT_LINKED_TO_DONATION", {
    paymentReference,
    donationId: doc.donationId,
  });

  return doc;
}

export async function linkPaymentIntentToRecords(intent, paymentMethod = "Card via Stripe") {
  logRecord("PAYMENT_WEBHOOK_RECEIVED", {
    paymentReference: intent.id,
    kind: intent.metadata?.payment_kind || "sponsorship",
    status: intent.status,
  });

  if (intent.metadata?.payment_kind === "donation") {
    return { donation: await upsertDonationFromPaymentIntent(intent, paymentMethod) };
  }

  if (
    intent.metadata?.payment_kind === "membership" ||
    intent.metadata?.payment_kind === "event_ticket" ||
    intent.metadata?.payment_kind === "ticket_and_membership"
  ) {
    return {};
  }

  return { sponsorship: await upsertSponsorshipFromPaymentIntent(intent, paymentMethod) };
}

/** Backfill Sponsorship/Donation collections from payment_transactions. */
export async function backfillFromPaymentTransactions() {
  const transactions = await PaymentTransaction.find({
    kind: { $in: ["sponsorship", "donation"] },
  })
    .sort({ paidAt: 1 })
    .lean();

  let sponsorshipsCreated = 0;
  let donationsCreated = 0;
  let skipped = 0;

  for (const txn of transactions) {
    const intent = {
      id: txn.paymentIntentId,
      paymentIntentId: txn.paymentIntentId,
      status: "succeeded",
      amount_received: txn.amountMinor,
      amountMinor: txn.amountMinor,
      currency: txn.currency,
      created: Math.floor(new Date(txn.paidAt).getTime() / 1000),
      paidAt: txn.paidAt,
      metadata: {
        payment_kind: txn.kind,
        sponsor_email: txn.donorEmail,
        sponsor_name: txn.donorEmail?.split("@")[0] || (txn.kind === "donation" ? "Donor" : "Sponsor"),
        tier_name: txn.tierName || "",
        tier_id: txn.tierId || "",
        receipt_number: txn.receiptNumber || "",
        source: "legacy_backfill",
      },
    };

    if (txn.kind === "donation") {
      const before = await Donation.countDocuments({ paymentReference: txn.paymentIntentId });
      await upsertDonationFromPaymentIntent(intent, "Card via Stripe");
      const after = await Donation.countDocuments({ paymentReference: txn.paymentIntentId });
      if (after > before) donationsCreated += 1;
      else skipped += 1;
    } else {
      const before = await Sponsorship.countDocuments({ paymentReference: txn.paymentIntentId });
      await upsertSponsorshipFromPaymentIntent(intent, "Card via Stripe");
      const after = await Sponsorship.countDocuments({ paymentReference: txn.paymentIntentId });
      if (after > before) sponsorshipsCreated += 1;
      else skipped += 1;
    }
  }

  return {
    processed: transactions.length,
    sponsorshipsCreated,
    donationsCreated,
    skipped,
  };
}
