export const SPONSOR_TYPES = ["individual", "company", "organization"];
export const DONOR_TYPES = ["individual", "company", "anonymous"];

export const SPONSORSHIP_STATUSES = [
  "draft",
  "pending",
  "confirmed",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
  "completed",
];

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "partially_paid",
  "refunded",
  "failed",
];

export const RECEIPT_STATUSES = ["not_sent", "sent", "resent", "downloaded"];

export const FOLLOW_UP_STATUSES = [
  "no_follow_up",
  "reminder_due",
  "reminder_sent",
  "waiting_response",
  "completed",
];

export const DONATION_TYPES = [
  "one_time",
  "recurring",
  "campaign",
  "anonymous",
  "in_kind",
];

export const DONATION_STATUSES = ["pending", "paid", "failed", "refunded", "cancelled"];

export const RECURRING_STATUSES = [
  "not_recurring",
  "active",
  "paused",
  "cancelled",
  "failed_payment",
];

export const RECURRING_FREQUENCIES = ["", "monthly", "quarterly", "yearly"];

export const PAYMENT_METHODS = [
  "",
  "card",
  "bank_transfer",
  "ideal",
  "paypal",
  "cash",
  "other",
];

export const REMINDER_TEMPLATE_TYPES = {
  sponsorship: [
    "payment_reminder",
    "overdue_reminder",
    "confirmation",
    "thank_you",
    "receipt",
    "invoice",
  ],
  donation: [
    "receipt",
    "thank_you",
    "reminder",
    "recurring_reminder",
    "failed_payment",
    "campaign_followup",
  ],
};

export const SPONSORSHIP_PACKAGES = [
  { id: "associate", name: "Associate", amountMinor: 25000 },
  { id: "silver", name: "Silver", amountMinor: 50000 },
  { id: "gold", name: "Gold", amountMinor: 100000 },
  { id: "platinum", name: "Platinum", amountMinor: 250000 },
  { id: "custom", name: "Custom", amountMinor: 0 },
];

export const DEFAULT_CURRENCY = "EUR";
