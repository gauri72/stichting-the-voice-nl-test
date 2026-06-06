import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMBERSHIP_ASSETS_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "client",
  "src",
  "assets",
  "Membership"
);

const TEMPLATE_FILES = {
  email: "membership-email.html",
  receipt: "membership receipt.html"
};

const templateCache = new Map();

function loadTemplate(name) {
  if (templateCache.has(name)) return templateCache.get(name);
  const fileName = TEMPLATE_FILES[name];
  const filePath = path.join(MEMBERSHIP_ASSETS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Membership template not found: ${filePath}`);
  }
  const html = fs.readFileSync(filePath, "utf8");
  templateCache.set(name, html);
  return html;
}

/**
 * Replaces {{key}} placeholders in an HTML template.
 * @param {string} template
 * @param {Record<string, string>} values
 */
export function renderMembershipTemplate(template, values) {
  return Object.entries(values).reduce((html, [key, value]) => {
    const safe = String(value ?? "");
    return html.replaceAll(`{{${key}}}`, safe);
  }, template);
}

export function renderMembershipEmailHtml(values) {
  return renderMembershipTemplate(loadTemplate("email"), values);
}

export function renderMembershipReceiptHtml(values) {
  return renderMembershipTemplate(loadTemplate("receipt"), values);
}
