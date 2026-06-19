import MembershipCheckoutSettings from "../models/MembershipCheckoutSettings.js";
import { DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS } from "../config/checkoutDefaults.js";

export async function getMembershipCheckoutSettings() {
  let doc = await MembershipCheckoutSettings.findOne({ key: "default" }).lean();
  if (!doc) {
    doc = await MembershipCheckoutSettings.create({
      key: "default",
      ...DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS,
    });
    doc = doc.toObject();
  }
  return formatSettings(doc);
}

export async function updateMembershipCheckoutSettings(data, adminId) {
  const update = {};
  if (data.allowPurchaseDuringTicketCheckout !== undefined) {
    update.allowPurchaseDuringTicketCheckout = Boolean(data.allowPurchaseDuringTicketCheckout);
  }
  if (data.allowRenewalDuringTicketCheckout !== undefined) {
    update.allowRenewalDuringTicketCheckout = Boolean(data.allowRenewalDuringTicketCheckout);
  }
  if (Array.isArray(data.availableMembershipTypes)) {
    update.availableMembershipTypes = data.availableMembershipTypes;
  }
  if (data.membershipCheckoutDiscountPercent !== undefined) {
    update.membershipCheckoutDiscountPercent = Math.min(
      100,
      Math.max(0, Number(data.membershipCheckoutDiscountPercent) || 0)
    );
  }
  if (data.instantBenefitRules) {
    update.instantBenefitRules = {
      applyToCurrentTicketPurchase:
        data.instantBenefitRules.applyToCurrentTicketPurchase !== false,
      allowWithCodeDiscounts: data.instantBenefitRules.allowWithCodeDiscounts !== false,
    };
  }
  if (data.enableTicketTailorLookup !== undefined) {
    update.enableTicketTailorLookup = Boolean(data.enableTicketTailorLookup);
  }
  if (data.useLiveTicketTailorApi !== undefined) {
    update.useLiveTicketTailorApi = Boolean(data.useLiveTicketTailorApi);
  }
  if (data.useSyncedTicketTailorData !== undefined) {
    update.useSyncedTicketTailorData = Boolean(data.useSyncedTicketTailorData);
  }
  if (Array.isArray(data.membershipTicketKeywords)) {
    update.membershipTicketKeywords = data.membershipTicketKeywords;
  }
  if (data.autoLinkTicketTailorMembership !== undefined) {
    update.autoLinkTicketTailorMembership = Boolean(data.autoLinkTicketTailorMembership);
  }
  if (data.applyTicketTailorMembershipDiscounts !== undefined) {
    update.applyTicketTailorMembershipDiscounts = Boolean(data.applyTicketTailorMembershipDiscounts);
  }
  if (data.enableMembershipCodeValidation !== undefined) {
    update.enableMembershipCodeValidation = Boolean(data.enableMembershipCodeValidation);
  }
  if (adminId) update.updatedBy = adminId;

  const doc = await MembershipCheckoutSettings.findOneAndUpdate(
    { key: "default" },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return formatSettings(doc);
}

function formatSettings(doc) {
  return {
    allowPurchaseDuringTicketCheckout: doc.allowPurchaseDuringTicketCheckout !== false,
    allowRenewalDuringTicketCheckout: doc.allowRenewalDuringTicketCheckout !== false,
    availableMembershipTypes: doc.availableMembershipTypes || [],
    membershipCheckoutDiscountPercent: doc.membershipCheckoutDiscountPercent || 0,
    instantBenefitRules: {
      applyToCurrentTicketPurchase:
        doc.instantBenefitRules?.applyToCurrentTicketPurchase !== false,
      allowWithCodeDiscounts: doc.instantBenefitRules?.allowWithCodeDiscounts !== false,
    },
    enableTicketTailorLookup: doc.enableTicketTailorLookup !== false,
    useLiveTicketTailorApi: doc.useLiveTicketTailorApi !== false,
    useSyncedTicketTailorData: doc.useSyncedTicketTailorData !== false,
    membershipTicketKeywords:
      doc.membershipTicketKeywords?.length > 0
        ? doc.membershipTicketKeywords
        : DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.membershipTicketKeywords,
    autoLinkTicketTailorMembership: doc.autoLinkTicketTailorMembership !== false,
    applyTicketTailorMembershipDiscounts: doc.applyTicketTailorMembershipDiscounts !== false,
    enableMembershipCodeValidation: doc.enableMembershipCodeValidation !== false,
    updatedAt: doc.updatedAt,
  };
}
