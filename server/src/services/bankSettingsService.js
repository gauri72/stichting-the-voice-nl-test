import * as settingsService from "./settingsService.js";
import { getCategorySettings } from "./settingsService.js";

export async function getBankSettings() {
  return getCategorySettings("bank");
}

export async function getPaymentInstructions() {
  const bank = await getBankSettings();
  const general = await getCategorySettings("general");
  const lines = [];
  if (bank.accountHolderName) lines.push(`Account holder: ${bank.accountHolderName}`);
  if (bank.iban) lines.push(`IBAN: ${bank.iban}`);
  if (bank.bic) lines.push(`BIC: ${bank.bic}`);
  if (bank.bankName) lines.push(`Bank: ${bank.bankName}`);
  if (bank.manualPaymentInstructions) lines.push(bank.manualPaymentInstructions);
  return {
    ...bank,
    organizationName: general.foundationName || general.brandName,
    formatted: lines.join("\n"),
  };
}

export async function formatPaymentReference(template, vars = {}) {
  const bank = await getBankSettings();
  let ref = bank.paymentReferenceFormat || "INV-{invoice_number}";
  for (const [key, val] of Object.entries(vars)) {
    ref = ref.replace(new RegExp(`\\{${key}\\}`, "g"), String(val || ""));
  }
  return ref;
}
