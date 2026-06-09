export const PROFILE_ROUTES = {
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  events: "/events",
  membership: "/membership",
  resetPassword: "/reset-password",
};

export const MOCK_PAYMENT_METHODS = [
  {
    id: "visa-4242",
    brand: "visa",
    label: "Visa",
    last4: "4242",
    expires: "12/28",
    isDefault: true,
  },
  {
    id: "mc-5555",
    brand: "mastercard",
    label: "Mastercard",
    last4: "5555",
    expires: "09/27",
    isDefault: false,
  },
  {
    id: "amex-1005",
    brand: "amex",
    label: "American Express",
    last4: "1005",
    expires: "06/26",
    isDefault: false,
  },
];

export function profileInitials(firstName, lastName, fallback = "U") {
  const value = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase();
  return value || fallback;
}

export function formatProfilePhone(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "—";
  if (raw.startsWith("+")) return raw;
  return `+31 ${raw.replace(/^0/, "")}`;
}
