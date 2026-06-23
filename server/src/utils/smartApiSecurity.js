import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateIp(ip) {
  if (!ip) return true;
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  return false;
}

export function sanitizeHeaderKey(key) {
  return String(key || "")
    .trim()
    .replace(/[^\w-]/g, "")
    .slice(0, 120);
}

export function sanitizeHeaders(headers = {}) {
  const out = {};
  for (const [rawKey, rawValue] of Object.entries(headers || {})) {
    const key = sanitizeHeaderKey(rawKey);
    if (!key) continue;
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length" || lower === "transfer-encoding") continue;
    out[key] = String(rawValue ?? "").slice(0, 4000);
  }
  return out;
}

export async function assertSafeOutboundUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    const err = new Error("Invalid URL.");
    err.status = 400;
    throw err;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const err = new Error("Only HTTP and HTTPS URLs are allowed.");
    err.status = 400;
    throw err;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local")) {
    const err = new Error("Target host is not allowed.");
    err.status = 400;
    throw err;
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      const err = new Error("Requests to private or internal networks are not allowed.");
      err.status = 400;
      throw err;
    }
    return parsed;
  }

  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  for (const entry of addresses) {
    if (isPrivateIp(entry.address)) {
      const err = new Error("Target host resolves to a private or internal network address.");
      err.status = 400;
      throw err;
    }
  }

  return parsed;
}

const SENSITIVE_KEYS = /password|secret|token|api[_-]?key|authorization|bearer|credential/i;

export function maskSensitiveObject(value, depth = 0) {
  if (depth > 8) return "[truncated]";
  if (value == null) return value;
  if (Array.isArray(value)) return value.map((item) => maskSensitiveObject(item, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.test(key)) {
        out[key] = "••••••••";
      } else {
        out[key] = maskSensitiveObject(val, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 2000) {
    return `${value.slice(0, 2000)}…[truncated]`;
  }
  return value;
}

export function maskSensitiveText(text) {
  if (!text) return "";
  return String(text)
    .replace(/(Bearer\s+)[^\s"']+/gi, "$1••••••••")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"'\s,}]+/gi, "$1••••••••")
    .replace(/("password"\s*:\s*")[^"]+"/gi, '$1••••••••"')
    .slice(0, 8000);
}
