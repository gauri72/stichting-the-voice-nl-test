import Anthropic from "@anthropic-ai/sdk";
import env from "../config/env.js";

const MODEL = "claude-sonnet-4-6";
// A full responsive HTML email with a <style> block and table layout routinely runs several
// thousand tokens once tag overhead is counted — the CMS assistant's 600-token cap (a short
// text rewrite) is far too low for this. Claude stops at </html>, so this is a ceiling, not
// a target. Confirmed via real generations that 8192 was not always enough headroom (a
// dark-theme newsletter was cut off mid-attribute at ~25K characters / ~6K tokens of HTML
// alone, before accounting for the verbose inline CSS this prompt encourages) — raised to
// 16000 accordingly, with an explicit stop_reason check below as a backstop regardless.
const MAX_TOKENS = 16000;

const TYPE_LABELS = {
  newsletter: "Newsletter",
  event_announcement: "Event Announcement",
  promotional: "Promotional",
  transactional: "Transactional",
  welcome_email: "Welcome Email",
  custom: "General",
};

const COLOR_SCHEME_INSTRUCTIONS = {
  default: "Use a clean, neutral palette: white/light-gray background, dark gray/near-black body text, a single confident accent color (blue or purple) for buttons and links.",
  dark: "Use a dark theme: near-black or very dark gray background (e.g. #0f172a), light/off-white body text, a vivid accent color (cyan, purple, or amber) for CTAs that stands out clearly against the dark background, with WCAG AA-passing contrast.",
  light: "Use a soft, airy light palette: off-white or very light pastel background, dark text for readability, and a muted pastel accent color for buttons and headers.",
  brand: "Use the organization's brand colors: deep purple (#7c3aed) and teal (#0891b2) as the primary accent colors, white or near-white background, dark slate body text.",
};

// Fixed, non-negotiable rules the model must follow regardless of what the admin types —
// kept separate from the per-request user message so they can't be diluted or skipped.
const SYSTEM_PROMPT = `You are an expert HTML email developer. You generate complete, production-ready HTML email templates.

STRICT OUTPUT RULES:
- Respond with ONLY the raw HTML document. No markdown code fences, no backticks, no explanation, no preamble, no commentary before or after.
- Your entire response must start with "<!DOCTYPE html>" or "<html" and end with "</html>".

TECHNICAL REQUIREMENTS:
- All CSS must be inline (style="...") or in a <style> block inside <head> with email-client-safe properties only. Never use external stylesheets or <link> tags.
- Use a table-based layout (role="presentation" tables) for maximum compatibility with Outlook and older email clients. Do not rely on CSS flexbox or grid for structural layout.
- The main content container must have a max-width of 600px and be centered, with the outer body/background filling the viewport.
- Be responsive: include a <meta name="viewport"> tag and use fluid widths (percentages) inside the 600px container so it degrades gracefully on mobile screens.
- Every <img> tag must include a descriptive alt attribute. Use placeholder image URLs in the form https://placehold.co/600x300?text=Description (replace "Description" with a short label of what the image should depict).
- Include at least one clear, visually prominent call-to-action button, styled with inline CSS (padding, background-color, border-radius, color), wrapped in an <a> tag with href="#".
- Write real, plausible example copy appropriate to the requested template type (not "lorem ipsum" and not literal "[placeholder]" brackets) — the admin will edit it afterward.
- Where personalization is appropriate, use merge-tag placeholders in the literal form {{first_name}}, {{discount_code}}, etc. (double curly braces, lowercase snake_case) rather than inventing your own templating syntax.
- Include a footer with an unsubscribe link placeholder (href="#") and the organization name as a placeholder, e.g. {{org_name}}.
- Do not include <script> tags or any JavaScript — email clients strip or block it.`;

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

export function isTemplateGeneratorConfigured() {
  return Boolean(env.anthropic.apiKey);
}

/**
 * Defensive only: the system prompt forbids markdown fences, but models occasionally wrap
 * output in ```html ... ``` anyway. Strip it so the admin never sees literal backticks in
 * the saved/previewed HTML.
 */
function stripMarkdownFences(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:html)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function generateTemplateHtml({ prompt, templateType, colorScheme }) {
  if (!prompt?.trim()) {
    const error = new Error("A description of the template is required.");
    error.status = 400;
    throw error;
  }

  const typeLabel = TYPE_LABELS[templateType] || TYPE_LABELS.custom;
  const colorInstruction = COLOR_SCHEME_INSTRUCTIONS[colorScheme] || COLOR_SCHEME_INSTRUCTIONS.default;

  // Structured context (type, color) goes first so the model reads it before the free-form
  // description — this ordering reliably improves instruction-following versus burying the
  // dropdown values inside the prose.
  const userMessage = [
    `Template type: ${typeLabel}`,
    `Color scheme: ${colorInstruction}`,
    "",
    "Admin's description of what this email should contain:",
    prompt.trim(),
  ].join("\n");

  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  // stop_reason === "max_tokens" means the response was cut off mid-document (confirmed via
  // a real generation that produced an unclosed style attribute) — this is a more reliable
  // truncation signal than just checking for a trailing </html>, which a model could also
  // omit on a clean-but-unusual response. Treat it as a hard failure rather than silently
  // saving broken HTML into the preview/editor.
  if (message.stop_reason === "max_tokens") {
    const error = new Error(
      "The generated template was too long and got cut off. Try a shorter or more focused description."
    );
    error.status = 502;
    throw error;
  }

  const rawText = message.content?.[0]?.type === "text" ? message.content[0].text : "";
  const html = stripMarkdownFences(rawText);

  if (!html || !/<html[\s>]/i.test(html) || !/<\/html\s*>\s*$/i.test(html)) {
    const error = new Error("The AI did not return a valid HTML template. Please try again.");
    error.status = 502;
    throw error;
  }

  return { html };
}
