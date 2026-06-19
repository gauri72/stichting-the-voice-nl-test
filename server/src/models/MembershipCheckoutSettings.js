import mongoose from "mongoose";
import { DEFAULT_MEMBERSHIP_CHECKOUT_SETTINGS } from "../config/checkoutDefaults.js";

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
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "membership_checkout_settings" }
);

const MembershipCheckoutSettings =
  mongoose.models.MembershipCheckoutSettings ||
  mongoose.model("MembershipCheckoutSettings", membershipCheckoutSettingsSchema);

export default MembershipCheckoutSettings;
