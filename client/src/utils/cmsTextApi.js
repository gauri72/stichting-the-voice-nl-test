import { apiFetch } from "./api.js";

export async function translateCmsText(text, lang) {
  const data = await apiFetch("/api/cms-text/translate", {
    method: "POST",
    body: JSON.stringify({ text, lang }),
  });
  return data.translatedText;
}
