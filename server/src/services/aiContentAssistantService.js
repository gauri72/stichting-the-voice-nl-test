import Anthropic from "@anthropic-ai/sdk";
import env from "../config/env.js";

export const AI_ACTIONS = {
  rewrite: "Rewrite the following text to be clearer and more engaging, keeping the same meaning and roughly the same length. Reply with only the rewritten text, no preamble.",
  shorten: "Shorten the following text to about half its length while keeping the key message. Reply with only the shortened text, no preamble.",
  expand: "Expand the following text with a bit more detail and warmth, roughly 50% longer. Reply with only the expanded text, no preamble.",
  improve_seo: "Rewrite the following text to be more SEO-friendly while staying natural and readable. Reply with only the rewritten text, no preamble.",
  generate_cta: "Suggest a short, compelling call-to-action button label (2-5 words) based on the following context. Reply with only the label text, no quotes, no preamble.",
  generate_alt_text: "Write a concise, descriptive alt text (under 125 characters) for an image based on the following context. Reply with only the alt text, no preamble.",
  generate_meta_description: "Write an SEO meta description (120-160 characters) based on the following page content. Reply with only the meta description, no preamble.",
  make_mobile_friendly: "Rewrite the following text to be shorter and punchier for a small mobile screen, keeping the core message. Reply with only the rewritten text, no preamble.",
};

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

export function isAiAssistantConfigured() {
  return Boolean(env.anthropic.apiKey);
}

export async function runAiAction(action, text) {
  const instruction = AI_ACTIONS[action];
  if (!instruction) {
    const err = new Error(`Unknown AI action: ${action}`);
    err.status = 400;
    throw err;
  }
  if (!text || !text.trim()) {
    const err = new Error("Text is required.");
    err.status = 400;
    throw err;
  }

  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [{ role: "user", content: `${instruction}\n\n---\n${text}` }],
  });

  const suggestion = message.content?.[0]?.type === "text" ? message.content[0].text.trim() : "";
  return { action, suggestion };
}
