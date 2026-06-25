export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function trimField(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}
