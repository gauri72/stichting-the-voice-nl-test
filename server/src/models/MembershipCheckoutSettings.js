import mongoose from "mongoose";
import {
  DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS,
  DEFAULT_TICKETTAILOR_DISCOUNT_RULES,
} from "../config/checkoutDefaults.js";

const membershipCheckoutSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    allowPurchaseDuringTicketCheckout: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.allowPurchaseDuringTicketCheckout,
    },
    allowRenewalDuringTicketCheckout: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.allowRenewalDuringTicketCheckout,
    },
    availableMembershipTypes: {
      type: [String],
      default: () => [...DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.availableMembershipTypes],
    },
    membershipCheckoutDiscountPercent: {
      type: Number,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.membershipCheckoutDiscountPercent,
      min: 0,
      max: 100,
    },
    instantBenefitRules: {
      applyToCurrentTicketPurchase: {
        type: Boolean,
        default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.instantBenefitRules.applyToCurrentTicketPurchase,
      },
      allowWithCodeDiscounts: {
        type: Boolean,
        default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.instantBenefitRules.allowWithCodeDiscounts,
      },
    },
    enableTicketTailorLookup: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.enableTicketTailorLookup,
    },
    useLiveTicketTailorApi: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.useLiveTicketTailorApi,
    },
    useSyncedTicketTailorData: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.useSyncedTicketTailorData,
    },
    membershipTicketKeywords: {
      type: [String],
      default: () => [...DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.membershipTicketKeywords],
    },
    autoLinkTicketTailorMembership: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.autoLinkTicketTailorMembership,
    },
    applyTicketTailorMembershipDiscounts: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.applyTicketTailorMembershipDiscounts,
    },
    enableMembershipCodeValidation: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.enableMembershipCodeValidation,
    },
    enableTicketTailorMembershipPriority: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.enableTicketTailorMembershipPriority,
    },
    checkTicketTailorBeforeLocal: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.checkTicketTailorBeforeLocal,
    },
    requireLoginForTicketTailorBenefits: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.requireLoginForTicketTailorBenefits,
    },
    allowTicketTailorMembershipDiscountStacking: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.allowTicketTailorMembershipDiscountStacking,
    },
    ticketTailorDiscountRules: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_TICKETTAILOR_DISCOUNT_RULES }),
    },
    enableMembershipTicketDiscountCap: {
      type: Boolean,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.enableMembershipTicketDiscountCap,
    },
    membershipDiscountedTicketCapPerEvent: {
      type: Number,
      default: DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS.membershipDiscountedTicketCapPerEvent,
      min: 0,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "membership_checkout_settings" }
);

const MembershipCheckoutSettings =
  mongoose.models.MembershipCheckoutSettings ||
  mongoose.model("MembershipCheckoutSettings", membershipCheckoutSettingsSchema);

export default MembershipCheckoutSettings;
