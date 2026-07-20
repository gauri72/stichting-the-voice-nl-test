import TranslationReview from "../../models/TranslationReview.js";
import { getFileContent, updateFileContent } from "./githubContentsService.js";

function localePath(lang, namespace) {
  return `client/src/i18n/locales/${lang}/${namespace}.json`;
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]] ??= {};
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

export async function createPendingBatch(items, commitSha) {
  if (!items?.length) return [];
  const docs = items.map((item) => ({ ...item, commitSha, status: "pending" }));
  return TranslationReview.insertMany(docs);
}

export function listPending() {
  return TranslationReview.find({ status: "pending" }).sort({ namespace: 1, key: 1, lang: 1 });
}

async function writeLocaleKey({ namespace, lang, key, value }) {
  const path = localePath(lang, namespace);
  const { content } = await getFileContent(path);
  const flat = flatten(JSON.parse(content));
  if (value === null) delete flat[key];
  else flat[key] = value;
  const nextContent = `${JSON.stringify(unflatten(flat), null, 2)}\n`;
  return updateFileContent(path, nextContent, `Admin ${value === null ? "rejected" : "approved"} translation: ${namespace}.${key} [${lang}] [skip ci]`);
}

export async function approveItem(id, { editedText, reviewedBy } = {}) {
  const item = await TranslationReview.findById(id);
  if (!item) throw new Error("Translation review item not found.");
  const finalText = editedText != null && editedText !== "" ? editedText : item.translatedText;
  await writeLocaleKey({ namespace: item.namespace, lang: item.lang, key: item.key, value: finalText });
  item.translatedText = finalText;
  item.status = "approved";
  item.reviewedBy = reviewedBy || "";
  item.reviewedAt = new Date();
  await item.save();
  return item;
}

export async function rejectItem(id, { reviewedBy } = {}) {
  const item = await TranslationReview.findById(id);
  if (!item) throw new Error("Translation review item not found.");
  await writeLocaleKey({ namespace: item.namespace, lang: item.lang, key: item.key, value: null });
  item.status = "rejected";
  item.reviewedBy = reviewedBy || "";
  item.reviewedAt = new Date();
  await item.save();
  return item;
}
