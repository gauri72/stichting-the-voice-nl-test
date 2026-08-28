import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import Anthropic from "@anthropic-ai/sdk";
import env from "../config/env.js";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessProfile from "../models/BusinessProfile.js";
import { parseRow } from "./businessExcelImportService.js";

const MAX_TEXT_CHARS = 20000;
const MAX_EXTRACTED_ROWS = 200;

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function makeUniqueProductSlug(businessId, base) {
  let slug = base;
  let attempt = 0;
  while (await BusinessProduct.exists({ businessId, slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

async function assertOwnership(businessId, userId) {
  const business = await BusinessProfile.findById(businessId).lean();
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }
  if (business.userId.toString() !== userId.toString()) {
    const err = new Error("Forbidden.");
    err.status = 403;
    throw err;
  }
}

async function extractTextFromDocument(buffer, mimetype, filename) {
  const isPdf = mimetype === "application/pdf" || /\.pdf$/i.test(filename || "");
  const isDocx =
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(filename || "");

  let text = "";
  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      text = result.text || "";
    } finally {
      await parser.destroy?.();
    }
  } else if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
  } else {
    const err = new Error("Only .pdf or .docx files are supported.");
    err.status = 400;
    throw err;
  }

  if (!text.trim()) {
    const err = new Error("Could not read any text from this document.");
    err.status = 400;
    throw err;
  }

  return text.slice(0, MAX_TEXT_CHARS);
}

let cachedClient = null;
function getClient() {
  if (!env.anthropic.apiKey) {
    const err = new Error("AI assistant is not configured (ANTHROPIC_API_KEY missing).");
    err.status = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: env.anthropic.apiKey });
  }
  return cachedClient;
}

export function isDocumentImportConfigured() {
  return Boolean(env.anthropic.apiKey);
}

const EXTRACTION_PROMPT = `You are extracting a product/service catalog from a business document for an online marketplace.

Below is text extracted from a document (menu, price list, services sheet, etc.). Identify every distinct product or service offered, along with its price.

Respond with ONLY a JSON array (no markdown code fences, no commentary, no explanation) where each item has exactly these fields:
- "name": string, the product/service name
- "description": string, a short 1-2 sentence description (empty string "" if nothing is stated)
- "type": one of "physical", "digital", "service" — infer from context
- "priceEUR": number, the price in EUR as a plain decimal number with no currency symbol (e.g. 12.5, not "€12.50"). If a range is given, use the lower bound.
- "stockCount": number or null if not mentioned
- "deliveryInfo": string, empty "" if not mentioned
- "tags": string, 1-4 relevant keywords separated by commas, or "" if none apply

Skip non-product content such as company info, terms and conditions, opening hours, or contact details. Omit any item that has no identifiable price. If you find no identifiable products or services, respond with an empty array: []`;

function stripJsonFence(raw) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

async function extractProductsWithAi(text) {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: `${EXTRACTION_PROMPT}\n\n---\nDOCUMENT TEXT:\n${text}` }],
  });

  const raw = message.content?.[0]?.type === "text" ? message.content[0].text : "";
  let parsed;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch {
    const err = new Error("The AI could not extract a structured product list from this document. Try a document with clearer product listings.");
    err.status = 422;
    throw err;
  }

  if (!Array.isArray(parsed)) {
    const err = new Error("The AI could not extract a structured product list from this document. Try a document with clearer product listings.");
    err.status = 422;
    throw err;
  }

  return parsed.slice(0, MAX_EXTRACTED_ROWS);
}

export async function previewProductsFromDocument(userId, businessId, buffer, mimetype, filename) {
  await assertOwnership(businessId, userId);

  const text = await extractTextFromDocument(buffer, mimetype, filename);
  const aiRows = await extractProductsWithAi(text);

  const rows = aiRows.map((aiRow, i) => {
    const parsed = parseRow(aiRow || {}, i + 1);
    return {
      rowNumber: i + 1,
      valid: parsed.valid,
      errors: parsed.errors,
      name: parsed.data.name,
      description: parsed.data.description,
      type: parsed.data.type,
      priceEUR: Number.isFinite(parsed.data.priceMinor) ? parsed.data.priceMinor / 100 : (aiRow?.priceEUR ?? ""),
      stockCount: parsed.data.stockCount,
      deliveryInfo: parsed.data.deliveryInfo,
      isAvailable: parsed.data.isAvailable,
      tags: parsed.data.tags.join(", "),
    };
  });

  return { rows, sourceFilename: filename };
}

export async function confirmProductsFromDocument(userId, businessId, rows, filename) {
  await assertOwnership(businessId, userId);

  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    return { imported: 0, skipped: 0, errors: [] };
  }

  let imported = 0;
  let skipped = 0;
  const errorList = [];

  for (let i = 0; i < list.length; i++) {
    const parsed = parseRow(list[i] || {}, i + 1);

    if (!parsed.valid) {
      skipped += 1;
      errorList.push({ row: parsed.rowNumber, message: parsed.errors.join("; ") });
      continue;
    }

    const { data } = parsed;
    const slug = await makeUniqueProductSlug(businessId, generateSlug(data.name));

    await BusinessProduct.findOneAndUpdate(
      { businessId, slug: generateSlug(data.name) },
      {
        $set: {
          businessId,
          name: data.name,
          slug,
          description: data.description,
          type: data.type,
          priceMinor: data.priceMinor,
          stockCount: data.stockCount,
          deliveryInfo: data.deliveryInfo,
          isAvailable: data.isAvailable,
          minOrderQty: data.minOrderQty,
          tags: data.tags,
        },
        $setOnInsert: { sortOrder: 0, isFeatured: false, imageUrls: [], variants: [], bulkPricingTiers: [], currency: "eur" },
      },
      { upsert: true, new: true }
    );

    imported += 1;
  }

  await BusinessProfile.findByIdAndUpdate(businessId, {
    $push: {
      importLogs: {
        $each: [{ filename, importedAt: new Date(), importedCount: imported, errorCount: skipped }],
        $slice: -20,
      },
    },
  });

  return { imported, skipped, errors: errorList };
}
