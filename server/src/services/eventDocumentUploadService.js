import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_SIZE,
  MAX_STAGE_IMAGE_SIZE,
} from "../config/eventOperationsConfig.js";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "event-operations");

function throwError(msg) {
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

export function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  const size = Math.ceil((base64.length * 3) / 4);
  return { mime, base64, size };
}

function extFromMime(mime) {
  const map = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
    "text/csv": "csv",
  };
  return map[mime] || mime.split("/")[1] || "bin";
}

export async function saveOperationsFile({ dataUrl, subfolder = "documents", maxSize = MAX_DOCUMENT_SIZE }) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throwError("Invalid file data.");
  if (!ALLOWED_DOCUMENT_MIME.includes(parsed.mime)) {
    throwError(`Unsupported file type: ${parsed.mime}`);
  }
  if (parsed.size > maxSize) {
    throwError(`File too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB.`);
  }
  const uploadDir = path.join(UPLOAD_ROOT, subfolder);
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = extFromMime(parsed.mime);
  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const abs = path.join(uploadDir, name);
  await fs.writeFile(abs, Buffer.from(parsed.base64, "base64"));
  return {
    fileUrl: `/uploads/event-operations/${subfolder}/${name}`,
    mimeType: parsed.mime,
    fileType: ext,
    fileSize: parsed.size,
  };
}

export async function saveStagePlanImage(dataUrl) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throwError("Invalid image data.");
  if (!parsed.mime.startsWith("image/")) throwError("Stage plan image must be an image file.");
  if (parsed.size > MAX_STAGE_IMAGE_SIZE) throwError("Image too large. Maximum 8MB.");
  return saveOperationsFile({ dataUrl, subfolder: "stage-plans", maxSize: MAX_STAGE_IMAGE_SIZE });
}

export async function saveGlobalInventoryImage(dataUrl) {
  return saveOperationsFile({ dataUrl, subfolder: "inventory-images", maxSize: MAX_STAGE_IMAGE_SIZE });
}
