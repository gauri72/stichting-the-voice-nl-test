import DiscountRule from "../models/DiscountRule.js";
import { getNextSequence } from "../utils/sequence.js";
import { sendReferralCodeCreatedEmail } from "./discountMailer.js";
import env from "../config/env.js";

async function buildDiscountId() {
  const seq = await getNextSequence("discount_rule");
  const year = new Date().getFullYear();
  return `DSC-${year}-${String(seq).padStart(6, "0")}`;
}

const MAX_ATTEMPTS = 5;
const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids look-alike codes

function randomSuffix(length = 4) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return out;
}

function namePrefix(user) {
  const raw = String(user?.firstName || "").trim().toUpperCase();
  // Only plain A-Z survives — a name with no usable Latin characters (empty after
  // stripping, or too short to be a meaningful prefix) falls back to a fully random code.
  const cleaned = raw.replace(/[^A-Z]/g, "");
  return cleaned.length >= 2 ? cleaned.slice(0, 10) : "";
}

async function isCodeTaken(code) {
  const existing = await DiscountRule.findOne({ code }).select("_id").lean();
  return Boolean(existing);
}

async function generateUniqueCode(user) {
  const prefix = namePrefix(user);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const usePrefix = prefix && attempt < MAX_ATTEMPTS - 1; // last attempt always goes fully random
    const candidate = usePrefix ? `${prefix}-${randomSuffix()}` : randomSuffix(8);
    if (!(await isCodeTaken(candidate))) return candidate;
  }
  // Astronomically unlikely to reach here, but never loop forever.
  throw Object.assign(new Error("Could not generate a unique referral code."), { status: 500 });
}

/**
 * Returns the user's active referral code, auto-issuing one (a DiscountRule with
 * type: "referral_code") from the program's current defaults if they don't have one yet.
 * Read-time issuance (not signup-time) — the first time this is called for a given user
 * (typically their first dashboard visit) is when the code comes into existence.
 */
export async function getOrIssueReferralCode(user, settings) {
  const userId = user._id || user.id;
  const email = String(user.email || "").toLowerCase().trim();

  const existing = await DiscountRule.findOne({
    type: "referral_code",
    $or: [{ referrerUserId: userId }, { referrerEmail: email }],
    status: "active",
  }).lean();
  if (existing) return existing;

  const code = await generateUniqueCode(user);
  const discountId = await buildDiscountId();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  // findOneAndUpdate+upsert instead of a plain create(): two near-simultaneous first
  // dashboard visits (e.g. two tabs, or a double-fired effect) both pass the "no existing
  // code" check above before either writes — this collapses the create into one atomic
  // operation keyed on referrerUserId, so at most one of the two racing requests actually
  // inserts a document; the other gets the winner's doc back via `new: true` instead of
  // creating a second one. (Narrows the race to the same accepted-risk class as this
  // codebase's other check-then-write uniqueness checks — a true guarantee would need a
  // unique index on referrerUserId, which isn't something to add without checking for
  // existing duplicate data first.)
  let issued;
  try {
    issued = await DiscountRule.findOneAndUpdate(
      { type: "referral_code", referrerUserId: userId },
      {
        $setOnInsert: {
          discountId,
          name: `Referral — ${fullName || email}`,
          code,
          type: "referral_code",
          // Schema default is "tickets" — referral codes need to redeem on membership
          // checkout too, not just ticket checkout.
          appliesTo: "both",
          discountType: settings.defaultDiscountType,
          discountValue: settings.defaultDiscountValue,
          referrerUserId: userId,
          referrerEmail: email,
          referrerName: fullName,
          rewardType: settings.defaultRewardType,
          rewardValue: settings.defaultRewardValue,
          // One reward per referred person, not one per order — otherwise a referrer and
          // one friend could just transact normally forever and generate a reward on every
          // single purchase. usageLimitPerUser already exists and is enforced generically
          // by validateRuleEligibility/countUserDiscountUsage, so this is reuse, not a new
          // mechanism — it also caps the buyer's own discount to their first use, which is
          // the same "reward acquisition, not a standing discount" intent.
          usageLimitPerUser: 1,
          status: "active",
          visibleToUsers: true,
          showOnDashboard: true,
          source: "referral",
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      issued = await DiscountRule.findOne({ type: "referral_code", referrerUserId: userId }).lean();
      if (!issued) throw err;
    } else {
      throw err;
    }
  }

  // Only notify on a genuine fresh issuance, not when this call raced another one and
  // simply got the winner's already-existing document back.
  const justCreated = Date.now() - new Date(issued.createdAt).getTime() < 5000;
  if (justCreated) {
    const referralLink = `${env.clientUrl.replace(/\/$/, "")}/events?ref=${encodeURIComponent(issued.code)}`;
    sendReferralCodeCreatedEmail({
      email,
      firstName: user.firstName || "",
      discountCode: issued.code,
      referralLink,
    }).catch((err) => console.error("[referrals] referral code created email failed:", err.message));
  }

  return issued;
}
