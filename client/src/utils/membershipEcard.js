import { apiFetch, apiUrl, authHeaders } from "./api.js";

const ORG_NAME = "STICHTING THE V.O.I.C.E. NL";
const ORG_TAGLINE =
  "THE VISION OF INTERNATIONAL CULTURAL EXCHANGE IN THE NETHERLANDS";

export { ORG_NAME, ORG_TAGLINE };

export function membershipYear(validTo, validFrom, membershipId) {
  const fromId = String(membershipId || "").match(/20\d{2}/);
  if (fromId) return fromId[0];

  for (const value of [validTo, validFrom]) {
    if (!value || value === "—") continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return String(parsed.getUTCFullYear());
    const match = String(value).match(/20\d{2}/);
    if (match) return match[0];
  }

  return String(new Date().getFullYear());
}

export function formatEcardDate(value) {
  if (!value || value === "—") return "—";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(parsed)
      .toUpperCase();
  }

  return String(value).toUpperCase();
}

export function memberLevelLabel(planShort, planId) {
  const raw = String(planShort || "")
    .replace(/\bmembership\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (raw) return raw.toUpperCase();

  switch (planId) {
    case "family":
      return "PREMIUM FAMILY";
    case "single":
      return "PREMIUM SINGLE";
    case "privilegedFamily":
      return "PRIVILEGED FAMILY";
    case "privilegedSingle":
      return "PRIVILEGED SINGLE";
    default:
      return "MEMBER";
  }
}

export async function downloadMembershipEcard(element, membershipId) {
  if (!element) return;

  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const code = String(membershipId || "voice-membership").replace(/[^\w-]+/g, "-");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `voice-membership-${code}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function fetchWalletBlob(path) {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    let message = "Could not add pass to wallet.";
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      message = data?.error || data?.message || message;
    } else {
      const text = await response.text().catch(() => "");
      if (text && !text.trimStart().startsWith("<")) message = text.slice(0, 200);
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.blob();
}

export async function addMembershipToAppleWallet() {
  const blob = await fetchWalletBlob("/api/dashboard/memberships/wallet/apple");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "voice-membership.pkpass";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function addMembershipToGoogleWallet() {
  const data = await apiFetch("/api/dashboard/memberships/wallet/google", {
    headers: authHeaders(),
  });
  if (!data?.saveUrl) {
    throw new Error("Google Wallet link is unavailable.");
  }
  window.open(data.saveUrl, "_blank", "noopener,noreferrer");
}
