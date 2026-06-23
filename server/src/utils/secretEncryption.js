import crypto from "crypto";
import env from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey() {
  const raw =
    process.env.SETTINGS_ENCRYPTION_KEY ||
    env.auth.jwtSecret ||
    "dev-only-settings-encryption-key-change-me";
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext) {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload) {
  if (!payload || !String(payload).startsWith("enc:")) return payload || "";
  const [, ivB64, tagB64, dataB64] = String(payload).split(":");
  if (!ivB64 || !tagB64 || !dataB64) return "";
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function maskSecret(value, visibleTail = 4) {
  if (!value) return "";
  const str = String(value);
  if (str.length <= visibleTail) return "••••";
  return `••••••••••••${str.slice(-visibleTail)}`;
}

export function isEncryptedValue(value) {
  return String(value || "").startsWith("enc:");
}
